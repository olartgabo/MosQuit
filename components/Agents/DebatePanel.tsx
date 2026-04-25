'use client';

import { useMemo } from 'react';
import AgentCard from './AgentCard';
import ConsensusView from './ConsensusView';
import type { AgentType, ConsensusPlan, Zone } from '@/types';
import type { DebateUIState } from '@/lib/hooks/useDebate';

const AGENT_ORDER: AgentType[] = ['epidemiologist', 'budget', 'operations', 'public_risk'];

const PHASE_LABEL: Record<DebateUIState['phase'], string> = {
  idle: 'Idle',
  intelligence: 'Phase 0 · Satellite intelligence',
  proposing: 'Phase 1 · Independent proposals',
  critiquing: 'Phase 2 · Cross-critique',
  responding: 'Phase 3 · Defense & compromise',
  consensus: 'Phase 4 · Synthesizing consensus',
  complete: 'Consensus reached',
};

interface Props {
  state: DebateUIState;
  zones: Zone[];
  consensus?: ConsensusPlan;
}

export default function DebatePanel({ state, zones, consensus }: Props) {
  const activePhaseIndex = useMemo(() => {
    const order: DebateUIState['phase'][] = ['idle', 'intelligence', 'proposing', 'critiquing', 'responding', 'consensus', 'complete'];
    return order.indexOf(state.phase);
  }, [state.phase]);

  return (
    <div className="flex flex-col h-full">
      {/* Phase strip */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-cyan-400">Debate</div>
          <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 via-white/5 to-transparent" />
          <div className="text-xs text-white/60">{PHASE_LABEL[state.phase]}</div>
        </div>
        <div className="flex gap-1">
          {['intelligence', 'proposing', 'critiquing', 'responding', 'consensus'].map((p, i) => {
            const order = ['intelligence', 'proposing', 'critiquing', 'responding', 'consensus'];
            const currentIdx = order.indexOf(state.phase);
            const done = currentIdx > i || state.phase === 'complete';
            const active = currentIdx === i;
            const isIntel = p === 'intelligence';
            return (
              <div
                key={p}
                className={`h-1 rounded-full transition-all ${isIntel ? 'w-6 flex-none' : 'flex-1'}`}
                style={{
                  background: done
                    ? (isIntel ? '#10b981' : '#22d3ee')
                    : active
                    ? `linear-gradient(90deg,${isIntel ? '#10b981' : '#22d3ee'},${isIntel ? '#10b98166' : '#22d3ee66'})`
                    : 'rgba(255,255,255,0.08)',
                  boxShadow: active ? `0 0 10px ${isIntel ? '#10b98188' : '#22d3ee88'}` : 'none',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Agent grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Environmental Monitor — full width when active */}
        {(state.phase === 'intelligence' || state.agents['environmental_monitor']?.state !== 'idle') && (
          <AgentCard
            key="environmental_monitor"
            agent="environmental_monitor"
            state={state.agents['environmental_monitor']?.state ?? 'idle'}
            streamText={state.agents['environmental_monitor']?.currentText ?? ''}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          {AGENT_ORDER.map((agent) => {
            const a = state.agents[agent];
            return (
              <AgentCard
                key={agent}
                agent={agent}
                state={a.state}
                streamText={a.currentText}
                confidence={a.proposal?.confidence}
                zonesCount={a.proposal?.recommendedZones.length}
              />
            );
          })}
        </div>

        {consensus && <ConsensusView plan={consensus} zones={zones} />}
      </div>
    </div>
  );
}
