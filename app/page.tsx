'use client';

import { useMemo, useState } from 'react';
import type { DataLayer, ResourceConstraints, SimulationParameters } from '@/types';
import { getDefaultConstraints, getDefaultSimulationParameters } from '@/lib/city/generator';
import MapView from '@/components/Map/MapView';
import ResourceSliders from '@/components/Controls/ResourceSliders';
import SimulationControls from '@/components/Controls/SimulationControls';
import DebatePanel from '@/components/Agents/DebatePanel';
import MetricsDisplay from '@/components/Explainability/MetricsDisplay';
import { BreedingIntelligencePanel } from '@/components/Intelligence/BreedingIntelligencePanel';
import DataLayerSelector from '@/components/Map/DataLayerSelector';
import CitySearchBar from '@/components/Scanner/CitySearchBar';
import ReportBox from '@/components/Scanner/ReportBox';
import { useDebate } from '@/lib/hooks/useDebate';
import { useSimulation } from '@/lib/hooks/useSimulation';
import { useCityScanner, useCityReports } from '@/lib/hooks/useCityScanner';
import { DATA_LAYER_CONFIG } from '@/lib/config/dataLayers';

export default function Home() {
  const [constraints, setConstraints] = useState<ResourceConstraints>(getDefaultConstraints());
  const [params] = useState<SimulationParameters>(getDefaultSimulationParameters());
  const [panelTab, setPanelTab] = useState<'debate' | 'config' | 'breeding'>('config');
  const [activeDataLayer, setActiveDataLayer] = useState<DataLayer>('infection');

  const scanner = useCityScanner();
  const { zones, setZones, wetlandPoints, scannedCity, scanProgress, searchQuery, setSearchQuery, geocodeSuggestions, isGeocoding, selectedPlace, selectSuggestion, clearSearch, triggerScan, scanViewBbox } = scanner;

  const { handleReport, isProcessing: reportProcessing } = useCityReports(zones, setZones);

  const { state: debate, isRunning: debateRunning, run: runDebate, reset: resetDebate, environmentalAssessment } = useDebate();

  const selectedZoneIds = debate.consensus?.selectedZones ?? [];

  const sim = useSimulation({ zones, params, selectedZoneIds, totalDays: 7 });

  const cityStats = useMemo(() => {
    const infected = zones.reduce((s, z) => s + z.infected, 0);
    const pop = zones.reduce((s, z) => s + z.population, 0);
    const highRisk = zones.filter((z) => z.baseRisk > 0.7).length;
    const breedingHotspots = zones.filter(
      (z) => (z.extendedData?.compositeBreedingScore ?? z.breedingRisk?.compositeBreedingScore ?? 0) > 0.6
    ).length;
    return { infected, pop, highRisk, breedingHotspots };
  }, [zones]);

  const canRun = zones.length > 0 && !debateRunning;

  const handleRun = () => {
    setPanelTab('debate');
    const cityContext = scannedCity
      ? { name: scannedCity.name, countryCode: scannedCity.countryCode }
      : undefined;
    runDebate(zones, constraints, cityContext);
  };

  const cityLabel = scannedCity?.name?.split(',')[0] ?? 'Manila';

  const layerCfg = DATA_LAYER_CONFIG[activeDataLayer];

  return (
    <div className="flex flex-col h-screen text-white overflow-hidden">
      {/* ─── Top bar ─────────────────────────────────────────────── */}
      <header className="relative flex-none border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="relative flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-black font-bold shadow-[0_0_20px_rgba(34,211,238,0.45)]">
                ✦
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight leading-none">
                  MosQuit <span className="text-cyan-400">//</span> Command
                </div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mt-0.5">
                  Vector Control Decision System
                </div>
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-white/70 font-mono">
                {cityLabel.toUpperCase()} · DENGUE SURVEILLANCE · DÍA {sim.day}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs">
            <Stat label="zonas" value={zones.length} />
            <Stat label="población" value={cityStats.pop.toLocaleString()} />
            <Stat label="infectados" value={cityStats.infected} color="#ef4444" />
            <Stat label="alto riesgo" value={cityStats.highRisk} color="#f97316" />
            {cityStats.breedingHotspots > 0 && (
              <Stat label="humedales" value={cityStats.breedingHotspots} color="#10b981" />
            )}
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-white/40">Model</span>
              <span className="font-mono text-cyan-300">claude-opus-4.7</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main grid ───────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map column */}
        <div className="flex-1 relative min-w-0">
          <MapView
            zones={sim.zonesAtDay}
            highlightedZones={selectedZoneIds}
            activeDataLayer={activeDataLayer}
            breedingHighlightZones={environmentalAssessment?.predictedBreedingHotspots ?? []}
            wetlandPoints={wetlandPoints}
            mapCenter={scannedCity?.center}
            fitBbox={scanViewBbox}
          />

          {/* Floating HUD overlays */}
          <div className="absolute top-4 left-4 right-4 flex flex-col items-start gap-3 pointer-events-none">
            {/* Row: search bar + layer selector */}
            <div className="w-full flex items-start gap-3">
              {/* City search */}
              <CitySearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                suggestions={geocodeSuggestions}
                isGeocoding={isGeocoding}
                selectedPlace={selectedPlace}
                onSelectSuggestion={selectSuggestion}
                onClear={clearSearch}
                onScan={triggerScan}
                scanProgress={scanProgress}
              />

              {/* Citizen Reports NLP */}
              <ReportBox onReport={handleReport} isProcessing={reportProcessing} />

              {/* Spacer */}
              <div className="flex-1" />

              {/* AI deployment badge */}
              {selectedZoneIds.length > 0 && (
                <div className="pointer-events-auto rounded-xl border border-cyan-500/40 bg-cyan-500/10 backdrop-blur-xl px-4 py-2.5">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300 font-bold">
                    AI Deployment
                  </div>
                  <div className="text-sm mt-0.5 text-white">
                    {selectedZoneIds.length} zonas · {sim.day > 0 ? 'ACTIVO' : 'LISTO'}
                  </div>
                </div>
              )}
            </div>

            {/* Data layer selector row */}
            <DataLayerSelector active={activeDataLayer} onChange={setActiveDataLayer} />

            {/* Legend */}
            <div className="pointer-events-auto rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl px-4 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/40">{layerCfg.label}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <div
                  className="h-1.5 w-28 rounded-full"
                  style={{
                    background: layerCfg.colorMid
                      ? `linear-gradient(90deg,${layerCfg.colorFrom},${layerCfg.colorMid},${layerCfg.colorTo})`
                      : `linear-gradient(90deg,${layerCfg.colorFrom},${layerCfg.colorTo})`,
                  }}
                />
                <div className="text-[11px] text-white/60 font-mono">
                  {layerCfg.legendTicks[0].label} → {layerCfg.legendTicks[layerCfg.legendTicks.length - 1].label}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom overlay: sim controls + metrics */}
          {debate.consensus && (
            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-3 pointer-events-auto">
              <SimulationControls
                day={sim.day}
                totalDays={sim.totalDays}
                isPlaying={sim.isPlaying}
                speed={sim.speed}
                canPlay={true}
                onPlayPause={sim.playPause}
                onStep={sim.step}
                onReset={sim.reset}
                onSpeedChange={sim.setSpeed}
              />
              <MetricsDisplay
                current={sim.current.metrics}
                history={sim.history}
                baseline={sim.baselineHistory}
              />
            </div>
          )}
        </div>

        {/* Right panel */}
        <aside className="w-[460px] flex-none border-l border-white/5 bg-black/40 backdrop-blur-xl flex flex-col">
          {/* Tabs */}
          <div className="flex-none border-b border-white/5 px-4 pt-3">
            <div className="flex gap-1">
              <TabButton active={panelTab === 'config'} onClick={() => setPanelTab('config')}>
                Briefing
              </TabButton>
              <TabButton active={panelTab === 'debate'} onClick={() => setPanelTab('debate')}>
                Debate
                {debate.phase !== 'idle' && debate.phase !== 'complete' && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </TabButton>
              <TabButton active={panelTab === 'breeding'} onClick={() => setPanelTab('breeding')}>
                Inteligencia
                {scanProgress.phase === 'enriching' && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </TabButton>
            </div>
          </div>

          {panelTab === 'breeding' ? (
            <BreedingIntelligencePanel
              zones={zones}
              environmentalAssessment={environmentalAssessment}
              isLoadingSatellite={scanProgress.phase === 'enriching'}
              dataSource={
                zones.some((z) => z.extendedData?.dataSource === 'satellite')
                  ? 'satellite'
                  : zones.some((z) => z.extendedData)
                    ? 'fallback'
                    : null
              }
              metadata={null}
              onRefresh={triggerScan}
            />
          ) : panelTab === 'config' ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <section>
                <SectionHead>Restricciones de Recursos</SectionHead>
                <ResourceSliders constraints={constraints} onChange={setConstraints} />
              </section>

              <button
                onClick={handleRun}
                disabled={!canRun}
                className="w-full group relative overflow-hidden rounded-xl py-3.5 font-bold text-black bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition shadow-[0_0_30px_rgba(34,211,238,0.35)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {debateRunning ? (
                    <>
                      <span className="inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Debatiendo…
                    </>
                  ) : (
                    <>▶ Convocar Asesores IA</>
                  )}
                </span>
              </button>

              {debate.consensus && (
                <button
                  onClick={resetDebate}
                  className="w-full text-xs text-white/50 hover:text-white/90 transition py-2"
                >
                  ↺ Resetear plan
                </button>
              )}

              <section>
                <SectionHead>Zonas de Mayor Riesgo</SectionHead>
                <div className="space-y-1.5">
                  {zones
                    .slice()
                    .sort((a, b) => b.baseRisk - a.baseRisk)
                    .slice(0, 6)
                    .map((zone) => (
                      <div
                        key={zone.id}
                        className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                      >
                        <div
                          className="w-1 h-8 rounded-full"
                          style={{
                            background:
                              zone.baseRisk > 0.7 ? '#ef4444' : zone.baseRisk > 0.5 ? '#f97316' : '#eab308',
                            boxShadow: `0 0 8px ${zone.baseRisk > 0.7 ? '#ef4444' : zone.baseRisk > 0.5 ? '#f97316' : '#eab308'}66`,
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{zone.name}</div>
                          <div className="text-[11px] text-white/50 font-mono">
                            {zone.population.toLocaleString()} hab · {zone.infected} inf
                          </div>
                        </div>
                        <div className="text-sm font-bold font-mono" style={{ color: zone.baseRisk > 0.7 ? '#fca5a5' : '#fed7aa' }}>
                          {(zone.baseRisk * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              <section>
                <SectionHead>Cómo funciona</SectionHead>
                <ol className="space-y-2.5 text-sm text-white/70">
                  {[
                    'Busca cualquier ciudad y haz Scan para obtener zonas reales.',
                    'Cuatro asesores IA proponen dónde desplegar equipos.',
                    'Se critican entre sí — nombrando zonas específicas.',
                    'Defienden y conceden. Un sintetizador produce el plan final.',
                    'Corre la simulación de 7 días vs. sin intervención.',
                  ].map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-mono text-[10px] text-cyan-400 mt-1 w-4">0{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          ) : (
            <DebatePanel state={debate} zones={zones} consensus={debate.consensus} />
          )}

          {debate.error && (
            <div className="flex-none border-t border-red-500/30 bg-red-500/10 px-4 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-red-300 font-bold">Error</div>
              <div className="text-xs text-red-200 mt-0.5">{debate.error}</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col leading-none">
      <span className="text-[9px] uppercase tracking-[0.25em] text-white/40">{label}</span>
      <span className="font-mono text-sm font-bold mt-0.5" style={{ color: color || 'white' }}>
        {value}
      </span>
    </div>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-cyan-400">{children}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold transition relative ${
        active ? 'text-white' : 'text-white/40 hover:text-white/70'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-2 right-2 h-px bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
      )}
    </button>
  );
}
