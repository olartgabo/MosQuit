import type {
  BreedingIntelligenceRequest,
  BreedingIntelligenceResponse,
  BreedingRiskScore,
  Zone,
} from '@/types';

// ============================================================================
// STAC / BAND STATS
// ============================================================================

const STAC_ENDPOINT = 'https://earth-search.aws.element84.com/v1/search';
const TITILER_ENDPOINT = 'https://titiler.xyz/stac/statistics';

async function findSentinel2Scene(
  bbox: [number, number, number, number],
  dateFrom: string,
  dateTo: string
): Promise<{ itemId: string; collectionId: string; sceneDate: string } | null> {
  const trySearch = async (from: string, to: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
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
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const data = await res.json();
      const feature = data?.features?.[0];
      if (!feature) return null;
      return {
        itemId: feature.id as string,
        collectionId: (feature.collection ?? 'sentinel-2-l2a') as string,
        sceneDate: (feature.properties?.datetime ?? from) as string,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };

  // Try 30-day window first, then widen to 60 days
  return (await trySearch(dateFrom, dateTo)) ?? (await trySearch(offsetDate(dateTo, -60), dateTo));
}

async function fetchBandStats(
  itemId: string,
  collectionId: string,
  bbox: [number, number, number, number]
): Promise<{ ndwi: number; ndvi: number } | null> {
  const itemUrl = `https://earth-search.aws.element84.com/v1/collections/${collectionId}/items/${itemId}`;
  const params = new URLSearchParams({
    url: itemUrl,
    assets: 'B03,B04,B08',
    bbox: bbox.join(','),
    max_size: '512',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${TITILER_ENDPOINT}?${params}`, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();

    // TiTiler returns { B03: { statistics: { mean, min, max, ... } }, ... }
    const b03 = data?.B03?.statistics?.mean as number | undefined;
    const b04 = data?.B04?.statistics?.mean as number | undefined;
    const b08 = data?.B08?.statistics?.mean as number | undefined;

    if (b03 == null || b04 == null || b08 == null) return null;

    // Sentinel-2 L2A reflectance values are in 0–10000 range; normalize to 0–1
    const g = b03 / 10000;
    const r = b04 / 10000;
    const nir = b08 / 10000;

    const denom_ndwi = g + nir;
    const denom_ndvi = nir + r;

    const ndwi = denom_ndwi > 0 ? (g - nir) / denom_ndwi : 0;
    const ndvi = denom_ndvi > 0 ? (nir - r) / denom_ndvi : 0;

    return { ndwi, ndvi };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================================
// RAINFALL (Open-Meteo)
// ============================================================================

async function fetchRainfall(lat: number, lng: number, daysBack = 14): Promise<number> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    daily: 'precipitation_sum',
    past_days: daysBack.toString(),
    forecast_days: '1',
    timezone: 'auto',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: controller.signal,
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const sums: number[] = data?.daily?.precipitation_sum ?? [];
    return sums.reduce((acc, v) => acc + (v ?? 0), 0);
  } catch {
    return 0;
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================================
// ELEVATION (OpenTopoData — batched for all zones in one request)
// ============================================================================

async function fetchElevations(
  centroids: Array<{ id: number; lat: number; lng: number }>
): Promise<Record<number, number>> {
  const locations = centroids.map((c) => `${c.lat},${c.lng}`).join('|');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(
      `https://api.opentopodata.org/v1/srtm30m?locations=${encodeURIComponent(locations)}`,
      { signal: controller.signal }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const results: Array<{ elevation: number | null }> = data?.results ?? [];
    const map: Record<number, number> = {};
    results.forEach((r, i) => {
      if (centroids[i] && r.elevation != null) {
        map[centroids[i].id] = r.elevation;
      }
    });
    return map;
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

// ============================================================================
// COMPOSITE SCORE
// ============================================================================

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function computeCompositeBreedingScore(
  ndwi: number,
  ndvi: number,
  rainfall_mm: number,
  elevation_m: number
): number {
  const ndwi_norm = clamp((ndwi + 0.3) / 0.9, 0, 1);
  const ndvi_norm = clamp(ndvi / 0.8, 0, 1);
  const rain_norm = clamp(rainfall_mm / 100, 0, 1);
  const elev_norm = 1 - clamp(elevation_m / 50, 0, 1);

  return ndwi_norm * 0.35 + ndvi_norm * 0.2 + rain_norm * 0.3 + elev_norm * 0.15;
}

// ============================================================================
// FALLBACK GENERATOR
// ============================================================================

export function generateFallbackBreedingRisk(zone: Zone): BreedingRiskScore {
  const { humidity, vegetation, waterProximity } = zone.environmentalFactors;

  // Derive plausible satellite proxies from existing environmental factors
  const ndwi = clamp(waterProximity * 0.6 - 0.1, -0.3, 0.6);
  const ndvi = clamp(vegetation * 0.7, 0, 0.7);
  const recentRainfall_mm = clamp(humidity * 60, 0, 100);
  // Manila is coastal, use zone id as seed for slight variation around 5m
  const elevation_m = 3 + (zone.id % 7);

  return {
    ndwi,
    ndvi,
    recentRainfall_mm,
    elevation_m,
    compositeBreedingScore: computeCompositeBreedingScore(ndwi, ndvi, recentRainfall_mm, elevation_m),
    dataSource: 'fallback',
    fetchedAt: new Date().toISOString(),
  };
}

// ============================================================================
// ZONE BBOX HELPER
// ============================================================================

function zoneBbox(geometry: Zone['geometry']): [number, number, number, number] {
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

function offsetDate(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ============================================================================
// MODULE-LEVEL CACHE
// ============================================================================

interface CacheEntry {
  result: BreedingIntelligenceResponse;
  ts: number;
}

const breedingCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function cacheKey(zoneIds: number[], dateKey: string): string {
  return `${[...zoneIds].sort((a, b) => a - b).join(',')}_${dateKey}`;
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export async function enrichZonesWithBreedingData(
  req: BreedingIntelligenceRequest
): Promise<BreedingIntelligenceResponse> {
  const start = Date.now();
  const today = new Date().toISOString().split('T')[0];
  const dateFrom = req.dateRange?.from ?? offsetDate(today, -30);
  const dateTo = req.dateRange?.to ?? today;

  const zoneIds = req.zones.map((z) => z.id);
  const key = cacheKey(zoneIds, today);
  const cached = breedingCache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { ...cached.result, metadata: { ...cached.result.metadata, cached: true } };
  }

  // Fetch elevations in one batched request
  const centroids = req.zones.map((z) => ({ id: z.id, lat: z.centroid[1], lng: z.centroid[0] }));
  const elevations = await fetchElevations(centroids);

  // Per-zone parallel enrichment (allSettled so one failure doesn't block others)
  const sceneDates: Record<number, string> = {};
  let satelliteCount = 0;

  const enriched = await Promise.allSettled(
    req.zones.map(async (z) => {
      const bbox = zoneBbox(z.geometry);
      const elevation_m = elevations[z.id] ?? (3 + (z.id % 7));

      const scene = await findSentinel2Scene(bbox, dateFrom, dateTo);
      if (!scene) {
        return { zoneId: z.id, breedingRisk: null };
      }

      const bands = await fetchBandStats(scene.itemId, scene.collectionId, bbox);
      if (!bands) {
        return { zoneId: z.id, breedingRisk: null };
      }

      const rainfall = await fetchRainfall(z.centroid[1], z.centroid[0]);
      sceneDates[z.id] = scene.sceneDate;
      satelliteCount++;

      const score: BreedingRiskScore = {
        ndwi: bands.ndwi,
        ndvi: bands.ndvi,
        recentRainfall_mm: rainfall,
        elevation_m,
        compositeBreedingScore: computeCompositeBreedingScore(bands.ndwi, bands.ndvi, rainfall, elevation_m),
        dataSource: 'satellite',
        fetchedAt: new Date().toISOString(),
      };
      return { zoneId: z.id, breedingRisk: score };
    })
  );

  // Build final enriched list — zones that failed satellite get null (caller applies fallback)
  const enrichedZones: BreedingIntelligenceResponse['enrichedZones'] = enriched.map((r, i) => {
    if (r.status === 'fulfilled' && r.value.breedingRisk) {
      return { zoneId: r.value.zoneId, breedingRisk: r.value.breedingRisk };
    }
    // Fallback: derive from zone environmental factors
    const zone = req.zones[i];
    // We only have id/centroid/geometry — build a minimal Zone-like for the fallback
    const mockZone = {
      id: zone.id,
      environmentalFactors: { humidity: 0.75, vegetation: 0.5, waterProximity: 0.5, temperature: 30 },
    } as Zone;
    return { zoneId: zone.id, breedingRisk: generateFallbackBreedingRisk(mockZone) };
  });

  const dataSource: BreedingIntelligenceResponse['metadata']['dataSource'] =
    satelliteCount === 0 ? 'fallback' : satelliteCount < req.zones.length ? 'partial' : 'satellite';

  const result: BreedingIntelligenceResponse = {
    enrichedZones,
    metadata: {
      dataSource,
      sceneDates,
      durationMs: Date.now() - start,
      cached: false,
    },
  };

  breedingCache.set(key, { result, ts: Date.now() });
  return result;
}
