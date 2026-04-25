import { getAnthropic, MODEL_ID, cachedSystem } from '@/lib/utils/anthropic';
import {
  AGENT_PERSONALITIES,
  buildBreedingZoneBrief,
  buildZoneBrief,
  CONSENSUS_SCHEMA,
  CRITIQUE_SCHEMA,
  ENVIRONMENTAL_MONITOR_SCHEMA,
  PROPOSAL_SCHEMA,
  RESPONSE_SCHEMA,
  systemPromptFor,
} from './prompts';
import { extractJson } from './parser';
import type {
  AgentCritique,
  AgentProposal,
  AgentResponse,
  AgentType,
  ConsensusPlan,
  EnvironmentalAssessment,
  ResourceConstraints,
  Zone,
} from '@/types';

const AGENT_ORDER: AgentType[] = ['epidemiologist', 'budget', 'operations', 'public_risk'];

export type DebateEvent =
  | { type: 'phase'; phase: 'intelligence' | 'proposing' | 'critiquing' | 'responding' | 'consensus' | 'complete' }
  | { type: 'agent_start'; agent: AgentType }
  | { type: 'agent_delta'; agent: AgentType; delta: string }
  | { type: 'agent_thinking'; agent: AgentType; delta: string }
  | { type: 'environmental_assessment'; assessment: EnvironmentalAssessment }
  | { type: 'proposal'; proposal: AgentProposal }
  | { type: 'critique'; critique: AgentCritique }
  | { type: 'response'; response: AgentResponse }
  | { type: 'consensus'; plan: ConsensusPlan }
  | { type: 'error'; message: string };

export type DebateEmit = (evt: DebateEvent) => void;

interface StreamResult {
  text: string;
  thinking: string;
}

async function streamMessage(params: {
  system: string;
  user: string;
  agent: AgentType | null;
  emit: DebateEmit;
  maxTokens?: number;
  withThinking?: boolean;
}): Promise<StreamResult> {
  const anthropic = getAnthropic();
  const { system, user, agent, emit, maxTokens = 2000, withThinking = false } = params;

  const req: Record<string, unknown> = {
    model: MODEL_ID,
    max_tokens: maxTokens,
    system: cachedSystem(system),
    messages: [{ role: 'user', content: user }],
  };
  if (withThinking) {
    req.thinking = { type: 'enabled', budget_tokens: 1024 };
  }
  const stream = await anthropic.messages.stream(
    req as unknown as Parameters<typeof anthropic.messages.stream>[0]
  );

  let fullText = '';
  let fullThinking = '';

  for await (const evt of stream) {
    if (evt.type === 'content_block_delta') {
      const delta = evt.delta as { type: string; text?: string; thinking?: string };
      if (delta.type === 'text_delta' && delta.text) {
        fullText += delta.text;
        if (agent) emit({ type: 'agent_delta', agent, delta: delta.text });
      } else if (delta.type === 'thinking_delta' && delta.thinking) {
        fullThinking += delta.thinking;
        if (agent) emit({ type: 'agent_thinking', agent, delta: delta.thinking });
      }
    }
  }

  return { text: fullText, thinking: fullThinking };
}

export async function runDebate(
  zones: Zone[],
  constraints: ResourceConstraints,
  emit: DebateEmit,
  cityContext?: { name: string; countryCode: string }
): Promise<{ consensusPlan: ConsensusPlan; proposals: AgentProposal[]; environmentalAssessment: EnvironmentalAssessment | null }> {
  const brief = buildZoneBrief(zones, cityContext);
  const constraintsBlock = `CONSTRAINTS:
- Teams available: ${constraints.availableTeams}
- Budget: $${constraints.budgetTotal.toLocaleString()}
- Cost per zone: $${constraints.fumigationCostPerZone.toLocaleString()}
- Max fundable zones: ${Math.floor(constraints.budgetTotal / constraints.fumigationCostPerZone)}
- Time window: ${constraints.timeWindow}h`;

  // ---------- PHASE 0: ENVIRONMENTAL INTELLIGENCE ----------
  emit({ type: 'phase', phase: 'intelligence' });
  emit({ type: 'agent_start', agent: 'environmental_monitor' });

  let environmentalAssessment: EnvironmentalAssessment | null = null;
  let envIntelligenceBlock = '';

  try {
    const breedingBrief = buildBreedingZoneBrief(zones, cityContext);
    const envSystem = systemPromptFor('environmental_monitor');
    const envUser = `${breedingBrief}

${constraintsBlock}

TASK: Analyze the satellite and environmental data above. Identify which zones are actively generating mosquitoes based on the indicators provided. Your analysis will be shown to four fumigation advisors before they make their proposals. Focus on breeding source identification, not fumigation scheduling.

${ENVIRONMENTAL_MONITOR_SCHEMA}`;

    const { text: envText } = await streamMessage({
      system: envSystem,
      user: envUser,
      agent: 'environmental_monitor',
      emit,
      maxTokens: 1200,
      withThinking: true,
    });

    try {
      environmentalAssessment = extractJson<EnvironmentalAssessment>(envText);
      emit({ type: 'environmental_assessment', assessment: environmentalAssessment });

      envIntelligenceBlock = `
ENVIRONMENTAL INTELLIGENCE (Dr. Reyes, satellite pre-analysis):
Breeding hotspots detected: [${environmentalAssessment.predictedBreedingHotspots.join(', ')}]
Analysis: ${environmentalAssessment.reasoning}
Source reduction targets: ${environmentalAssessment.sourceReductionTargets.map(t => `Zone ${t.zoneId} (${t.primaryIndicator}=${t.value.toFixed(2)}, ${t.urgency})`).join(', ')}
NOTE: Consider whether your zone choices also address BREEDING SOURCE zones, not just current infection spread.`;
    } catch (e) {
      emit({ type: 'error', message: `Environmental assessment parse failed: ${(e as Error).message}` });
    }
  } catch (e) {
    emit({ type: 'error', message: `Phase 0 failed: ${(e as Error).message}` });
  }

  // ---------- PHASE 1: PROPOSALS (parallel) ----------
  emit({ type: 'phase', phase: 'proposing' });

  const proposals = await Promise.all(
    AGENT_ORDER.map(async (agent) => {
      emit({ type: 'agent_start', agent });
      const system = systemPromptFor(agent);
      const user = `${brief}
${envIntelligenceBlock}

${constraintsBlock}

TASK: Propose your intervention plan. Do NOT try to compromise yet — you'll get to argue with the others next. Be bold in your own direction.

${PROPOSAL_SCHEMA}`;

      const { text } = await streamMessage({ system, user, agent, emit, maxTokens: 1500 });

      try {
        const parsed = extractJson<Omit<AgentProposal, 'agent'>>(text);
        const proposal: AgentProposal = { agent, ...parsed };
        emit({ type: 'proposal', proposal });
        return proposal;
      } catch (e) {
        emit({ type: 'error', message: `${agent} proposal parse failed: ${(e as Error).message}` });
        const fallback: AgentProposal = {
          agent,
          recommendedZones: [],
          teamAllocation: [],
          reasoning: text.slice(0, 400),
          concerns: [],
          confidence: 0.3,
          estimatedOutcome: { infectionsAvoided: 0, totalCost: 0, zonesProtected: 0 },
        };
        return fallback;
      }
    })
  );

  // ---------- PHASE 2: CRITIQUES (parallel) ----------
  emit({ type: 'phase', phase: 'critiquing' });

  const proposalsBlock = proposals
    .map((p) => {
      const name = AGENT_PERSONALITIES[p.agent].name;
      return `[${name} / ${p.agent}] zones=${JSON.stringify(p.recommendedZones)} — ${p.reasoning}`;
    })
    .join('\n');

  const critiqueLists = await Promise.all(
    AGENT_ORDER.map(async (agent) => {
      emit({ type: 'agent_start', agent });
      const system = systemPromptFor(agent);
      const user = `${brief}

${constraintsBlock}

PROPOSALS FROM ALL FOUR ADVISORS:
${proposalsBlock}

TASK: Critique the OTHER THREE advisors' plans. For each, name specific zones you disagree with and why. Do not critique yourself.

${CRITIQUE_SCHEMA}`;

      const { text } = await streamMessage({ system, user, agent, emit, maxTokens: 1200 });

      try {
        const parsed = extractJson<{ critiques: Omit<AgentCritique, 'agent'>[] }>(text);
        const critiques = (parsed.critiques || []).map((c) => ({ agent, ...c } as AgentCritique));
        critiques.forEach((c) => emit({ type: 'critique', critique: c }));
        return critiques;
      } catch (e) {
        emit({ type: 'error', message: `${agent} critique parse failed: ${(e as Error).message}` });
        return [] as AgentCritique[];
      }
    })
  );
  const critiques = critiqueLists.flat();

  // ---------- PHASE 3: RESPONSES (parallel) ----------
  emit({ type: 'phase', phase: 'responding' });

  const responses = await Promise.all(
    AGENT_ORDER.map(async (agent) => {
      emit({ type: 'agent_start', agent });
      const received = critiques.filter((c) => c.targetAgent === agent);
      if (received.length === 0) {
        const empty: AgentResponse = {
          agent,
          respondingTo: [],
          defenseOfPosition: 'No critiques received. Position unchanged.',
          compromises: [],
        };
        emit({ type: 'response', response: empty });
        return empty;
      }

      const critiquesText = received
        .map(
          (c) =>
            `FROM ${AGENT_PERSONALITIES[c.agent].name}: disagrees=${JSON.stringify(c.disagreementPoints)} alternatives=${JSON.stringify(c.alternativeSuggestions)}`
        )
        .join('\n');

      const system = systemPromptFor(agent);
      const user = `${brief}

${constraintsBlock}

CRITIQUES DIRECTED AT YOU:
${critiquesText}

TASK: Defend your position where you still believe it's right. Concede specifically where a critique changes your mind. Name which zones you'd now add or drop.

${RESPONSE_SCHEMA}`;

      const { text } = await streamMessage({ system, user, agent, emit, maxTokens: 1000 });

      try {
        const parsed = extractJson<{
          respondingTo: AgentType[];
          defenseOfPosition: string;
          compromises: string[];
          revisedZones?: number[];
        }>(text);

        const response: AgentResponse = {
          agent,
          respondingTo: parsed.respondingTo || [],
          defenseOfPosition: parsed.defenseOfPosition || '',
          compromises: parsed.compromises || [],
        };

        if (parsed.revisedZones && parsed.revisedZones.length) {
          const original = proposals.find((p) => p.agent === agent)!;
          response.revisedProposal = { ...original, recommendedZones: parsed.revisedZones };
        }

        emit({ type: 'response', response });
        return response;
      } catch (e) {
        emit({ type: 'error', message: `${agent} response parse failed: ${(e as Error).message}` });
        return {
          agent,
          respondingTo: [],
          defenseOfPosition: text.slice(0, 300),
          compromises: [],
        } as AgentResponse;
      }
    })
  );

  // ---------- PHASE 4: CONSENSUS ----------
  emit({ type: 'phase', phase: 'consensus' });

  const responsesBlock = responses
    .map((r) => `[${AGENT_PERSONALITIES[r.agent].name}] defends: ${r.defenseOfPosition} | compromises: ${JSON.stringify(r.compromises)}${r.revisedProposal ? ` | revised: ${JSON.stringify(r.revisedProposal.recommendedZones)}` : ''}`)
    .join('\n');

  const consensusSystem = `You are the neutral synthesizer arbitrating between four AI advisors. Produce a final intervention plan that reflects the strongest arguments from the debate, respecting the constraints. Favor zones that multiple advisors agree on; include controversial zones only if at least one advisor made a compelling, unrefuted case.`;

  const consensusUser = `${brief}

${constraintsBlock}

ORIGINAL PROPOSALS:
${proposalsBlock}

ARGUMENTS AFTER CRITIQUE:
${responsesBlock}

${CONSENSUS_SCHEMA}`;

  const { text: consensusText } = await streamMessage({
    system: consensusSystem,
    user: consensusUser,
    agent: null,
    emit,
    maxTokens: 2000,
  });

  let consensusPlan: ConsensusPlan;
  try {
    consensusPlan = extractJson<ConsensusPlan>(consensusText);
  } catch (e) {
    emit({ type: 'error', message: `Consensus parse failed: ${(e as Error).message}` });
    const maxZones = Math.min(
      constraints.availableTeams,
      Math.floor(constraints.budgetTotal / constraints.fumigationCostPerZone)
    );
    const fallbackZones = zones
      .slice()
      .sort((a, b) => b.baseRisk - a.baseRisk)
      .slice(0, maxZones)
      .map((z) => z.id);

    consensusPlan = {
      selectedZones: fallbackZones,
      teamAllocations: fallbackZones.map((zid, i) => ({
        teamId: i + 1,
        zoneId: zid,
        day: 0,
        travelTime: 30,
      })),
      reasoning: {
        whyTheseZones: 'Fallback: highest base risk selected.',
        whyNotOtherZones: 'Outside budget/team capacity.',
        tradeoffsMade: ['Consensus synthesis failed to parse.'],
      },
      agentAgreement: { fullySupported: [], partiallySupported: [], keyDisagreements: [] },
      expectedOutcome: {
        estimatedInfections: 0,
        totalCost: fallbackZones.length * constraints.fumigationCostPerZone,
        zonesProtected: fallbackZones.length,
        riskRemaining: 0.5,
      },
      sensitivity: { ifBudgetCut: '—', ifDelayed: '—' },
    };
  }

  emit({ type: 'consensus', plan: consensusPlan });
  emit({ type: 'phase', phase: 'complete' });

  return { consensusPlan, proposals, environmentalAssessment };
}
