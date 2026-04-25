'use client';

import { useCallback, useRef, useState } from 'react';
import { consumeDebateStream } from '@/lib/utils/streaming';
import type { DebateEvent } from '@/lib/agents/orchestrator';
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

const DEBATE_AGENTS: AgentType[] = ['epidemiologist', 'budget', 'operations', 'public_risk'];
const ALL_AGENTS: AgentType[] = [...DEBATE_AGENTS, 'environmental_monitor'];

export interface AgentUIState {
  state: 'idle' | 'thinking' | 'speaking' | 'done';
  currentText: string;
  proposal?: AgentProposal;
  critiques: AgentCritique[];
  response?: AgentResponse;
}

export interface DebateUIState {
  phase: 'idle' | 'intelligence' | 'proposing' | 'critiquing' | 'responding' | 'consensus' | 'complete';
  environmentalAssessment?: EnvironmentalAssessment;
  agents: Record<AgentType, AgentUIState>;
  consensus?: ConsensusPlan;
  error?: string;
}

function initialState(): DebateUIState {
  const agents = {} as Record<AgentType, AgentUIState>;
  for (const a of ALL_AGENTS) {
    agents[a] = { state: 'idle', currentText: '', critiques: [] };
  }
  return { phase: 'idle', agents };
}

export function useDebate() {
  const [state, setState] = useState<DebateUIState>(initialState());
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(initialState());
    setIsRunning(false);
  }, []);

  const handleEvent = useCallback((evt: DebateEvent) => {
    setState((prev) => {
      const next: DebateUIState = {
        ...prev,
        agents: { ...prev.agents },
      };

      switch (evt.type) {
        case 'phase': {
          next.phase = evt.phase;
          if (evt.phase === 'proposing' || evt.phase === 'critiquing' || evt.phase === 'responding') {
            for (const a of DEBATE_AGENTS) {
              next.agents[a] = { ...next.agents[a], state: 'thinking', currentText: '' };
            }
          }
          return next;
        }
        case 'environmental_assessment': {
          next.environmentalAssessment = evt.assessment;
          next.agents['environmental_monitor'] = {
            ...next.agents['environmental_monitor'],
            state: 'done',
          };
          return next;
        }
        case 'agent_start': {
          next.agents[evt.agent] = {
            ...next.agents[evt.agent],
            state: 'thinking',
            currentText: '',
          };
          return next;
        }
        case 'agent_delta': {
          const a = next.agents[evt.agent];
          next.agents[evt.agent] = {
            ...a,
            state: 'speaking',
            currentText: a.currentText + evt.delta,
          };
          return next;
        }
        case 'agent_thinking':
          return next;
        case 'proposal': {
          const a = next.agents[evt.proposal.agent];
          next.agents[evt.proposal.agent] = {
            ...a,
            state: 'done',
            proposal: evt.proposal,
            currentText: evt.proposal.reasoning,
          };
          return next;
        }
        case 'critique': {
          const a = next.agents[evt.critique.agent];
          next.agents[evt.critique.agent] = {
            ...a,
            critiques: [...a.critiques, evt.critique],
          };
          return next;
        }
        case 'response': {
          const a = next.agents[evt.response.agent];
          next.agents[evt.response.agent] = {
            ...a,
            state: 'done',
            response: evt.response,
            currentText: evt.response.defenseOfPosition,
          };
          return next;
        }
        case 'consensus': {
          next.consensus = evt.plan;
          return next;
        }
        case 'error': {
          next.error = evt.message;
          return next;
        }
      }
      return next;
    });
  }, []);

  const run = useCallback(
    async (zones: Zone[], constraints: ResourceConstraints, cityContext?: { name: string; countryCode: string }) => {
      reset();
      setState(initialState());
      setIsRunning(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch('/api/agents/debate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ zones, constraints, cityContext }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.text();
          setState((prev) => ({ ...prev, error: err || `HTTP ${response.status}` }));
          return;
        }

        await consumeDebateStream(response, handleEvent);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setState((prev) => ({ ...prev, error: (err as Error).message }));
        }
      } finally {
        setIsRunning(false);
      }
    },
    [handleEvent, reset]
  );

  return {
    state,
    isRunning,
    run,
    reset,
    environmentalAssessment: state.environmentalAssessment,
  };
}
