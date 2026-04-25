'use client';

import type { BreedingIntelligenceResponse, EnvironmentalAssessment, Zone } from '@/types';

interface Props {
  zones: Zone[];
  environmentalAssessment?: EnvironmentalAssessment;
  isLoadingSatellite: boolean;
  dataSource: BreedingIntelligenceResponse['metadata']['dataSource'] | null;
  metadata: BreedingIntelligenceResponse['metadata'] | null;
  onRefresh: () => void;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 70 ? 'bg-amber-500' : pct >= 45 ? 'bg-yellow-400' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono w-8 text-right text-white/70">{pct}%</span>
    </div>
  );
}

function topIndicator(z: Zone): string {
  const b = z.breedingRisk;
  if (!b) return '';
  const factors = [
    { label: `RAIN ${b.recentRainfall_mm.toFixed(0)}mm`, value: b.recentRainfall_mm / 100 },
    { label: `WATER ${b.ndwi.toFixed(2)}`, value: (b.ndwi + 0.3) / 0.9 },
    { label: `ELEV ${b.elevation_m.toFixed(0)}m`, value: 1 - Math.min(1, b.elevation_m / 50) },
    { label: `VEG ${b.ndvi.toFixed(2)}`, value: b.ndvi / 0.8 },
  ];
  factors.sort((a, b) => b.value - a.value);
  return factors[0].label;
}

export function BreedingIntelligencePanel({ zones, environmentalAssessment, isLoadingSatellite, dataSource, metadata, onRefresh }: Props) {
  const zonesWithBreeding = zones
    .filter((z) => z.breedingRisk)
    .sort((a, b) => (b.breedingRisk!.compositeBreedingScore) - (a.breedingRisk!.compositeBreedingScore));

  const hotspots = new Set(environmentalAssessment?.predictedBreedingHotspots ?? []);
  const sourceTargets = new Map(
    (environmentalAssessment?.sourceReductionTargets ?? []).map((t) => [t.zoneId, t])
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 flex-shrink-0">
        {isLoadingSatellite ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Fetching satellite data...
          </span>
        ) : dataSource === 'satellite' ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            SENTINEL-2
          </span>
        ) : dataSource === 'partial' ? (
          <span className="flex items-center gap-1.5 text-xs text-yellow-400">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            PARTIAL SATELLITE
          </span>
        ) : dataSource === 'fallback' ? (
          <span className="flex items-center gap-1.5 text-xs text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            SIMULATED DATA
          </span>
        ) : (
          <span className="text-xs text-white/30">No data loaded</span>
        )}

        {metadata?.sceneDates && Object.keys(metadata.sceneDates).length > 0 && (
          <span className="text-xs text-white/30 ml-1">
            Scene: {Object.values(metadata.sceneDates)[0]?.split('T')[0]}
          </span>
        )}

        <button
          onClick={onRefresh}
          disabled={isLoadingSatellite}
          className="ml-auto text-xs text-white/40 hover:text-white/70 disabled:opacity-30 transition-colors"
        >
          ↺ Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Zone ranking */}
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Breeding Risk Ranking</p>
          {zonesWithBreeding.length === 0 ? (
            <p className="text-xs text-white/30 py-4 text-center">No breeding data — run analysis first</p>
          ) : (
            <div className="space-y-2">
              {zonesWithBreeding.map((z) => {
                const b = z.breedingRisk!;
                const isHotspot = hotspots.has(z.id);
                const target = sourceTargets.get(z.id);
                return (
                  <div key={z.id} className={`rounded-lg px-3 py-2 ${isHotspot ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-white/5'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white/90">{z.name}</span>
                      <div className="flex items-center gap-1.5">
                        {isHotspot && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">HOTSPOT</span>
                        )}
                        {target && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${target.urgency === 'immediate' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {target.urgency.toUpperCase()}
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${b.dataSource === 'satellite' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                          {b.dataSource === 'satellite' ? 'SAT' : 'SIM'}
                        </span>
                      </div>
                    </div>
                    <ScoreBar score={b.compositeBreedingScore} />
                    <p className="text-[10px] text-white/40 mt-1">{topIndicator(z)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dr. Reyes output */}
        {environmentalAssessment && (
          <div className="px-4 pt-4 pb-4 border-t border-white/10 mt-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-semibold text-emerald-400">Dr. Reyes — Environmental Monitor</p>
            </div>
            <p className="text-xs text-white/70 leading-relaxed mb-3">{environmentalAssessment.reasoning}</p>

            {environmentalAssessment.recommendedActions.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">Recommended Actions</p>
                <ul className="space-y-1">
                  {environmentalAssessment.recommendedActions.map((action, i) => (
                    <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5">›</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className="text-[10px] text-white/30 mt-3">
              Confidence: {Math.round(environmentalAssessment.confidence * 100)}%
            </p>
          </div>
        )}

        {!environmentalAssessment && dataSource && (
          <div className="px-4 py-3 border-t border-white/10 mt-2">
            <p className="text-xs text-white/30 text-center">Run a debate to see Dr. Reyes&apos; full analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
