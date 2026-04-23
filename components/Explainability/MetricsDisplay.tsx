'use client';

import type { DayMetrics } from '@/types';

interface Props {
  current: DayMetrics;
  history: DayMetrics[];
  baseline?: DayMetrics[];
}

export default function MetricsDisplay({ current, history, baseline }: Props) {
  const maxValue = Math.max(
    ...history.map((h) => h.totalInfected),
    ...(baseline?.map((h) => h.totalInfected) || [0]),
    10
  );

  const sparkPath = (data: DayMetrics[], width = 100, height = 30) => {
    if (data.length === 0) return '';
    const step = width / Math.max(1, data.length - 1);
    return data
      .map((d, i) => {
        const x = i * step;
        const y = height - (d.totalInfected / maxValue) * height;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const baselineLast = baseline?.[baseline.length - 1];
  const savedLives =
    baselineLast && current
      ? Math.max(0, baselineLast.cumulativeInfections - current.cumulativeInfections)
      : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-cyan-400">Outbreak Metrics</div>
        <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Big label="Infected" value={current.totalInfected} color="#ef4444" />
        <Big label="Recovered" value={current.totalRecovered} color="#22c55e" />
        <Big label="New today" value={current.newInfections} color="#f59e0b" />
      </div>

      <div>
        <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/40 mb-1">
          <span>Infection curve</span>
          <span>max {maxValue}</span>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-3">
          <svg viewBox="0 0 100 30" className="w-full h-16" preserveAspectRatio="none">
            {baseline && (
              <path
                d={sparkPath(baseline)}
                fill="none"
                stroke="#ef444488"
                strokeWidth="0.6"
                strokeDasharray="1.5 1.5"
              />
            )}
            <path
              d={sparkPath(history)}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1"
            />
          </svg>
          {baseline && (
            <div className="flex gap-3 text-[10px] mt-1">
              <span className="text-cyan-300">— AI plan</span>
              <span className="text-red-300">-- no intervention</span>
            </div>
          )}
        </div>
      </div>

      {savedLives > 0 && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Lives spared</div>
          <div className="text-2xl font-bold text-emerald-200 mt-0.5">
            {savedLives.toLocaleString()} infections avoided
          </div>
          <div className="text-xs text-emerald-300/70 mt-0.5">
            vs. no-intervention baseline
          </div>
        </div>
      )}

      {current.narrative && (
        <div className="text-xs text-white/60 italic border-l-2 border-cyan-500/40 pl-3">
          {current.narrative}
        </div>
      )}
    </div>
  );
}

function Big({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="text-xl font-bold mt-0.5" style={{ color }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}
