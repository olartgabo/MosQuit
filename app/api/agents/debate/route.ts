import { NextRequest } from 'next/server';
import { runDebate, DebateEvent } from '@/lib/agents/orchestrator';
import type { ResourceConstraints, Zone } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface DebateBody {
  zones: Zone[];
  constraints: ResourceConstraints;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as DebateBody;

  if (!body?.zones?.length || !body?.constraints) {
    return new Response(JSON.stringify({ error: 'zones and constraints required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (evt: DebateEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
      };

      try {
        await runDebate(body.zones, body.constraints, send);
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
