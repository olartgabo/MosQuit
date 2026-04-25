import { NextRequest } from 'next/server';
import type { ScannedCity, WetlandPoint, Zone } from '@/types';
import { scanCity } from '@/lib/city/scanner';
import { enrichZoneWithExtendedData, fetchElevationsBatch } from '@/lib/intelligence/enrichment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface ScanBody {
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  cityName: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ScanBody;

  if (!body?.bbox || !body?.cityName) {
    return new Response(JSON.stringify({ error: 'bbox and cityName required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Phase 1: Boundaries
        send({
          type: 'progress',
          phase: 'fetching_boundaries',
          message: 'Consultando límites administrativos en OpenStreetMap…',
          zonesFound: 0,
          zonesEnriched: 0,
          totalZones: 0,
        });

        const { zones: rawZones, error } = await scanCity(body.bbox);

        if (error || rawZones.length === 0) {
          send({ type: 'error', message: error ?? 'No se encontraron zonas.' });
          controller.close();
          return;
        }

        send({ type: 'zones_ready', zones: rawZones });
        send({
          type: 'progress',
          phase: 'enriching',
          message: `Enriqueciendo ${rawZones.length} zonas con datos satelitales y climáticos…`,
          zonesFound: rawZones.length,
          zonesEnriched: 0,
          totalZones: rawZones.length,
        });

        // Phase 2: Batch elevation
        const centroids = rawZones.map((z) => ({
          id: z.id,
          lat: z.centroid[1],
          lng: z.centroid[0],
        }));
        const elevations = await fetchElevationsBatch(centroids);

        // Phase 3: Per-zone enrichment in parallel
        let enrichedCount = 0;
        const enrichedZones: Zone[] = [];

        await Promise.allSettled(
          rawZones.map(async (zone) => {
            const elevation_m = elevations[zone.id];
            try {
              const extendedData = await enrichZoneWithExtendedData(zone, elevation_m);
              const enrichedZone: Zone = { ...zone, extendedData };
              enrichedZones.push(enrichedZone);
              enrichedCount++;
              send({ type: 'zone_enriched', zone: enrichedZone });
              send({
                type: 'progress',
                phase: 'enriching',
                message: `Enriqueciendo zonas…`,
                zonesFound: rawZones.length,
                zonesEnriched: enrichedCount,
                totalZones: rawZones.length,
              });
            } catch {
              // Zone enrichment failed — still include it without extended data
              enrichedZones.push(zone);
              enrichedCount++;
            }
          })
        );

        // Phase 4: Wetland detection points
        const wetlandPoints: WetlandPoint[] = enrichedZones
          .filter((z) => (z.extendedData?.ndwi ?? -1) > 0.2)
          .map((z) => ({
            id: `wetland-${z.id}`,
            centroid: z.centroid,
            ndwi: z.extendedData!.ndwi,
            flightRadius_m: z.extendedData!.flightRadius_m,
            zoneId: z.id,
            zoneName: z.name,
          }));

        send({ type: 'wetland_points', points: wetlandPoints });

        const [minLng, minLat, maxLng, maxLat] = body.bbox;
        const center: [number, number] = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];

        // Derive country code from city name (best-effort: last word/token)
        const parts = body.cityName.split(',');
        const countryCode = parts[parts.length - 1].trim().slice(0, 2).toUpperCase();

        const scannedCity: ScannedCity = {
          name: body.cityName,
          countryCode,
          bbox: body.bbox,
          center,
          zones: enrichedZones,
          wetlandPoints,
          scannedAt: new Date().toISOString(),
        };

        send({ type: 'complete', city: scannedCity });
      } catch (err) {
        send({ type: 'error', message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  });
}
