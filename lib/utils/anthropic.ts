import Anthropic from '@anthropic-ai/sdk';

export const MODEL_ID = 'claude-opus-4-7';

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  _client = new Anthropic({ apiKey });
  return _client;
}

export type CachedTextBlock = {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
};

export function cachedSystem(text: string): CachedTextBlock[] {
  return [{ type: 'text', text, cache_control: { type: 'ephemeral' } }];
}
