import { NextRequest } from 'next/server';
import { enrichZonesWithBreedingData } from '@/lib/intelligence/breeding';
import type { BreedingIntelligenceRequest } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<Response> {
  let body: BreedingIntelligenceRequest;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body?.zones) || body.zones.length === 0) {
    return Response.json({ error: 'zones array required' }, { status: 400 });
  }

  try {
    const result = await enrichZonesWithBreedingData(body);
    return Response.json(result);
  } catch (err) {
    // Never let this route 500 during demo — return fallback data
    console.error('[breeding/route] unhandled error:', err);
    return Response.json(
      {
        enrichedZones: [],
        metadata: {
          dataSource: 'fallback',
          sceneDates: {},
          durationMs: 0,
          cached: false,
        },
      },
      { status: 200 }
    );
  }
}
