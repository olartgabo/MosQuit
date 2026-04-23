'use client';

interface Props {
  day: number;
  totalDays: number;
  isPlaying: boolean;
  speed: 1 | 2 | 5;
  canPlay: boolean;
  onPlayPause: () => void;
  onStep: (delta: number) => void;
  onReset: () => void;
  onSpeedChange: (s: 1 | 2 | 5) => void;
}

export default function SimulationControls({
  day,
  totalDays,
  isPlaying,
  speed,
  canPlay,
  onPlayPause,
  onStep,
  onReset,
  onSpeedChange,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">Simulation</div>
          <div className="text-lg font-bold text-white">
            Day <span className="text-cyan-300">{day}</span>
            <span className="text-white/30 text-sm font-normal"> / {totalDays}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s as 1 | 2 | 5)}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                speed === s ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/50' : 'text-white/50 hover:text-white'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all"
          style={{ width: `${(day / totalDays) * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onReset}
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition"
        >
          ⟲
        </button>
        <button
          onClick={() => onStep(-1)}
          disabled={day <= 0}
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition disabled:opacity-30"
        >
          ◀
        </button>
        <button
          onClick={onPlayPause}
          disabled={!canPlay}
          className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPlaying ? '⏸ Pause' : day >= totalDays ? '✓ Complete' : '▶ Play Simulation'}
        </button>
        <button
          onClick={() => onStep(1)}
          disabled={day >= totalDays}
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition disabled:opacity-30"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
