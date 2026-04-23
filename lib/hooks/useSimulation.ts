'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { runSimulation, type SimulationSnapshot } from '@/lib/simulation/engine';
import type { SimulationParameters, Zone } from '@/types';

interface UseSimulationArgs {
  zones: Zone[];
  params: SimulationParameters;
  selectedZoneIds: number[];
  totalDays?: number;
}

const TICK_MS = 900;

export function useSimulation({ zones, params, selectedZoneIds, totalDays = 7 }: UseSimulationArgs) {
  const [day, setDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const aiSnapshots = useMemo<SimulationSnapshot[]>(
    () => runSimulation(zones, params, selectedZoneIds, totalDays),
    [zones, params, selectedZoneIds, totalDays]
  );

  const baselineSnapshots = useMemo<SimulationSnapshot[]>(
    () => runSimulation(zones, params, [], totalDays),
    [zones, params, totalDays]
  );

  const current = aiSnapshots[Math.min(day, aiSnapshots.length - 1)];
  const baselineCurrent = baselineSnapshots[Math.min(day, baselineSnapshots.length - 1)];

  const history = aiSnapshots.slice(0, day + 1).map((s) => s.metrics);
  const baselineHistory = baselineSnapshots.slice(0, day + 1).map((s) => s.metrics);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setDay(0);
  }, []);

  const step = useCallback(
    (delta: number) => {
      setDay((d) => Math.max(0, Math.min(totalDays, d + delta)));
    },
    [totalDays]
  );

  const playPause = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = TICK_MS / speed;
    tickRef.current = setInterval(() => {
      setDay((d) => {
        if (d >= totalDays) {
          setIsPlaying(false);
          return d;
        }
        return d + 1;
      });
    }, interval);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isPlaying, speed, totalDays]);

  useEffect(() => {
    if (selectedZoneIds.length > 0) {
      setDay(0);
      setIsPlaying(false);
    }
  }, [selectedZoneIds]);

  return {
    day,
    totalDays,
    isPlaying,
    speed,
    current,
    baselineCurrent,
    history,
    baselineHistory,
    zonesAtDay: current.zones,
    setSpeed,
    playPause,
    step,
    reset,
  };
}
