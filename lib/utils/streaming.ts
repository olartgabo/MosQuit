import type { DebateEvent } from '@/lib/agents/orchestrator';

export async function consumeDebateStream(
  response: Response,
  onEvent: (evt: DebateEvent) => void
): Promise<void> {
  if (!response.body) throw new Error('No response body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nlIndex: number;
    while ((nlIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, nlIndex);
      buffer = buffer.slice(nlIndex + 2);
      const line = rawEvent.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      const payload = line.slice(6).trim();
      if (!payload) continue;
      try {
        const evt = JSON.parse(payload) as DebateEvent;
        onEvent(evt);
      } catch {
        /* ignore malformed */
      }
    }
  }
}
