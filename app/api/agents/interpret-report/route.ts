import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

const MODEL_ID = 'claude-3-5-sonnet-20241022'; // Use a cheaper model for simple NLP

export async function POST(req: NextRequest) {
  const { text, zones } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const zoneNames = zones.map((z: any) => `#${z.id}: ${z.name}`).join(', ');

  const prompt = `You are a public health data interpreter. 
A citizen reported: "${text}"

Available city zones: ${zoneNames}

Identify which zones are mentioned in the report. For each mentioned zone, estimate a risk increase factor (0.0 to 0.5) based on the severity of the report (e.g., "many mosquitoes" = 0.3, "outbreak" = 0.5, "some mosquitoes" = 0.1).

Return ONLY a JSON array of objects: [{"zoneId": number, "increase": number, "reason": string}]
If no zones match, return [].`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL_ID,
      max_tokens: 500,
      system: "You output strictly valid JSON.",
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');
    
    // Simple JSON extraction
    const jsonMatch = content.text.match(/\[.*\]/s);
    const results = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ results });
  } catch (err) {
    console.error('NLP Report Error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
