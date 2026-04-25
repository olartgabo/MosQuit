'use client';

import type { DataLayer } from '@/types';
import { DATA_LAYER_CONFIG } from '@/lib/config/dataLayers';

interface DataLayerSelectorProps {
  active: DataLayer;
  onChange: (layer: DataLayer) => void;
}

const LAYER_ORDER: DataLayer[] = [
  'infection',
  'water_humidity',
  'vegetation',
  'biological_risk',
  'climate',
];

function Swatch({ colorFrom, colorMid, colorTo }: { colorFrom: string; colorMid?: string; colorTo: string }) {
  const stops = colorMid
    ? `${colorFrom}, ${colorMid}, ${colorTo}`
    : `${colorFrom}, ${colorTo}`;
  return (
    <span
      className="inline-block w-3 h-3 rounded-full flex-none"
      style={{ background: `linear-gradient(90deg, ${stops})` }}
    />
  );
}

export default function DataLayerSelector({ active, onChange }: DataLayerSelectorProps) {
  return (
    <div className="pointer-events-auto flex rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl overflow-hidden">
      {LAYER_ORDER.map((layer) => {
        const cfg = DATA_LAYER_CONFIG[layer];
        const isActive = active === layer;
        return (
          <button
            key={layer}
            onClick={() => onChange(layer)}
            title={cfg.description}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition ${
              isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Swatch colorFrom={cfg.colorFrom} colorMid={cfg.colorMid} colorTo={cfg.colorTo} />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
