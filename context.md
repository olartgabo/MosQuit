# MosQuit - Technical Implementation Context

This document provides detailed technical specifications, data structures, algorithms, and implementation patterns for the MosQuit project.

---

## Table of Contents

1. [Data Models & TypeScript Interfaces](#data-models--typescript-interfaces)
2. [Agent System Architecture](#agent-system-architecture)
3. [Simulation Engine Details](#simulation-engine-details)
4. [Map Integration](#map-integration)
5. [API Integration Patterns](#api-integration-patterns)
6. [State Management](#state-management)
7. [UI/UX Design Patterns](#uiux-design-patterns)
8. [Performance Optimization](#performance-optimization)
9. [Error Handling](#error-handling)
10. [Deployment Configuration](#deployment-configuration)

---

## Data Models & TypeScript Interfaces

### Core Types (`src/types/index.ts`)

```typescript
// ============================================================================
// ZONE TYPES
// ============================================================================

export interface Zone {
  id: number;
  name: string;
  geometry: GeoJSON.Polygon; // GeoJSON polygon for map rendering
  centroid: [number, number]; // [lng, lat] for positioning

  // Population data
  population: number;
  populationDensity: number; // people per km²

  // Risk factors (0-1 range)
  baseRisk: number; // Environmental suitability for mosquitoes
  environmentalFactors: {
    temperature: number; // Celsius
    humidity: number; // 0-1
    vegetation: number; // 0-1
    waterProximity: number; // 0-1
  };

  // Disease state (SIR model)
  susceptible: number; // People not yet infected
  infected: number; // Current active cases
  recovered: number; // Recovered (immune)

  // Interventions applied to this zone
  interventions: Intervention[];

  // Adjacency (for spread calculation)
  adjacentZoneIds: number[];

  // Metadata
  landUse: 'residential' | 'commercial' | 'industrial' | 'mixed';
  hasSensitiveLocation: boolean; // Schools, hospitals, etc.
}

export interface Intervention {
  type: 'fumigation' | 'education' | 'cleanup';
  appliedOnDay: number;
  effectiveDays: number; // How long it lasts
  effectivenessReduction: number; // 0-1, how much it reduces transmission
  cost: number; // In dollars
  teamId?: number; // Which team applied it
}

// ============================================================================
// AGENT TYPES
// ============================================================================

export type AgentType =
  | 'epidemiologist'
  | 'budget'
  | 'operations'
  | 'public_risk';

export interface AgentPersonality {
  type: AgentType;
  name: string;
  objective: string;
  personality: string;
  biases: string[];
  color: string; // For UI display
  icon: string; // Icon identifier
}

export interface AgentProposal {
  agent: AgentType;
  recommendedZones: number[]; // Zone IDs to fumigate
  teamAllocation: TeamAllocation[]; // How to allocate teams
  reasoning: string; // Why this plan?
  concerns: string[]; // What are the risks?
  confidence: number; // 0-1
  estimatedOutcome: {
    infectionsAvoided: number;
    totalCost: number;
    zonesProtected: number;
  };
}

export interface TeamAllocation {
  teamId: number;
  zoneId: number;
  day: number; // Which day to intervene
  travelTime: number; // Hours to reach zone
}

export interface AgentCritique {
  agent: AgentType;
  targetAgent: AgentType; // Who they're critiquing
  agreementPoints: string[]; // What they agree with
  disagreementPoints: string[]; // What they challenge
  alternativeSuggestions: string[];
}

export interface AgentResponse {
  agent: AgentType;
  respondingTo: AgentType[]; // Which agents they're addressing
  revisedProposal?: AgentProposal; // Updated plan if changed
  defenseOfPosition: string; // Why they're sticking with it
  compromises: string[]; // What they're willing to give up
}

export interface ConsensusPlan {
  selectedZones: number[];
  teamAllocations: TeamAllocation[];

  reasoning: {
    whyTheseZones: string;
    whyNotOtherZones: string;
    tradeoffsMade: string[];
  };

  agentAgreement: {
    fullySupported: AgentType[]; // Agents that fully agree
    partiallySupported: AgentType[]; // Agents that reluctantly agree
    keyDisagreements: string[]; // Remaining concerns
  };

  expectedOutcome: {
    estimatedInfections: number;
    totalCost: number;
    zonesProtected: number;
    riskRemaining: number; // 0-1
  };

  sensitivity: {
    ifBudgetCut: string; // What happens if less budget
    ifDelayed: string; // What happens if delayed 1 day
  };
}

// ============================================================================
// SIMULATION TYPES
// ============================================================================

export interface SimulationState {
  currentDay: number;
  zones: Zone[];
  interventions: Intervention[];

  dailyMetrics: DayMetrics[];

  isRunning: boolean;
  speed: 1 | 2 | 5; // Simulation speed multiplier
}

export interface DayMetrics {
  day: number;
  totalSusceptible: number;
  totalInfected: number;
  totalRecovered: number;
  newInfections: number; // New cases this day
  cumulativeInfections: number;

  interventionsApplied: Intervention[];
  costSpent: number;

  narrative: string; // Claude-generated summary of this day
}

export interface SimulationParameters {
  // Disease characteristics
  baseTransmissionRate: number; // 0-1 per day
  recoveryRate: number; // 0-1 per day
  incubationPeriod: number; // Days before infectious

  // Intervention parameters
  fumigationEffectiveness: number; // 0-1 reduction in transmission
  fumigationDuration: number; // Days it lasts
  fumigationCostPerZone: number; // Base cost

  // Spread mechanics
  adjacentZoneSpreadMultiplier: number; // 1.5 = 50% more likely to spread to adjacent
  densitySpreadMultiplier: number; // Higher density = faster spread

  // Random factors
  randomSeed?: number; // For reproducible simulations
  randomVariance: number; // 0-1 how much randomness to add
}

// ============================================================================
// CONSTRAINTS & RESOURCES
// ============================================================================

export interface ResourceConstraints {
  availableTeams: number; // How many fumigation teams
  budgetTotal: number; // Total budget in dollars
  timeWindow: number; // Days to deploy all interventions

  // Team capabilities
  teamCapacity: number; // Zones per team per day
  teamSpeed: number; // km/hour travel speed

  // Costs
  fumigationCostPerZone: number;
  teamDeploymentCost: number; // Per team per day
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface DebateState {
  phase: 'idle' | 'proposing' | 'critiquing' | 'responding' | 'consensus' | 'complete';
  proposals: AgentProposal[];
  critiques: AgentCritique[];
  responses: AgentResponse[];
  consensusPlan?: ConsensusPlan;

  // For UI display
  streamingAgent?: AgentType; // Which agent is currently streaming
  streamingText?: string; // Partial text being streamed
}

export interface MapState {
  selectedZone?: number;
  hoveredZone?: number;
  highlightedZones: number[]; // From agent recommendations

  viewState: {
    latitude: number;
    longitude: number;
    zoom: number;
  };

  layersVisible: {
    heatmap: boolean;
    zones: boolean;
    interventions: boolean;
    infections: boolean;
  };
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface DebateRequest {
  zones: Zone[];
  constraints: ResourceConstraints;
  parameters: SimulationParameters;
}

export interface DebateResponse {
  consensusPlan: ConsensusPlan;
  debateTranscript: {
    proposals: AgentProposal[];
    critiques: AgentCritique[];
    responses: AgentResponse[];
  };

  thinkingTraces?: Record<AgentType, string>; // Extended thinking content
  metadata: {
    totalTokens: number;
    cachedTokens: number;
    durationMs: number;
  };
}
```

---

## Agent System Architecture

### Agent Prompt Templates

#### System Prompt Structure

All agents follow this template pattern:

```typescript
const createAgentPrompt = (agentType: AgentType, personality: AgentPersonality) => `
You are ${personality.name}, a ${personality.personality} working in a dengue outbreak response team.

YOUR ROLE AND OBJECTIVE:
${personality.objective}

YOUR PERSONALITY TRAITS:
${personality.biases.map(b => `- ${b}`).join('\n')}

CONSTRAINTS YOU MUST RESPECT:
- Available fumigation teams: {constraints.availableTeams}
- Total budget: ${constraints.budgetTotal}
- Time window: {constraints.timeWindow} days

YOUR TASK:
{task_specific_instructions}

OUTPUT FORMAT:
Return a JSON object with the following structure:
{output_schema}

IMPORTANT:
- Be true to your role and biases
- Consider trade-offs explicitly
- Disagree with other agents if you genuinely think they're wrong
- Don't compromise your core objectives just to agree
- Provide specific reasoning, not generic statements
`;
```

#### Epidemiologist Agent

```typescript
export const EPIDEMIOLOGIST_SYSTEM_PROMPT = `
You are Dr. Sarah Chen, an aggressive disease control specialist with 15 years of field experience in dengue outbreaks.

YOUR ROLE AND OBJECTIVE:
Minimize total infections at all costs. You prioritize public health over budget concerns and believe early, aggressive intervention saves lives in the long run.

YOUR PERSONALITY TRAITS:
- Urgency-driven: "Every hour we wait, infections double"
- Data-obsessed: You trust numbers and models
- Risk-averse: Better to over-intervene than under-intervene
- Dismissive of cost concerns: "You can't put a price on human life"
- Pattern recognition: You see how outbreaks cascade

YOUR BIASES:
- Favor high-risk zones even if expensive
- Prefer early intervention over waiting
- Prioritize zones adjacent to active outbreaks
- Distrust "wait and see" approaches
- Value dense population areas (more lives at stake)

DECISION HEURISTICS:
1. Identify zones with infected > 0 (active outbreaks)
2. Identify high-risk adjacent zones (prevent spread)
3. Calculate expected infections if no action taken
4. Recommend aggressive intervention in top N zones by risk × population

YOU WILL ARGUE WITH:
- Budget Agent (who wants to save money)
- Operations Agent (who says "we can't do everything")

YOU MIGHT AGREE WITH:
- Public Risk Agent (who also prioritizes visible action)

Remember: You genuinely believe aggressive intervention is the only ethical choice.
`;
```

#### Budget Agent

```typescript
export const BUDGET_AGENT_SYSTEM_PROMPT = `
You are Marcus Thompson, a cost-effectiveness analyst who has seen too many wasteful public health campaigns.

YOUR ROLE AND OBJECTIVE:
Maximize return on investment. Every dollar spent should avert the maximum number of infections. You're not heartless—you believe smart spending saves MORE lives than wasteful spending.

YOUR PERSONALITY TRAITS:
- Analytical: You calculate cost per infection averted
- Skeptical: "Show me the numbers"
- Long-term thinker: Budget spent today can't be used for future outbreaks
- Pragmatic: Perfect is the enemy of good enough
- Defensive: You're used to being called heartless

YOUR BIASES:
- Favor lower-cost interventions
- Question expensive zones: "Is it really worth $12k?"
- Prefer targeted intervention over blanket coverage
- Value cost-effectiveness over absolute lives saved
- Distrust "spare no expense" mentality

DECISION HEURISTICS:
1. Calculate cost per infection averted for each zone
2. Rank zones by ROI (infections averted / cost)
3. Select top zones until budget exhausted
4. Challenge expensive recommendations with alternatives

YOU WILL ARGUE WITH:
- Epidemiologist (who ignores costs)
- Public Risk Agent (who prioritizes optics over efficiency)

YOU MIGHT AGREE WITH:
- Operations Agent (who also values pragmatism)

Remember: You believe constrained resources demand ruthless prioritization.
`;
```

#### Operations Agent

```typescript
export const OPERATIONS_AGENT_SYSTEM_PROMPT = `
You are Lt. Col. Rodriguez (retired), a logistics expert who has deployed teams in 30+ disaster zones.

YOUR ROLE AND OBJECTIVE:
Ensure the plan is actually executable. You've seen brilliant plans fail because nobody checked if teams could physically reach zones in time, or if equipment was available.

YOUR PERSONALITY TRAITS:
- Detail-oriented: "The devil is in the logistics"
- Realistic: You know what can and can't be done
- Time-conscious: Travel time matters
- Resource-aware: Teams can't be in two places at once
- No-nonsense: You call out magical thinking

YOUR BIASES:
- Favor geographically clustered zones (reduce travel time)
- Question plans that overextend team capacity
- Prioritize feasibility over optimal outcomes
- Distrust plans with no execution buffer
- Value simple plans over complex optimization

DECISION HEURISTICS:
1. Check if number of zones <= teams × days available
2. Calculate travel times between zones
3. Identify unrealistic schedules (team can't be in Zone 1 day 1 and Zone 10 day 2)
4. Propose clustered intervention zones

YOU WILL ARGUE WITH:
- Epidemiologist (who wants to do too much)
- Anyone proposing logistically impossible plans

YOU MIGHT AGREE WITH:
- Budget Agent (who also values pragmatism)

Remember: You've seen great plans fail due to logistics. You won't let that happen.
`;
```

#### Public Risk Agent

```typescript
export const PUBLIC_RISK_AGENT_SYSTEM_PROMPT = `
You are Diana Okafor, a public health communications director who manages crisis PR for the Health Department.

YOUR ROLE AND OBJECTIVE:
Minimize public panic and maintain trust in government response. You know that perception matters—if the public loses faith, they won't cooperate with future interventions.

YOUR PERSONALITY TRAITS:
- Perception-focused: "How will this look?"
- Strategic: You think 3 steps ahead
- Empathetic: You understand public fears
- Media-savvy: You know what makes headlines
- Politically aware: Some zones are more visible than others

YOUR BIASES:
- Favor interventions in visible areas (schools, hospitals, downtowns)
- Question interventions that might cause panic if publicized
- Prioritize equity: "Why did rich areas get fumigated first?"
- Value symbolic action even if not most cost-effective
- Distrust plans that look like "we're abandoning poor neighborhoods"

DECISION HEURISTICS:
1. Identify zones with sensitive locations (schools, hospitals)
2. Check for equity: Are interventions distributed across socioeconomic areas?
3. Consider media narrative: "Health Dept acts swiftly to protect schools"
4. Flag zones where inaction could cause outrage

YOU WILL ARGUE WITH:
- Budget Agent (who might skip visible zones to save money)
- Epidemiologist (who might focus on stats over optics)

YOU MIGHT AGREE WITH:
- Operations Agent (who values clear, simple plans)

Remember: A perfect plan that destroys public trust is worse than an imperfect plan people believe in.
`;
```

### Debate Orchestration Flow

**Phase 1: Independent Proposals (Parallel)**

```typescript
async function generateProposals(
  zones: Zone[],
  constraints: ResourceConstraints,
  parameters: SimulationParameters
): Promise<AgentProposal[]> {

  const zoneContext = {
    type: "text",
    text: JSON.stringify(zones),
    cache_control: { type: "ephemeral" } // Cache this across all agents
  };

  const constraintsContext = {
    type: "text",
    text: JSON.stringify(constraints),
    cache_control: { type: "ephemeral" }
  };

  // Parallel API calls to all 4 agents
  const proposals = await Promise.all([
    callAgent('epidemiologist', zoneContext, constraintsContext, 'propose'),
    callAgent('budget', zoneContext, constraintsContext, 'propose'),
    callAgent('operations', zoneContext, constraintsContext, 'propose'),
    callAgent('public_risk', zoneContext, constraintsContext, 'propose'),
  ]);

  return proposals;
}
```

**Phase 2: Critique Round**

```typescript
async function generateCritiques(
  proposals: AgentProposal[],
  zones: Zone[],
  constraints: ResourceConstraints
): Promise<AgentCritique[]> {

  // Each agent sees all proposals and critiques them
  const proposalsContext = {
    type: "text",
    text: JSON.stringify(proposals),
    cache_control: { type: "ephemeral" }
  };

  const critiques = await Promise.all([
    callAgent('epidemiologist', proposalsContext, 'critique'),
    callAgent('budget', proposalsContext, 'critique'),
    callAgent('operations', proposalsContext, 'critique'),
    callAgent('public_risk', proposalsContext, 'critique'),
  ]);

  return critiques;
}
```

**Phase 3: Response Round**

```typescript
async function generateResponses(
  proposals: AgentProposal[],
  critiques: AgentCritique[]
): Promise<AgentResponse[]> {

  const debateContext = {
    type: "text",
    text: JSON.stringify({ proposals, critiques }),
    cache_control: { type: "ephemeral" }
  };

  const responses = await Promise.all(
    AGENT_TYPES.map(agentType =>
      callAgent(agentType, debateContext, 'respond')
    )
  );

  return responses;
}
```

**Phase 4: Consensus Synthesis**

```typescript
async function synthesizeConsensus(
  proposals: AgentProposal[],
  critiques: AgentCritique[],
  responses: AgentResponse[],
  constraints: ResourceConstraints
): Promise<ConsensusPlan> {

  const fullDebateContext = {
    type: "text",
    text: JSON.stringify({ proposals, critiques, responses }),
  };

  const systemPrompt = `
You are a neutral facilitator tasked with synthesizing a consensus plan from a debate between 4 agents with different priorities.

AGENTS:
- Epidemiologist: Wants to minimize infections
- Budget Officer: Wants to minimize costs
- Operations Manager: Wants feasible execution
- Public Risk Advisor: Wants to minimize panic

YOUR TASK:
1. Identify areas of agreement
2. Resolve conflicts by finding compromises
3. Create a unified intervention plan
4. Document trade-offs made
5. Note which agents fully/partially support the plan

OUTPUT:
A ConsensusPlan JSON object that balances all perspectives.
`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4.7",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{
      role: "user",
      content: [
        fullDebateContext,
        {
          type: "text",
          text: "Synthesize a consensus intervention plan that balances all agent perspectives."
        }
      ]
    }],
    thinking: {
      type: "enabled",
      budget_tokens: 3000 // Use extended thinking for complex synthesis
    }
  });

  return JSON.parse(response.content[0].text);
}
```

---

## Simulation Engine Details

### Infection Spread Algorithm

```typescript
export class SimulationEngine {
  private state: SimulationState;
  private parameters: SimulationParameters;
  private rng: SeededRandom; // For reproducibility

  /**
   * Run one day tick of the simulation
   */
  public tick(): DayMetrics {
    this.state.currentDay++;

    const dayMetrics: DayMetrics = {
      day: this.state.currentDay,
      totalSusceptible: 0,
      totalInfected: 0,
      totalRecovered: 0,
      newInfections: 0,
      cumulativeInfections: 0,
      interventionsApplied: [],
      costSpent: 0,
      narrative: "",
    };

    // 1. Apply interventions scheduled for this day
    this.applyScheduledInterventions(dayMetrics);

    // 2. Spread infection from infected zones to adjacent zones
    this.spreadInfection(dayMetrics);

    // 3. Progress disease within each zone (new infections → recovery)
    this.progressDisease(dayMetrics);

    // 4. Calculate metrics
    this.calculateMetrics(dayMetrics);

    // 5. Generate narrative (async, can be done separately)
    // this.generateNarrative(dayMetrics);

    this.state.dailyMetrics.push(dayMetrics);
    return dayMetrics;
  }

  /**
   * Calculate infection spread to adjacent zones
   */
  private spreadInfection(metrics: DayMetrics): void {
    const newInfections: Map<number, number> = new Map();

    for (const zone of this.state.zones) {
      if (zone.infected === 0) continue; // No infected people, no spread

      const infectionPressure = this.calculateInfectionPressure(zone);

      // Spread to adjacent zones
      for (const adjacentId of zone.adjacentZoneIds) {
        const adjacentZone = this.state.zones.find(z => z.id === adjacentId);
        if (!adjacentZone || adjacentZone.susceptible === 0) continue;

        const spreadProb = this.calculateSpreadProbability(
          zone,
          adjacentZone,
          infectionPressure
        );

        // Stochastic spread
        if (this.rng.random() < spreadProb) {
          const newInfected = Math.min(
            adjacentZone.susceptible,
            Math.ceil(adjacentZone.susceptible * spreadProb * 0.1) // 10% of susceptible
          );

          newInfections.set(
            adjacentId,
            (newInfections.get(adjacentId) || 0) + newInfected
          );
        }
      }
    }

    // Apply new infections
    for (const [zoneId, count] of newInfections.entries()) {
      const zone = this.state.zones.find(z => z.id === zoneId)!;
      zone.susceptible -= count;
      zone.infected += count;
      metrics.newInfections += count;
    }
  }

  /**
   * Calculate infection pressure from a source zone
   */
  private calculateInfectionPressure(zone: Zone): number {
    const basePrevalence = zone.infected / zone.population;

    // Adjust for environmental factors
    const envMultiplier =
      (zone.environmentalFactors.humidity * 0.4) +
      (zone.environmentalFactors.temperature / 40 * 0.3) + // Optimal around 25-30°C
      (zone.environmentalFactors.waterProximity * 0.3);

    return basePrevalence * envMultiplier;
  }

  /**
   * Calculate probability of spread from source to target zone
   */
  private calculateSpreadProbability(
    source: Zone,
    target: Zone,
    infectionPressure: number
  ): number {
    // Base transmission rate
    let prob = this.parameters.baseTransmissionRate * infectionPressure;

    // Multiply by target zone's base risk (environmental suitability)
    prob *= target.baseRisk;

    // Multiply by population density factor (more dense = easier spread)
    const densityFactor = 1 + (target.populationDensity / 10000); // Normalize
    prob *= densityFactor * this.parameters.densitySpreadMultiplier;

    // Adjacent zones have higher spread
    prob *= this.parameters.adjacentZoneSpreadMultiplier;

    // Reduce by intervention effectiveness
    const interventionReduction = this.getInterventionEffect(target);
    prob *= (1 - interventionReduction);

    // Add random variance
    const variance = (this.rng.random() - 0.5) * this.parameters.randomVariance;
    prob += variance;

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, prob));
  }

  /**
   * Get current intervention effect for a zone
   */
  private getInterventionEffect(zone: Zone): number {
    let totalReduction = 0;

    for (const intervention of zone.interventions) {
      const daysSinceApplied = this.state.currentDay - intervention.appliedOnDay;

      if (daysSinceApplied >= 0 && daysSinceApplied < intervention.effectiveDays) {
        // Linear decay: full effect on day 0, zero on day effectiveDays
        const decayFactor = 1 - (daysSinceApplied / intervention.effectiveDays);
        totalReduction += intervention.effectivenessReduction * decayFactor;
      }
    }

    // Cap at 95% reduction (interventions not perfect)
    return Math.min(0.95, totalReduction);
  }

  /**
   * Progress disease within each zone (SIR model)
   */
  private progressDisease(metrics: DayMetrics): void {
    for (const zone of this.state.zones) {
      if (zone.infected === 0) continue;

      // Recovery: infected → recovered
      const recovering = Math.ceil(zone.infected * this.parameters.recoveryRate);
      zone.infected -= recovering;
      zone.recovered += recovering;
    }
  }

  /**
   * Apply interventions scheduled for current day
   */
  private applyScheduledInterventions(metrics: DayMetrics): void {
    const todaysInterventions = this.state.interventions.filter(
      i => i.appliedOnDay === this.state.currentDay
    );

    for (const intervention of todaysInterventions) {
      // Find zone and add intervention
      const zone = this.state.zones.find(z =>
        z.interventions.includes(intervention)
      );

      if (zone) {
        metrics.interventionsApplied.push(intervention);
        metrics.costSpent += intervention.cost;
      }
    }
  }

  /**
   * Calculate aggregate metrics
   */
  private calculateMetrics(metrics: DayMetrics): void {
    for (const zone of this.state.zones) {
      metrics.totalSusceptible += zone.susceptible;
      metrics.totalInfected += zone.infected;
      metrics.totalRecovered += zone.recovered;
    }

    metrics.cumulativeInfections =
      this.state.dailyMetrics.reduce((sum, m) => sum + m.newInfections, 0) +
      metrics.newInfections;
  }
}
```

### Seeded Random Number Generator

```typescript
/**
 * Seeded RNG for reproducible simulations
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  public random(): number {
    // Linear Congruential Generator
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  public randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
}
```

---

## Map Integration

### Mapbox GL Setup

```typescript
// src/components/Map/MapView.tsx

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export function MapView({ zones, selectedZones }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Dark theme for drama
      center: [CITY_CENTER_LNG, CITY_CENTER_LAT],
      zoom: 11,
    });

    map.current.on('load', () => {
      addZonesLayer(map.current!, zones);
      addHeatmapLayer(map.current!, zones);
    });

    return () => map.current?.remove();
  }, []);

  // Update heatmap when zone risks change
  useEffect(() => {
    if (!map.current) return;
    updateHeatmap(map.current, zones);
  }, [zones]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
```

### Heatmap Layer

```typescript
function addHeatmapLayer(map: mapboxgl.Map, zones: Zone[]) {
  // Create GeoJSON feature collection
  const heatmapData: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: zones.map(zone => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: zone.centroid,
      },
      properties: {
        risk: zone.baseRisk,
        infected: zone.infected,
        population: zone.population,
      },
    })),
  };

  map.addSource('zone-heatmap', {
    type: 'geojson',
    data: heatmapData,
  });

  map.addLayer({
    id: 'heatmap-layer',
    type: 'heatmap',
    source: 'zone-heatmap',
    paint: {
      // Weight by risk and infected count
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', 'risk'],
        0, 0,
        1, 1,
      ],

      // Color ramp: green → yellow → red
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(0, 255, 0, 0)',
        0.3, 'rgba(255, 255, 0, 0.5)',
        0.6, 'rgba(255, 128, 0, 0.7)',
        1, 'rgba(255, 0, 0, 1)',
      ],

      // Radius increases with zoom
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        9, 20,
        15, 40,
      ],

      'heatmap-opacity': 0.7,
    },
  });
}
```

### Infection Spread Animation

```typescript
/**
 * Animate infection spreading from source zone
 */
export function animateInfectionSpread(
  map: mapboxgl.Map,
  fromZoneId: number,
  toZoneId: number,
  zones: Zone[]
) {
  const fromZone = zones.find(z => z.id === fromZoneId)!;
  const toZone = zones.find(z => z.id === toZoneId)!;

  // Create ripple effect
  const rippleId = `ripple-${fromZoneId}-${toZoneId}-${Date.now()}`;

  map.addSource(rippleId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: fromZone.centroid,
      },
    },
  });

  // Animate circle expanding from source to target
  let frame = 0;
  const totalFrames = 30;

  const animate = () => {
    frame++;
    const progress = frame / totalFrames;

    const radius = progress * 2000; // 2km max radius
    const opacity = 1 - progress;

    map.setPaintProperty(rippleId + '-layer', 'circle-radius', radius);
    map.setPaintProperty(rippleId + '-layer', 'circle-opacity', opacity);

    if (frame < totalFrames) {
      requestAnimationFrame(animate);
    } else {
      // Cleanup
      map.removeLayer(rippleId + '-layer');
      map.removeSource(rippleId);
    }
  };

  map.addLayer({
    id: rippleId + '-layer',
    type: 'circle',
    source: rippleId,
    paint: {
      'circle-radius': 0,
      'circle-color': '#ff0000',
      'circle-opacity': 1,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  });

  animate();
}
```

---

## API Integration Patterns

### Anthropic Client Wrapper

```typescript
// src/lib/utils/anthropic.ts

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface StreamingCallbacks {
  onToken?: (token: string) => void;
  onThinking?: (thinking: string) => void;
  onComplete?: (fullText: string) => void;
}

/**
 * Call Claude API with prompt caching and streaming
 */
export async function callClaude({
  systemPrompt,
  messages,
  cachedContext = [],
  enableThinking = false,
  stream = false,
  callbacks = {},
}: {
  systemPrompt: string;
  messages: Anthropic.MessageParam[];
  cachedContext?: Anthropic.ContentBlock[];
  enableThinking?: boolean;
  stream?: boolean;
  callbacks?: StreamingCallbacks;
}) {
  const systemBlocks: Anthropic.ContentBlock[] = [
    {
      type: "text",
      text: systemPrompt,
    },
    ...cachedContext,
  ];

  if (stream) {
    return streamClaude({
      systemBlocks,
      messages,
      enableThinking,
      callbacks,
    });
  }

  const response = await client.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 4000,
    system: systemBlocks,
    messages,
    thinking: enableThinking ? {
      type: "enabled",
      budget_tokens: 2000,
    } : undefined,
  });

  return response;
}

/**
 * Stream Claude response with callbacks
 */
async function streamClaude({
  systemBlocks,
  messages,
  enableThinking,
  callbacks,
}: {
  systemBlocks: Anthropic.ContentBlock[];
  messages: Anthropic.MessageParam[];
  enableThinking: boolean;
  callbacks: StreamingCallbacks;
}) {
  const stream = await client.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 4000,
    system: systemBlocks,
    messages,
    thinking: enableThinking ? {
      type: "enabled",
      budget_tokens: 2000,
    } : undefined,
    stream: true,
  });

  let fullText = "";
  let thinkingText = "";

  for await (const event of stream) {
    if (event.type === "content_block_delta") {
      if (event.delta.type === "text_delta") {
        fullText += event.delta.text;
        callbacks.onToken?.(event.delta.text);
      } else if (event.delta.type === "thinking_delta") {
        thinkingText += event.delta.thinking;
        callbacks.onThinking?.(event.delta.thinking);
      }
    }
  }

  callbacks.onComplete?.(fullText);

  return { fullText, thinkingText };
}
```

---

## State Management

### Zustand Store

```typescript
// src/lib/store.ts

import { create } from 'zustand';

interface AppState {
  // Zone data
  zones: Zone[];
  setZones: (zones: Zone[]) => void;

  // Constraints
  constraints: ResourceConstraints;
  setConstraints: (constraints: ResourceConstraints) => void;

  // Debate state
  debateState: DebateState;
  setDebatePhase: (phase: DebateState['phase']) => void;
  addProposal: (proposal: AgentProposal) => void;
  setConsensusPlan: (plan: ConsensusPlan) => void;

  // Simulation state
  simulationState: SimulationState;
  setSimulationRunning: (running: boolean) => void;
  setSimulationSpeed: (speed: 1 | 2 | 5) => void;
  advanceSimulation: () => void;

  // Map state
  mapState: MapState;
  setSelectedZone: (zoneId?: number) => void;
  setHighlightedZones: (zoneIds: number[]) => void;
}

export const useStore = create<AppState>((set, get) => ({
  zones: [],
  setZones: (zones) => set({ zones }),

  constraints: {
    availableTeams: 4,
    budgetTotal: 30000,
    timeWindow: 48,
    teamCapacity: 1,
    teamSpeed: 30,
    fumigationCostPerZone: 8000,
    teamDeploymentCost: 1000,
  },
  setConstraints: (constraints) => set({ constraints }),

  debateState: {
    phase: 'idle',
    proposals: [],
    critiques: [],
    responses: [],
  },
  setDebatePhase: (phase) => set((state) => ({
    debateState: { ...state.debateState, phase },
  })),
  addProposal: (proposal) => set((state) => ({
    debateState: {
      ...state.debateState,
      proposals: [...state.debateState.proposals, proposal],
    },
  })),
  setConsensusPlan: (consensusPlan) => set((state) => ({
    debateState: { ...state.debateState, consensusPlan },
  })),

  simulationState: {
    currentDay: 0,
    zones: [],
    interventions: [],
    dailyMetrics: [],
    isRunning: false,
    speed: 1,
  },
  setSimulationRunning: (isRunning) => set((state) => ({
    simulationState: { ...state.simulationState, isRunning },
  })),
  setSimulationSpeed: (speed) => set((state) => ({
    simulationState: { ...state.simulationState, speed },
  })),
  advanceSimulation: () => {
    // Call simulation engine tick
    // Update zones and metrics
  },

  mapState: {
    highlightedZones: [],
    viewState: {
      latitude: 14.5995, // Manila
      longitude: 120.9842,
      zoom: 11,
    },
    layersVisible: {
      heatmap: true,
      zones: true,
      interventions: true,
      infections: true,
    },
  },
  setSelectedZone: (selectedZone) => set((state) => ({
    mapState: { ...state.mapState, selectedZone },
  })),
  setHighlightedZones: (highlightedZones) => set((state) => ({
    mapState: { ...state.mapState, highlightedZones },
  })),
}));
```

---

## UI/UX Design Patterns

### Agent Debate Display

```typescript
// Show agents arguing with visual indicators

<div className="grid grid-cols-2 gap-4">
  {proposals.map((proposal) => (
    <AgentCard
      key={proposal.agent}
      agent={proposal.agent}
      proposal={proposal}
      isStreaming={streamingAgent === proposal.agent}
      hasDisagreement={
        critiques.some(c => c.targetAgent === proposal.agent)
      }
    />
  ))}
</div>

// AgentCard with disagreement border
<div className={cn(
  "border-2 rounded-lg p-4",
  hasDisagreement && "border-red-500 border-dashed"
)}>
  <div className="flex items-center gap-2">
    <AgentIcon type={agent} />
    <span className="font-bold">{AGENT_NAMES[agent]}</span>
  </div>

  {isStreaming && <TypewriterText text={proposal.reasoning} />}

  <div className="mt-4">
    <h4>Recommended Zones:</h4>
    <ZoneBadges zoneIds={proposal.recommendedZones} />
  </div>
</div>
```

### Simulation Playback Controls

```typescript
<div className="flex items-center gap-4">
  <Button
    onClick={() => togglePlay()}
    disabled={simulationState.currentDay >= 7}
  >
    {isRunning ? <PauseIcon /> : <PlayIcon />}
  </Button>

  <span className="text-lg font-mono">
    Day {simulationState.currentDay} / 7
  </span>

  <select
    value={speed}
    onChange={(e) => setSpeed(Number(e.target.value))}
  >
    <option value="1">1x</option>
    <option value="2">2x</option>
    <option value="5">5x</option>
  </select>

  <ProgressBar
    value={simulationState.currentDay}
    max={7}
  />
</div>
```

---

## Performance Optimization

### Prompt Caching Strategy

```typescript
// Cache zone data across all 4 agents (reused 4 times)
const zoneDataBlock = {
  type: "text",
  text: JSON.stringify(zones),
  cache_control: { type: "ephemeral" } // Cache for 5 minutes
};

// Result: 4 agents × 75% token reduction = 3× cheaper
```

### Lazy Loading Map Layers

```typescript
// Only render visible zones
const visibleZones = zones.filter(zone => {
  const bounds = map.getBounds();
  return bounds.contains(zone.centroid);
});
```

### Debounced State Updates

```typescript
// Don't re-render on every simulation tick
const debouncedZoneUpdate = useMemo(
  () => debounce((zones: Zone[]) => {
    updateMapLayers(zones);
  }, 100),
  []
);
```

---

## Error Handling

### API Error Recovery

```typescript
async function callAgentWithRetry(
  agentType: AgentType,
  context: any,
  maxRetries = 3
): Promise<AgentProposal> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await callAgent(agentType, context);
      return JSON.parse(response.content[0].text);
    } catch (error) {
      if (attempt === maxRetries - 1) {
        // Final attempt failed, use fallback
        console.error(`Agent ${agentType} failed after ${maxRetries} attempts`);
        return FALLBACK_PROPOSALS[agentType];
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
}
```

### Fallback Responses for Demo

```typescript
// Pre-generated responses if API fails during demo
const FALLBACK_PROPOSALS: Record<AgentType, AgentProposal> = {
  epidemiologist: {
    agent: 'epidemiologist',
    recommendedZones: [1, 5, 7, 12],
    reasoning: "Zones 1, 5, 7, and 12 have the highest infection risk...",
    // ...
  },
  // ...other agents
};
```

---

## Deployment Configuration

### Vercel Environment Setup

```bash
# .env.production
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
NEXT_PUBLIC_API_BASE_URL=https://mosquit.vercel.app
```

### Next.js Config

```typescript
// next.config.js
module.exports = {
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },

  // Optimize for demo
  experimental: {
    optimizeCss: true,
  },

  // Reduce bundle size
  swcMinify: true,
};
```

---

**This context document should provide all technical details needed for implementation. Refer to CLAUDE.md for high-level guidance and this document for specific implementation patterns.**
