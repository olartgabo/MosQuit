'use client';

import { AGENT_PERSONALITIES } from '@/lib/agents/prompts';
import type { AgentType } from '@/types';

interface Props {
  agent: AgentType;
  state: 'idle' | 'thinking' | 'speaking' | 'done';
  streamText?: string;
  confidence?: number;
  zonesCount?: number;
}

const STATE_LABEL: Record<Props['state'], string> = {
  idle: 'WAITING',
  thinking: 'THINKING',
  speaking: 'SPEAKING',
  done: 'COMMITTED',
};

export default function AgentCard({ agent, state, streamText, confidence, zonesCount }: Props) {
  const p = AGENT_PERSONALITIES[agent];
  const active = state === 'thinking' || state === 'speaking';

  return (
    <div
      className="relative rounded-2xl border bg-black/40 backdrop-blur-md overflow-hidden transition-all"
      style={{
        borderColor: active ? p.color : 'rgba(255,255,255,0.08)',
        boxShadow: active ? `0 0 32px ${p.color}33, inset 0 0 0 1px ${p.color}` : 'none',
      }}
    >
      {/* Glow bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${p.color}, transparent)`,
          opacity: active ? 1 : 0.3,
        }}
      />

      <div className="p-4 border-b border-white/5 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
          style={{
            background: `linear-gradient(135deg, ${p.color}33, ${p.color}11)`,
            border: `1px solid ${p.color}66`,
            color: p.color,
          }}
        >
          {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{p.name}</div>
          <div className="text-[10px] uppercase tracking-widest text-white/50 truncate">
            {p.objective.replace(/\.$/, '')}
          </div>
        </div>
        <div
          className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md"
          style={{
            color: active ? p.color : 'rgba(255,255,255,0.4)',
            background: active ? `${p.color}22` : 'rgba(255,255,255,0.04)',
          }}
        >
          {active && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ background: p.color }} />}
          {STATE_LABEL[state]}
        </div>
      </div>

      <div className="p-4 min-h-[110px] max-h-[220px] overflow-y-auto font-mono text-[12.5px] leading-relaxed text-white/80 whitespace-pre-wrap">
        {streamText || <span className="text-white/30 italic">…</span>}
        {active && <span className="inline-block w-2 h-4 ml-0.5 align-middle animate-pulse" style={{ background: p.color }} />}
      </div>

      {(confidence !== undefined || zonesCount !== undefined) && (
        <div className="px-4 py-2 border-t border-white/5 flex gap-4 text-[11px] text-white/60 bg-white/[0.02]">
          {zonesCount !== undefined && (
            <span>
              <span className="text-white/40">zones</span>{' '}
              <span className="font-bold text-white">{zonesCount}</span>
            </span>
          )}
          {confidence !== undefined && (
            <span>
              <span className="text-white/40">conf</span>{' '}
              <span className="font-bold" style={{ color: p.color }}>{(confidence * 100).toFixed(0)}%</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
