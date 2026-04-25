import type {
  DayMetrics,
  Intervention,
  SimulationParameters,
  Zone,
} from '@/types';

export interface SimulationSnapshot {
  day: number;
  zones: Zone[];
  metrics: DayMetrics;
}

function cloneZone(z: Zone): Zone {
  return {
    ...z,
    interventions: [...z.interventions],
    adjacentZoneIds: [...z.adjacentZoneIds],
    environmentalFactors: { ...z.environmentalFactors },
  };
}

export function cloneZones(zones: Zone[]): Zone[] {
  return zones.map(cloneZone);
}

function interventionMultiplier(zone: Zone, day: number, params: SimulationParameters): number {
  let reduction = 0;
  for (const iv of zone.interventions) {
    if (iv.type !== 'fumigation') continue;
    const daysSince = day - iv.appliedOnDay;
    if (daysSince < 0 || daysSince >= iv.effectiveDays) continue;
    const decay = 1 - daysSince / iv.effectiveDays;
    reduction = Math.max(reduction, iv.effectivenessReduction * decay);
  }
  return 1 - reduction;
}

export function stepDay(
  zones: Zone[],
  day: number,
  params: SimulationParameters,
  rng: () => number = Math.random
): { zones: Zone[]; metrics: DayMetrics } {
  const next = cloneZones(zones);
  let newInfections = 0;
  let cumulative = 0;

  // Pre-compute infection pressure from each zone into neighbors
  for (let i = 0; i < next.length; i++) {
    const z = next[i];
    const mult = interventionMultiplier(z, day, params);
    // Blend infection-state risk with satellite-derived breeding risk when available.
    // This makes breeding hotspots spread disease faster, rewarding plans that target sources.
    const effectiveRisk = z.breedingRisk
      ? z.baseRisk * 0.5 + z.breedingRisk.compositeBreedingScore * 0.5
      : z.baseRisk;
    const localPressure =
      (z.infected / Math.max(1, z.susceptible + z.infected + z.recovered)) *
      params.baseTransmissionRate *
      (1 + z.populationDensity * params.densitySpreadMultiplier) *
      effectiveRisk *
      mult;

    // Internal spread within zone
    const variance = 1 + (rng() - 0.5) * 2 * params.randomVariance;
    const internalInfected = Math.min(
      z.susceptible,
      Math.floor(z.susceptible * localPressure * variance)
    );

    // Adjacent spread
    let fromNeighbors = 0;
    for (const nid of z.adjacentZoneIds) {
      const neighbor = zones.find((n) => n.id === nid);
      if (!neighbor) continue;
      const neighborPressure =
        (neighbor.infected / Math.max(1, neighbor.susceptible + neighbor.infected + neighbor.recovered)) *
        params.baseTransmissionRate *
        params.adjacentZoneSpreadMultiplier *
        interventionMultiplier(neighbor, day, params) *
        mult;
      fromNeighbors += Math.floor(z.susceptible * neighborPressure * 0.1 * variance);
    }

    const totalNew = Math.min(z.susceptible, internalInfected + fromNeighbors);

    // Recovery
    const recovered = Math.floor(z.infected * params.recoveryRate);

    z.susceptible = Math.max(0, z.susceptible - totalNew);
    z.infected = Math.max(0, z.infected + totalNew - recovered);
    z.recovered = z.recovered + recovered;

    newInfections += totalNew;
    cumulative += z.infected + z.recovered;
  }

  const metrics: DayMetrics = {
    day,
    totalSusceptible: next.reduce((s, z) => s + z.susceptible, 0),
    totalInfected: next.reduce((s, z) => s + z.infected, 0),
    totalRecovered: next.reduce((s, z) => s + z.recovered, 0),
    newInfections,
    cumulativeInfections: cumulative,
    interventionsApplied: [],
    costSpent: 0,
    narrative: '',
  };

  return { zones: next, metrics };
}

export function applyInterventions(
  zones: Zone[],
  zoneIds: number[],
  day: number,
  params: SimulationParameters
): { zones: Zone[]; cost: number; interventions: Intervention[] } {
  const next = cloneZones(zones);
  const applied: Intervention[] = [];
  let cost = 0;
  for (const z of next) {
    if (!zoneIds.includes(z.id)) continue;
    const iv: Intervention = {
      type: 'fumigation',
      appliedOnDay: day,
      effectiveDays: params.fumigationDuration,
      effectivenessReduction: params.fumigationEffectiveness,
      cost: params.fumigationCostPerZone,
    };
    z.interventions.push(iv);
    applied.push(iv);
    cost += iv.cost;
  }
  return { zones: next, cost, interventions: applied };
}

export function runSimulation(
  initial: Zone[],
  params: SimulationParameters,
  interventionZoneIds: number[],
  days: number
): SimulationSnapshot[] {
  const snapshots: SimulationSnapshot[] = [];

  // Day 0 — apply interventions
  const { zones: seeded, cost, interventions } = applyInterventions(initial, interventionZoneIds, 0, params);
  snapshots.push({
    day: 0,
    zones: seeded,
    metrics: {
      day: 0,
      totalSusceptible: seeded.reduce((s, z) => s + z.susceptible, 0),
      totalInfected: seeded.reduce((s, z) => s + z.infected, 0),
      totalRecovered: seeded.reduce((s, z) => s + z.recovered, 0),
      newInfections: 0,
      cumulativeInfections: seeded.reduce((s, z) => s + z.infected + z.recovered, 0),
      interventionsApplied: interventions,
      costSpent: cost,
      narrative: interventions.length
        ? `Day 0: ${interventions.length} fumigation teams deployed.`
        : 'Day 0: no interventions applied.',
    },
  });

  let currentZones = seeded;
  for (let d = 1; d <= days; d++) {
    const { zones: stepped, metrics } = stepDay(currentZones, d, params);
    metrics.narrative =
      metrics.newInfections > 0
        ? `Day ${d}: ${metrics.newInfections} new infections across the city.`
        : `Day ${d}: outbreak contained for now.`;
    snapshots.push({ day: d, zones: stepped, metrics });
    currentZones = stepped;
  }

  return snapshots;
}
