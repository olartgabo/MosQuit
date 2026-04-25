'use client';

import { useEffect, useRef, useState } from 'react';
import type { ExtendedEnvironmentalData, WetlandClass, Zone } from '@/types';

interface ZoneInfoPanelProps {
  zone: Zone;
  mouseX: number;
  mouseY: number;
  containerRect: DOMRect | null;
  wetlandZoneIds: Set<number>;
}

const VIEWS = [
  { key: 'risk', label: 'Riesgo Biológico' },
  { key: 'water', label: 'Humedad y Agua' },
  { key: 'climate', label: 'Clima Dinámico' },
  { key: 'infra', label: 'Infraestructura' },
] as const;

type ViewKey = typeof VIEWS[number]['key'];

const WETLAND_LABELS: Record<WetlandClass, string> = {
  open_water: 'Agua Abierta',
  marsh_wetland: 'Pantano',
  moist_vegetation: 'Veg. Húmeda',
  dry_land: 'Tierra Seca',
};

const WETLAND_COLORS: Record<WetlandClass, string> = {
  open_water: '#06b6d4',
  marsh_wetland: '#0284c7',
  moist_vegetation: '#16a34a',
  dry_land: '#92400e',
};

const SOIL_LABELS = (v: number) => {
  if (v < 0.1) return { label: 'Seco', color: '#d97706' };
  if (v < 0.25) return { label: 'Moderado', color: '#fbbf24' };
  if (v < 0.4) return { label: 'Húmedo', color: '#06b6d4' };
  return { label: 'Saturado', color: '#0284c7' };
};

function Row({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[11px] text-white/50 truncate">{label}</span>
      <span className="font-mono text-xs font-bold flex-none" style={{ color: color ?? 'white' }}>
        {value}{unit ? <span className="text-white/40 font-normal ml-0.5">{unit}</span> : null}
      </span>
    </div>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1 w-full rounded-full bg-white/10 mt-1 mb-2">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function ViewRisk({ ed, zone }: { ed: ExtendedEnvironmentalData | undefined; zone: Zone }) {
  if (!ed) return <NoData />;
  const breteauColor = ed.breteauLevel === 'low' ? '#22c55e' : ed.breteauLevel === 'moderate' ? '#f97316' : '#ef4444';
  return (
    <div className="space-y-2">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/50">Índice de Breteau</span>
          <span className="font-mono text-sm font-bold" style={{ color: breteauColor }}>
            {ed.breteauIndex.toFixed(0)}
            <span className="text-[10px] ml-1 text-white/40">/100</span>
          </span>
        </div>
        <Bar value={ed.breteauIndex} max={100} color={breteauColor} />
        <span className="text-[10px] uppercase tracking-wider" style={{ color: breteauColor }}>
          {ed.breteauLevel === 'low' ? 'Bajo (<5)' : ed.breteauLevel === 'moderate' ? 'Moderado (5-20)' : 'Alto (>20)'}
        </span>
      </div>
      <div className="h-px bg-white/5" />
      <Row label="Casos Activos (est.)" value={ed.estimatedActiveCases.toLocaleString()} color="#f97316" />
      <div className="text-[10px] text-white/30 -mt-1 mb-1">modelo climático-correlacional</div>
      <Row label="Casos Históricos (est.)" value={ed.estimatedHistoricalCases.toLocaleString()} color="#fbbf24" />
      <div className="text-[10px] text-white/30 -mt-1 mb-1">estimado · no datos reales</div>
      <div className="h-px bg-white/5" />
      <Row label="Radio de Vuelo Efectivo" value={ed.flightRadius_m.toFixed(0)} unit="m" color="#22d3ee" />
      <div className="text-[10px] text-white/30 -mt-1">desde punto de humedad detectado</div>
    </div>
  );
}

function ViewWater({ ed, wetlandZoneIds, zoneId }: { ed: ExtendedEnvironmentalData | undefined; wetlandZoneIds: Set<number>; zoneId: number }) {
  if (!ed) return <NoData />;
  const soil = SOIL_LABELS(ed.soil_moisture_mean);
  const wc = ed.wetlandClass;
  return (
    <div className="space-y-2">
      <Row
        label="Hotspots de Humedad cercanos"
        value={wetlandZoneIds.size}
        unit=" zonas"
        color="#22d3ee"
      />
      <div className="text-[10px] text-white/30 -mt-1 mb-1">NDWI &gt; 0.2 en el área</div>
      <div className="h-px bg-white/5" />
      <div>
        <span className="text-[11px] text-white/50">Humedad del Suelo</span>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, ed.soil_moisture_mean / 0.5 * 100)}%`, background: soil.color }} />
          </div>
          <span className="font-mono text-xs font-bold" style={{ color: soil.color }}>{soil.label}</span>
        </div>
        <div className="text-[10px] text-white/30 mt-0.5">{ed.soil_moisture_mean.toFixed(3)} m³/m³</div>
      </div>
      <div className="h-px bg-white/5" />
      <div>
        <span className="text-[11px] text-white/50">Tipo de Humedal Predominante</span>
        <div className="mt-1.5">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: `${WETLAND_COLORS[wc]}22`, color: WETLAND_COLORS[wc], border: `1px solid ${WETLAND_COLORS[wc]}44` }}>
            {WETLAND_LABELS[wc]}
          </span>
        </div>
      </div>
      <div className="h-px bg-white/5" />
      <Row label="NDWI (índice de agua)" value={ed.ndwi.toFixed(3)} color={ed.ndwi > 0.2 ? '#06b6d4' : '#92400e'} />
    </div>
  );
}

function ViewClimate({ ed }: { ed: ExtendedEnvironmentalData | undefined }) {
  if (!ed) return <NoData />;
  const incubAccel = ed.incubationDays < 9;
  const windHigh = ed.windspeed_max_kmh > 15;
  return (
    <div className="space-y-2">
      <div>
        <span className="text-[11px] text-white/50">Ventana de Incubación</span>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="font-mono text-sm font-bold" style={{ color: incubAccel ? '#ef4444' : '#fbbf24' }}>
            {ed.incubationDays} días
          </span>
          {incubAccel && (
            <span className="text-[10px] text-red-400 font-medium">ciclo acelerado</span>
          )}
        </div>
        <div className="text-[10px] text-white/30 mt-0.5">
          huevo → adulto a {ed.temperature_mean_c.toFixed(1)}°C
        </div>
      </div>
      <div className="h-px bg-white/5" />
      <div>
        <Row label="Precipitación 48h" value={ed.precipitation_48h_mm.toFixed(1)} unit=" mm" color="#60a5fa" />
        <div className="text-[10px] text-white/30 -mt-1">agua estancada nueva</div>
      </div>
      <div className="h-px bg-white/5" />
      <div>
        <Row
          label="Velocidad del Viento (máx.)"
          value={ed.windspeed_max_kmh.toFixed(0)}
          unit=" km/h"
          color={windHigh ? '#22c55e' : '#fbbf24'}
        />
        {windHigh ? (
          <div className="text-[10px] text-green-400 mt-0.5">No apto para vuelo del mosquito</div>
        ) : (
          <div className="text-[10px] text-white/30 mt-0.5">condiciones favorables para vuelo</div>
        )}
      </div>
      <div className="h-px bg-white/5" />
      <Row label="Temperatura Media 14d" value={ed.temperature_mean_c.toFixed(1)} unit="°C" color="#fbbf24" />
      <Row label="Humedad Media 14d" value={ed.humidity_mean_pct.toFixed(0)} unit="%" color="#60a5fa" />
    </div>
  );
}

function ViewInfra({ zone }: { zone: Zone }) {
  const ef = zone.environmentalFactors;
  const waterCov = ef.waterProximity < 0.2 ? { label: 'Baja', color: '#ef4444' } : ef.waterProximity < 0.5 ? { label: 'Media', color: '#f97316' } : { label: 'Alta', color: '#22c55e' };
  const wasteFreq = zone.landUse === 'commercial' || zone.landUse === 'mixed' ? 'Regular' : zone.landUse === 'industrial' ? 'Limitada' : 'Variable';
  const wasteColor = wasteFreq === 'Regular' ? '#22c55e' : wasteFreq === 'Variable' ? '#fbbf24' : '#f97316';
  const densityTier = zone.populationDensity < 2000 ? { label: 'Bajo', color: '#22c55e' } : zone.populationDensity < 6000 ? { label: 'Medio', color: '#fbbf24' } : { label: 'Alto', color: '#ef4444' };

  return (
    <div className="space-y-2">
      <div>
        <Row label="Cobertura de Agua Potable" value={waterCov.label} color={waterCov.color} />
        {waterCov.label === 'Baja' && (
          <div className="text-[10px] text-red-400 mt-0.5">⚠ Riesgo de almacenamiento en barriles (criadero #1)</div>
        )}
      </div>
      <div className="h-px bg-white/5" />
      <div>
        <Row label="Recolección de Residuos" value={wasteFreq} color={wasteColor} />
        <div className="text-[10px] text-white/30 mt-0.5">llantas/plásticos como micro-humedales</div>
      </div>
      <div className="h-px bg-white/5" />
      <div>
        <Row label="Densidad Habitacional" value={Math.round(zone.populationDensity).toLocaleString()} unit=" hab/km²" color={densityTier.color} />
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-medium" style={{ color: densityTier.color }}>Transmisión {densityTier.label}</span>
          <span className="text-[10px] text-white/30">· {zone.population.toLocaleString()} hab. totales</span>
        </div>
      </div>
      <div className="h-px bg-white/5" />
      <Row label="Uso de Suelo" value={zone.landUse} />
      {zone.hasSensitiveLocation && (
        <div className="text-[10px] text-amber-400 mt-0.5">⚠ Ubicación sensible (hospital/escuela)</div>
      )}
    </div>
  );
}

function NoData() {
  return (
    <div className="text-[11px] text-white/30 text-center py-4">
      Ejecuta un scan para datos satelitales
    </div>
  );
}

export default function ZoneInfoPanel({
  zone,
  mouseX,
  mouseY,
  containerRect,
  wetlandZoneIds,
}: ZoneInfoPanelProps) {
  const [activeView, setActiveView] = useState<ViewKey>('risk');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const keys = VIEWS.map((v) => v.key);
      const cur = keys.indexOf(activeView);
      if (e.key === 'a' || e.key === 'A') {
        setActiveView(keys[(cur - 1 + keys.length) % keys.length] as ViewKey);
      } else if (e.key === 's' || e.key === 'S') {
        setActiveView(keys[(cur + 1) % keys.length] as ViewKey);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [activeView]);

  if (!containerRect) return null;

  const PANEL_W = 272;
  const PANEL_H = 340;
  const OFFSET = 16;

  let left = mouseX + OFFSET;
  let top = mouseY + OFFSET;

  if (left + PANEL_W > containerRect.width) left = mouseX - PANEL_W - OFFSET;
  if (top + PANEL_H > containerRect.height) top = mouseY - PANEL_H - OFFSET;
  left = Math.max(8, left);
  top = Math.max(8, top);

  const ed = zone.extendedData;

  return (
    <div
      ref={panelRef}
      className="absolute rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl overflow-hidden pointer-events-none"
      style={{ left, top, width: PANEL_W, zIndex: 100 }}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-white/5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-bold text-white leading-tight truncate">{zone.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">{zone.landUse}</span>
              {zone.hasSensitiveLocation && (
                <span className="text-[10px] text-amber-400">· sensible</span>
              )}
              {wetlandZoneIds.has(zone.id) && (
                <span className="text-[10px] text-cyan-400">· humedal</span>
              )}
            </div>
          </div>
          {ed && (
            <span className="text-[9px] text-white/25 flex-none mt-0.5">
              {ed.dataSource === 'satellite' ? '📡 SAT' : '⚙ SIM'}
            </span>
          )}
        </div>
      </div>

      {/* View nav */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-white/[0.02]">
        <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
          {VIEWS.find((v) => v.key === activeView)?.label}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-white/25">A◀</span>
          <div className="flex gap-1">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                onClick={() => {
                  /* pointer-events-none wrapper — no click, but dots show state */
                }}
                className={`w-1.5 h-1.5 rounded-full transition ${activeView === v.key ? 'bg-cyan-400' : 'bg-white/20'}`}
              />
            ))}
          </div>
          <span className="text-[9px] text-white/25">▶S</span>
        </div>
      </div>

      {/* View content */}
      <div className="px-4 py-3 text-xs">
        {activeView === 'risk' && <ViewRisk ed={ed} zone={zone} />}
        {activeView === 'water' && <ViewWater ed={ed} wetlandZoneIds={wetlandZoneIds} zoneId={zone.id} />}
        {activeView === 'climate' && <ViewClimate ed={ed} />}
        {activeView === 'infra' && <ViewInfra zone={zone} />}
      </div>

      {/* Keyboard hint */}
      <div className="px-4 pb-2 text-[9px] text-white/20 text-center">
        A / S para cambiar vista
      </div>
    </div>
  );
}
