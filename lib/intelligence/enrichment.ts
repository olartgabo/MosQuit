import type { ExtendedEnvironmentalData, WetlandClass, Zone } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function offsetDate(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function zoneBbox(geometry: GeoJSON.Polygon): [number, number, number, number] {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const ring of geometry.coordinates) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return [minLng, minLat, maxLng, maxLat];
}

// ─── Satellite (Sentinel-2 via AWS Element84 + TiTiler) ──────────────────────

const STAC_ENDPOINT = 'https://earth-search.aws.element84.com/v1/search';
const TITILER_ENDPOINT = 'https://titiler.xyz/stac/statistics';

async function fetchSentinelBands(
  bbox: [number, number, number, number],
  dateFrom: string,
  dateTo: string
): Promise<{ ndwi: number; ndvi: number } | null> {
  const tryScene = async (from: string, to: string) => {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 10_000);
    try {
      const res = await fetch(STAC_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          collections: ['sentinel-2-l2a'],
          bbox,
          datetime: `${from}/${to}`,
          query: { 'eo:cloud_cover': { lt: 30 } },
          sortby: [{ field: 'datetime', direction: 'desc' }],
          limit: 1,
        }),
        signal: c.signal,
      });
      if (!res.ok) return null;
      const data = await res.json();
      const feature = data?.features?.[0];
      if (!feature) return null;
      return {
        itemId: feature.id as string,
        collectionId: (feature.collection ?? 'sentinel-2-l2a') as string,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  };

  const scene = (await tryScene(dateFrom, dateTo)) ?? (await tryScene(offsetDate(dateTo, -60), dateTo));
  if (!scene) return null;

  const itemUrl = `https://earth-search.aws.element84.com/v1/collections/${scene.collectionId}/items/${scene.itemId}`;
  const params = new URLSearchParams({
    url: itemUrl,
    assets: 'B03,B04,B08',
    bbox: bbox.join(','),
    max_size: '512',
  });

  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 15_000);
  try {
    const res = await fetch(`${TITILER_ENDPOINT}?${params}`, { signal: c.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const b03 = data?.B03?.statistics?.mean as number | undefined;
    const b04 = data?.B04?.statistics?.mean as number | undefined;
    const b08 = data?.B08?.statistics?.mean as number | undefined;
    if (b03 == null || b04 == null || b08 == null) return null;

    const g = b03 / 10000;
    const r = b04 / 10000;
    const nir = b08 / 10000;
    const dw = g + nir;
    const dv = nir + r;
    return {
      ndwi: dw > 0 ? (g - nir) / dw : 0,
      ndvi: dv > 0 ? (nir - r) / dv : 0,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// ─── Weather (Open-Meteo) ────────────────────────────────────────────────────

interface WeatherData {
  temperature_mean_c: number;
  humidity_mean_pct: number;
  soil_moisture_mean: number;
  precipitation_14d_mm: number;
  precipitation_48h_mm: number;
  windspeed_max_kmh: number;
}

function defaultWeather(): WeatherData {
  return {
    temperature_mean_c: 28,
    humidity_mean_pct: 70,
    soil_moisture_mean: 0.2,
    precipitation_14d_mm: 40,
    precipitation_48h_mm: 5,
    windspeed_max_kmh: 8,
  };
}

async function fetchWeatherAll(lat: number, lng: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    daily: 'precipitation_sum,temperature_2m_max,temperature_2m_min,windspeed_10m_max',
    hourly: 'relative_humidity_2m,soil_moisture_0_to_7cm',
    past_days: '14',
    forecast_days: '1',
    timezone: 'auto',
  });

  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10_000);
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: c.signal });
    if (!res.ok) return defaultWeather();
    const data = await res.json();

    const dailyPrec: number[] = data?.daily?.precipitation_sum ?? [];
    const dailyTmax: number[] = data?.daily?.temperature_2m_max ?? [];
    const dailyTmin: number[] = data?.daily?.temperature_2m_min ?? [];
    const dailyWind: number[] = data?.daily?.windspeed_10m_max ?? [];
    const hourlyHum: number[] = data?.hourly?.relative_humidity_2m ?? [];
    const hourlySoil: number[] = data?.hourly?.soil_moisture_0_to_7cm ?? [];

    const precipitation_14d_mm = dailyPrec.reduce((s, v) => s + (v ?? 0), 0);
    const precipitation_48h_mm = dailyPrec.slice(-2).reduce((s, v) => s + (v ?? 0), 0);

    const temperature_mean_c =
      dailyTmax.length > 0
        ? dailyTmax.reduce((s, v, i) => s + ((v + (dailyTmin[i] ?? v)) / 2), 0) / dailyTmax.length
        : 28;

    const validHum = hourlyHum.filter((v) => v != null);
    const humidity_mean_pct =
      validHum.length > 0 ? validHum.reduce((s, v) => s + v, 0) / validHum.length : 70;

    const validSoil = hourlySoil.filter((v) => v != null);
    const soil_moisture_mean =
      validSoil.length > 0 ? validSoil.reduce((s, v) => s + v, 0) / validSoil.length : 0.2;

    const windspeed_max_kmh = dailyWind.slice(-7).reduce((max, v) => Math.max(max, v ?? 0), 0);

    return {
      temperature_mean_c,
      humidity_mean_pct,
      soil_moisture_mean,
      precipitation_14d_mm,
      precipitation_48h_mm,
      windspeed_max_kmh,
    };
  } catch {
    return defaultWeather();
  } finally {
    clearTimeout(t);
  }
}

// ─── Derived metric computations ─────────────────────────────────────────────

function classifyWetland(ndwi: number): WetlandClass {
  if (ndwi > 0.3) return 'open_water';
  if (ndwi > 0.1) return 'marsh_wetland';
  if (ndwi > -0.1) return 'moist_vegetation';
  return 'dry_land';
}

function compositeBreedingScore(ndwi: number, ndvi: number, rain: number, elev: number): number {
  const nw = clamp((ndwi + 0.3) / 0.9, 0, 1);
  const nv = clamp(ndvi / 0.8, 0, 1);
  const nr = clamp(rain / 100, 0, 1);
  const ne = 1 - clamp(elev / 50, 0, 1);
  return nw * 0.35 + nv * 0.2 + nr * 0.3 + ne * 0.15;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function enrichZoneWithExtendedData(
  zone: Pick<Zone, 'id' | 'centroid' | 'geometry' | 'population' | 'environmentalFactors'>,
  elevation_m?: number
): Promise<ExtendedEnvironmentalData> {
  const today = new Date().toISOString().split('T')[0];
  const dateFrom = offsetDate(today, -30);
  const bbox = zoneBbox(zone.geometry);
  const [lng, lat] = zone.centroid;

  // Satellite + weather in parallel
  const [bandsResult, weatherResult] = await Promise.allSettled([
    fetchSentinelBands(bbox, dateFrom, today),
    fetchWeatherAll(lat, lng),
  ]);

  const elev = elevation_m ?? (3 + (zone.id % 7));
  const bands = bandsResult.status === 'fulfilled' ? bandsResult.value : null;
  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : defaultWeather();

  const ef = zone.environmentalFactors;
  const ndwi = bands?.ndwi ?? clamp(ef.waterProximity * 0.6 - 0.1, -0.3, 0.6);
  const ndvi = bands?.ndvi ?? clamp(ef.vegetation * 0.7, 0, 0.7);
  const dataSource: ExtendedEnvironmentalData['dataSource'] = bands ? 'satellite' : 'fallback';

  const wetlandClass = classifyWetland(ndwi);
  const incubationDays = Math.round(clamp(10 - Math.max(0, (weather.temperature_mean_c - 25) * 0.6), 7, 14));

  const ndwi_norm = clamp((ndwi + 1) / 2, 0, 1);
  const breteauIndex = clamp(
    ndwi_norm * 40 + (weather.precipitation_14d_mm / 100) * 30 + Math.max(0, weather.temperature_mean_c - 20) * 2,
    0,
    100
  );
  const breteauLevel: ExtendedEnvironmentalData['breteauLevel'] =
    breteauIndex < 5 ? 'low' : breteauIndex < 20 ? 'moderate' : 'high';

  const tempScore =
    weather.temperature_mean_c >= 25 && weather.temperature_mean_c <= 35
      ? 1.0
      : weather.temperature_mean_c >= 20
        ? 0.6
        : 0.2;
  const humScore = clamp((weather.humidity_mean_pct - 40) / 50, 0, 1);
  const waterScore = clamp((ndwi + 0.3) / 0.9, 0, 1);
  const riskFactor = tempScore * 0.35 + humScore * 0.35 + waterScore * 0.3;

  const estimatedActiveCases = Math.round(zone.population * riskFactor * 0.002);
  const estimatedHistoricalCases = Math.round(estimatedActiveCases * 8);
  const flightRadius_m = 50 + ndwi_norm * 350;

  return {
    temperature_mean_c: weather.temperature_mean_c,
    humidity_mean_pct: weather.humidity_mean_pct,
    soil_moisture_mean: weather.soil_moisture_mean,
    precipitation_14d_mm: weather.precipitation_14d_mm,
    precipitation_48h_mm: weather.precipitation_48h_mm,
    windspeed_max_kmh: weather.windspeed_max_kmh,
    ndwi,
    ndvi,
    elevation_m: elev,
    wetlandClass,
    incubationDays,
    breteauIndex,
    breteauLevel,
    estimatedActiveCases,
    estimatedHistoricalCases,
    flightRadius_m,
    compositeBreedingScore: compositeBreedingScore(ndwi, ndvi, weather.precipitation_14d_mm, elev),
    dataSource,
    fetchedAt: new Date().toISOString(),
  };
}

// ─── Elevation batch (re-exported for scan route) ────────────────────────────

export async function fetchElevationsBatch(
  centroids: Array<{ id: number; lat: number; lng: number }>
): Promise<Record<number, number>> {
  if (centroids.length === 0) return {};
  const locations = centroids.map((c) => `${c.lat},${c.lng}`).join('|');
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 12_000);
  try {
    const res = await fetch(
      `https://api.opentopodata.org/v1/srtm30m?locations=${encodeURIComponent(locations)}`,
      { signal: c.signal }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const results: Array<{ elevation: number | null }> = data?.results ?? [];
    const map: Record<number, number> = {};
    results.forEach((r, i) => {
      if (centroids[i] && r.elevation != null) map[centroids[i].id] = r.elevation;
    });
    return map;
  } catch {
    return {};
  } finally {
    clearTimeout(t);
  }
}
