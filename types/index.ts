// ============================================================================
// ZONE TYPES
// ============================================================================

export interface Zone {
  id: number;
  name: string;
  geometry: GeoJSON.Polygon;
  centroid: [number, number]; // [lng, lat]

  // Population data
  population: number;
  populationDensity: number; // people per km²

  // Risk factors (0-1 range)
  baseRisk: number;
  environmentalFactors: {
    temperature: number; // Celsius
    humidity: number; // 0-1
    vegetation: number; // 0-1
    waterProximity: number; // 0-1
  };

  // Disease state (SIR model)
  susceptible: number;
  infected: number;
  recovered: number;

  // Interventions applied to this zone
  interventions: Intervention[];

  // Adjacency
  adjacentZoneIds: number[];

  // Metadata
  landUse: 'residential' | 'commercial' | 'industrial' | 'mixed';
  hasSensitiveLocation: boolean;
}

export interface Intervention {
  type: 'fumigation' | 'education' | 'cleanup';
  appliedOnDay: number;
  effectiveDays: number;
  effectivenessReduction: number; // 0-1
  cost: number;
  teamId?: number;
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
  color: string;
  icon: string;
}

export interface AgentProposal {
  agent: AgentType;
  recommendedZones: number[];
  teamAllocation: TeamAllocation[];
  reasoning: string;
  concerns: string[];
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
  day: number;
  travelTime: number;
}

export interface AgentCritique {
  agent: AgentType;
  targetAgent: AgentType;
  agreementPoints: string[];
  disagreementPoints: string[];
  alternativeSuggestions: string[];
}

export interface AgentResponse {
  agent: AgentType;
  respondingTo: AgentType[];
  revisedProposal?: AgentProposal;
  defenseOfPosition: string;
  compromises: string[];
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
    fullySupported: AgentType[];
    partiallySupported: AgentType[];
    keyDisagreements: string[];
  };

  expectedOutcome: {
    estimatedInfections: number;
    totalCost: number;
    zonesProtected: number;
    riskRemaining: number;
  };

  sensitivity: {
    ifBudgetCut: string;
    ifDelayed: string;
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
  speed: 1 | 2 | 5;
}

export interface DayMetrics {
  day: number;
  totalSusceptible: number;
  totalInfected: number;
  totalRecovered: number;
  newInfections: number;
  cumulativeInfections: number;
  interventionsApplied: Intervention[];
  costSpent: number;
  narrative: string;
}

export interface SimulationParameters {
  baseTransmissionRate: number; // 0-1 per day
  recoveryRate: number; // 0-1 per day
  incubationPeriod: number; // Days

  fumigationEffectiveness: number; // 0-1
  fumigationDuration: number; // Days
  fumigationCostPerZone: number;

  adjacentZoneSpreadMultiplier: number;
  densitySpreadMultiplier: number;

  randomSeed?: number;
  randomVariance: number; // 0-1
}

// ============================================================================
// CONSTRAINTS & RESOURCES
// ============================================================================

export interface ResourceConstraints {
  availableTeams: number;
  budgetTotal: number;
  timeWindow: number; // Days

  teamCapacity: number;
  teamSpeed: number; // km/hour

  fumigationCostPerZone: number;
  teamDeploymentCost: number;
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
  streamingAgent?: AgentType;
  streamingText?: string;
}

export interface MapState {
  selectedZone?: number;
  hoveredZone?: number;
  highlightedZones: number[];

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
  thinkingTraces?: Record<AgentType, string>;
  metadata: {
    totalTokens: number;
    cachedTokens: number;
    durationMs: number;
  };
}
