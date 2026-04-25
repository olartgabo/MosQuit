import type { Zone } from '@/types';
import {
  osmRelationToPolygon,
  computeCentroid,
  computeAreaKm2,
  osmTagsToLandUse,
  osmTagsHasSensitiveLocation,
  type OverpassRelation,
} from './osmConverter';

// ─── Overpass API ────────────────────────────────────────────────────────────

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

function buildOverpassQuery(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number,
  adminLevelPattern: string
): string {
  // Overpass bbox order: (south,west,north,east) = (minLat,minLng,maxLat,maxLng)
  return `[out:json][timeout:60];(relation["boundary"="administrative"]["admin_level"~"${adminLevelPattern}"](${minLat},${minLng},${maxLat},${maxLng}););out geom qt;`;
}

async function fetchOverpass(query: string): Promise<OverpassRelation[] | null> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 65_000);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: c.signal,
      });
      if (!res.ok) continue;
      const data = await res.json();
      const relations = (data?.elements ?? []).filter(
        (e: { type: string }) => e.type === 'relation'
      ) as OverpassRelation[];
      if (relations.length > 0) return relations;
    } catch {
      // Try next endpoint
    } finally {
      clearTimeout(t);
    }
  }
  return null;
}

// ─── Adjacency ───────────────────────────────────────────────────────────────

function calcDistance(lng1: number, lat1: number, lng2: number, lat2: number): number {
  return Math.sqrt((lng2 - lng1) ** 2 + (lat2 - lat1) ** 2);
}

function calculateBaseRisk(temp: number, humidity: number, veg: number, water: number): number {
  const tempScore = temp >= 25 && temp <= 30 ? 1 : 0.5;
  const envScore = veg * 0.5 + water * 0.5;
  return Math.min(1, Math.max(0, tempScore * 0.3 + humidity * 0.4 + envScore * 0.3));
}

// ─── Main scanner ────────────────────────────────────────────────────────────

export async function scanCity(
  bbox: [number, number, number, number],
  onZoneFound?: (count: number) => void
): Promise<{ zones: Zone[]; error?: string }> {
  const [minLng, minLat, maxLng, maxLat] = bbox;

  // Try admin_level 8-10 first; fall back to 6-10 if too few results
  let relations: OverpassRelation[] | null = null;
  for (const pattern of ['^(8|9|10)$', '^(6|7|8|9|10)$']) {
    relations = await fetchOverpass(buildOverpassQuery(minLat, minLng, maxLat, maxLng, pattern));
    if (relations && relations.length >= 3) break;
  }

  if (!relations || relations.length === 0) {
    return { zones: [], error: 'No se encontraron zonas administrativas en esta área. Intenta con otra ciudad o nivel de zoom.' };
  }

  // Cap at 30 zones — build polygons and sort by area descending, then take top 30
  const withPolygons: Array<{ relation: OverpassRelation; polygon: GeoJSON.Polygon; area: number }> = [];

  for (const relation of relations) {
    const polygon = osmRelationToPolygon(relation);
    if (!polygon) continue;
    withPolygons.push({ relation, polygon, area: computeAreaKm2(polygon) });
  }

  if (withPolygons.length === 0) {
    return { zones: [], error: 'Las zonas encontradas no tienen geometría válida.' };
  }

  const top30 = withPolygons
    .sort((a, b) => b.area - a.area)
    .slice(0, 30);

  const zones: Zone[] = top30.map(({ relation, polygon, area }, idx) => {
    const id = idx + 1;
    const centroid = computeCentroid(polygon);
    const tags = relation.tags;
    const name = tags.name ?? tags['name:es'] ?? tags['name:en'] ?? `Zona ${id}`;

    // Population: use OSM tag if available, else density estimate
    const osmPop = parseInt(tags.population ?? '', 10);
    const population = isNaN(osmPop) ? Math.round(area * 3000) : osmPop;
    const populationDensity = area > 0 ? population / area : 3000;

    const landUse = osmTagsToLandUse(tags);

    // Derive environmental factors from tags/geography
    const waterNatural = tags.natural === 'water' || tags.waterway != null;
    const forested = tags.landuse === 'forest' || tags.natural === 'wood';
    const vegetation = forested ? 0.85 : landUse === 'mixed' ? 0.4 : 0.2;
    const waterProximity = waterNatural ? 0.85 : 0.25;
    const temperature = 27;
    const humidity = 0.70;

    const baseRisk = calculateBaseRisk(temperature, humidity, vegetation, waterProximity);

    return {
      id,
      name,
      geometry: polygon,
      centroid: centroid as [number, number],
      population,
      populationDensity,
      baseRisk,
      environmentalFactors: { temperature, humidity, vegetation, waterProximity },
      susceptible: population,
      infected: 0,
      recovered: 0,
      interventions: [],
      adjacentZoneIds: [],
      landUse,
      hasSensitiveLocation: osmTagsHasSensitiveLocation(tags),
    };
  });

  // Calculate adjacency
  for (const zone of zones) {
    const neighbors: number[] = [];
    for (const other of zones) {
      if (zone.id === other.id) continue;
      const d = calcDistance(zone.centroid[0], zone.centroid[1], other.centroid[0], other.centroid[1]);
      // Use zone size proxy (sqrt of area in degrees) as threshold
      const size1 = Math.sqrt(top30[zone.id - 1].area) / 111;
      const size2 = Math.sqrt(top30[other.id - 1].area) / 111;
      if (d < size1 + size2 + 0.005) neighbors.push(other.id);
    }
    zone.adjacentZoneIds = neighbors;
  }

  onZoneFound?.(zones.length);
  return { zones };
}
