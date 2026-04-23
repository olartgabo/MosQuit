'use client';

import { AGENT_PERSONALITIES } from '@/lib/agents/prompts';
import type { ConsensusPlan, Zone } from '@/types';

interface Props {
  plan: ConsensusPlan;
  zones: Zone[];
}

export default function ConsensusView({ plan, zones }: Props) {
  const selectedZones = zones.filter((z) => plan.selectedZones.includes(z.id));

  return (
    <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 via-black/40 to-black/60 backdrop-blur-md overflow-hidden">
      <div className="px-5 py-3 border-b border-cyan-500/20 flex items-center gap-3">
        <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 font-bold">Consensus Plan</div>
        <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/40 to-transparent" />
        <div className="text-xs text-white/60">
          {plan.expectedOutcome.zonesProtected} zones · ${plan.expectedOutcome.totalCost.toLocaleString()}
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Why these zones</div>
          <p className="text-sm text-white/85 leading-relaxed">{plan.reasoning.whyTheseZones}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {selectedZones.map((z) => (
            <div key={z.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
              <div className="flex justify-between items-center">
                <div className="text-sm font-semibold text-white">{z.name}</div>
                <div
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: z.baseRisk > 0.7 ? '#ef444433' : z.baseRisk > 0.5 ? '#f9731633' : '#eab30833',
                    color: z.baseRisk > 0.7 ? '#fca5a5' : z.baseRisk > 0.5 ? '#fdba74' : '#fde047',
                  }}
                >
                  {(z.baseRisk * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-[11px] text-white/50 mt-0.5">
                pop {z.population.toLocaleString()} · {z.infected} infected
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Trade-offs accepted</div>
          <ul className="space-y-1.5">
            {plan.reasoning.tradeoffsMade.map((t, i) => (
              <li key={i} className="text-sm text-white/70 flex gap-2">
                <span className="text-amber-400 mt-0.5">↳</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {(plan.agentAgreement.fullySupported.length > 0 || plan.agentAgreement.keyDisagreements.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Aligned</div>
              <div className="flex flex-wrap gap-1">
                {plan.agentAgreement.fullySupported.map((a) => (
                  <span
                    key={a}
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      color: AGENT_PERSONALITIES[a].color,
                      background: `${AGENT_PERSONALITIES[a].color}22`,
                    }}
                  >
                    {AGENT_PERSONALITIES[a].name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Unresolved</div>
              <ul className="space-y-1">
                {plan.agentAgreement.keyDisagreements.slice(0, 3).map((d, i) => (
                  <li key={i} className="text-xs text-white/60 italic">· {d}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/5">
          <Metric label="Est. infections" value={plan.expectedOutcome.estimatedInfections} />
          <Metric label="Cost" value={`$${(plan.expectedOutcome.totalCost / 1000).toFixed(0)}k`} />
          <Metric label="Protected" value={plan.expectedOutcome.zonesProtected} />
          <Metric label="Risk left" value={`${(plan.expectedOutcome.riskRemaining * 100).toFixed(0)}%`} />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="text-lg font-bold text-cyan-300">{value}</div>
    </div>
  );
}
