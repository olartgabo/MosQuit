import type { Zone } from '@/types';

// ─── Overpass response types ─────────────────────────────────────────────────

export interface OverpassMember {
  type: 'node' | 'way' | 'relation';
  ref: number;
  role: string;
  geometry?: Array<{ lat: number; lon: number }>;
}

export interface OverpassRelation {
  type: 'relation';
  id: number;
  tags: Record<string, string>;
  members: OverpassMember[];
}

// ─── Way geometry joining ────────────────────────────────────────────────────

function coordKey(lat: number, lon: number) {
  return `${lat.toFixed(6)},${lon.toFixed(6)}`;
}

export function joinWayGeometries(
  members: OverpassMember[]
): Array<[number, number]> | null {
  const outerWays = members.filter(
    (m) => m.type === 'way' && m.role === 'outer' && m.geometry && m.geometry.length >= 2
  );
  if (outerWays.length === 0) return null;

  // Single way — just return its coordinates
  if (outerWays.length === 1) {
    const coords = outerWays[0].geometry!.map(
      (n): [number, number] => [n.lon, n.lat]
    );
    if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
      coords.push(coords[0]);
    }
    return coords;
  }

  // Multiple ways — chain them end-to-end
  const wayArrays = outerWays.map((w) =>
    w.geometry!.map((n): [number, number] => [n.lon, n.lat])
  );

  const ring: [number, number][] = [...wayArrays[0]];
  const used = new Set([0]);

  for (let pass = 0; pass < wayArrays.length - 1; pass++) {
    const lastPt = ring[ring.length - 1];
    let connected = false;

    for (let i = 0; i < wayArrays.length; i++) {
      if (used.has(i)) continue;
      const way = wayArrays[i];
      const firstKey = coordKey(way[0][1], way[0][0]);
      const lastKey = coordKey(way[way.length - 1][1], way[way.length - 1][0]);
      const ringLastKey = coordKey(lastPt[1], lastPt[0]);

      if (firstKey === ringLastKey) {
        ring.push(...way.slice(1));
        used.add(i);
        connected = true;
        break;
      } else if (lastKey === ringLastKey) {
        ring.push(...[...way].reverse().slice(1));
        used.add(i);
        connected = true;
        break;
      }
    }

    if (!connected) {
      // Append remaining way even if not perfectly connected (best-effort)
      for (let i = 0; i < wayArrays.length; i++) {
        if (!used.has(i)) {
          ring.push(...wayArrays[i]);
          used.add(i);
          break;
        }
      }
    }
  }

  // Close the ring
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring.push(ring[0]);
  }

  return ring.length >= 4 ? ring : null;
}

// ─── Polygon conversion ──────────────────────────────────────────────────────

export function osmRelationToPolygon(
  relation: OverpassRelation
): GeoJSON.Polygon | null {
  const ring = joinWayGeometries(relation.members);
  if (!ring || ring.length < 4) return null;
  return { type: 'Polygon', coordinates: [ring] };
}

// ─── Geometric helpers ───────────────────────────────────────────────────────

export function computeCentroid(polygon: GeoJSON.Polygon): [number, number] {
  const ring = polygon.coordinates[0];
  let sumLng = 0;
  let sumLat = 0;
  const n = ring.length - 1; // exclude closing vertex
  for (let i = 0; i < n; i++) {
    sumLng += ring[i][0];
    sumLat += ring[i][1];
  }
  return [sumLng / n, sumLat / n];
}

export function computeAreaKm2(polygon: GeoJSON.Polygon): number {
  const ring = polygon.coordinates[0];
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    area += ring[i][0] * ring[i + 1][1];
    area -= ring[i + 1][0] * ring[i][1];
  }
  // Convert from degrees² to km² (111.32 km per degree approximation)
  return Math.abs(area / 2) * 111.32 * 111.32;
}

// ─── OSM tag helpers ─────────────────────────────────────────────────────────

export function osmTagsToLandUse(tags: Record<string, string>): Zone['landUse'] {
  const lu = tags.landuse ?? '';
  const place = tags.place ?? '';
  const amenity = tags.amenity ?? '';

  if (lu === 'industrial' || lu === 'port' || lu === 'railway') return 'industrial';
  if (lu === 'commercial' || lu === 'retail' || amenity === 'marketplace') return 'commercial';
  if (lu === 'residential' || place === 'suburb' || place === 'neighbourhood') return 'residential';
  if (lu === 'mixed' || place === 'quarter') return 'mixed';
  // Defaults based on common patterns
  if (lu === 'farmland' || lu === 'forest' || lu === 'meadow') return 'mixed';
  return 'mixed';
}

export function osmTagsHasSensitiveLocation(tags: Record<string, string>): boolean {
  const amenity = tags.amenity ?? '';
  const healthcare = tags.healthcare ?? '';
  const building = tags.building ?? '';
  const name = (tags.name ?? '').toLowerCase();
  const sensitive = ['hospital', 'school', 'clinic', 'doctors', 'pharmacy', 'kindergarten', 'university', 'college'];
  return (
    sensitive.includes(amenity) ||
    sensitive.includes(healthcare) ||
    sensitive.includes(building) ||
    sensitive.some((s) => name.includes(s))
  );
}
