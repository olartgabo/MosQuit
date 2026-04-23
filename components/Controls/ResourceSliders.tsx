'use client';

import { ResourceConstraints } from '@/types';

interface ResourceSlidersProps {
  constraints: ResourceConstraints;
  onChange: (constraints: ResourceConstraints) => void;
}

export default function ResourceSliders({ constraints, onChange }: ResourceSlidersProps) {
  const updateConstraint = (key: keyof ResourceConstraints, value: number) => {
    onChange({
      ...constraints,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Available Teams */}
      <SliderControl
        label="Fumigation Teams"
        value={constraints.availableTeams}
        min={1}
        max={10}
        step={1}
        onChange={(value) => updateConstraint('availableTeams', value)}
        description={`${constraints.availableTeams} team${constraints.availableTeams > 1 ? 's' : ''} available`}
      />

      {/* Budget */}
      <SliderControl
        label="Total Budget"
        value={constraints.budgetTotal}
        min={10000}
        max={100000}
        step={5000}
        onChange={(value) => updateConstraint('budgetTotal', value)}
        description={`$${constraints.budgetTotal.toLocaleString()}`}
        formatter={(v) => `$${(v / 1000).toFixed(0)}k`}
      />

      {/* Time Window */}
      <SliderControl
        label="Time Window"
        value={constraints.timeWindow}
        min={24}
        max={168}
        step={24}
        onChange={(value) => updateConstraint('timeWindow', value)}
        description={`${constraints.timeWindow} hours (${Math.floor(constraints.timeWindow / 24)} days)`}
        formatter={(v) => `${v}h`}
      />

      {/* Cost Per Zone */}
      <div className="pt-4 border-t border-gray-700">
        <div className="text-sm text-gray-400 mb-2">
          Cost per zone: ${constraints.fumigationCostPerZone.toLocaleString()}
        </div>
        <div className="text-sm text-gray-400">
          Max zones with budget: {Math.floor(constraints.budgetTotal / constraints.fumigationCostPerZone)}
        </div>
      </div>
    </div>
  );
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  description: string;
  formatter?: (value: number) => string;
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  description,
  formatter,
}: SliderControlProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-300">
          {label}
        </label>
        <span className="text-sm font-bold text-white">
          {description}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />

      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{formatter ? formatter(min) : min}</span>
        <span>{formatter ? formatter(max) : max}</span>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #3b82f6;
          cursor: pointer;
          border-radius: 50%;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #3b82f6;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }

        .slider::-webkit-slider-thumb:hover {
          background: #2563eb;
        }

        .slider::-moz-range-thumb:hover {
          background: #2563eb;
        }
      `}</style>
    </div>
  );
}
