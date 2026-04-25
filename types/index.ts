// ============================================================================
// EXTENDED ENVIRONMENTAL & SCAN TYPES
// ============================================================================

export type WetlandClass = 'open_water' | 'marsh_wetland' | 'moist_vegetation' | 'dry_land';

export interface ExtendedEnvironmentalData {
  // Weather — Open-Meteo 14-day
  temperature_mean_c: number;
  humidity_mean_pct: number;
  soil_moisture_mean: number;        // m³/m³
  precipitation_14d_mm: number;
  precipitation_48h_mm: number;      // last 2 daily values summed
  windspeed_max_kmh: number;         // representative peak from last 7 days

  // Satellite — Sentinel-2
  ndwi: number;                      // -1 to 1
  ndvi: number;                      // -1 to 1
  elevation_m: number;

  // Derived
  wetlandClass: WetlandClass;
  incubationDays: number;            // 7–14, Aedes aegypti egg→adult cycle
  breteauIndex: number;              // 0–100 approximated
  breteauLevel: 'low' | 'moderate' | 'high';
  estimatedActiveCases: number;      // climate-correlation estimate
  estimatedHistoricalCases: number;  // risk-weighted cumulative estimate
  flightRadius_m: number;            // 50–400 Aedes aegypti effective range
  compositeBreedingScore: number;    // 0–1

  dataSource: 'satellite' | 'fallback';
  fetchedAt: string;
}

export interface WetlandPoint {
  id: string;
  centroid: [number, number];        // [lng, lat]
  ndwi: number;
  flightRadius_m: number;
  zoneId: number;
  zoneName: string;
}

// 5 thematic map categories — each encodes one representative metric
export type DataLayer =
  | 'infection'        // baseRisk + infected count
  | 'water_humidity'   // NDWI + wetland class coloring
  | 'vegetation'       // NDVI green gradient
  | 'biological_risk'  // Breteau Index
  | 'climate';         // temperature

export type ScanPhase =
  | 'idle'
  | 'searching'
  | 'fetching_boundaries'
  | 'enriching'
  | 'complete'
  | 'error';

export interface ScanProgress {
  phase: ScanPhase;
  message: string;
  zonesFound: number;
  zonesEnriched: number;
  totalZones: number;
  errorMessage?: string;
}

export interface ScannedCity {
  name: string;
  countryCode: string;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  center: [number, number];
  zones: Zone[];
  wetlandPoints: WetlandPoint[];
  scannedAt: string;
}

export interface GeocodeSuggestion {
  placeName: string;                  // full formatted string, e.g. "Paris, Île-de-France, France"
  mainText: string;                   // bolded primary label, e.g. "Paris"
  secondaryText: string;              // muted context, e.g. "Île-de-France, France"
  placeType: string;                  // mapbox feature type, e.g. "place"
  center: [number, number];           // [lng, lat]
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

// ============================================================================
// BREEDING INTELLIGENCE TYPES
// ============================================================================

export interface BreedingRiskScore {
  ndwi: number;                   // -1 to 1 (>0.2 = standing water likely)
  ndvi: number;                   // -1 to 1 (>0.4 = dense vegetation)
  recentRainfall_mm: number;      // accumulated mm over last 14 days
  elevation_m: number;            // meters above sea level (low = flood prone)
  compositeBreedingScore: number; // 0-1 final score
  dataSource: 'satellite' | 'fallback';
  fetchedAt: string;              // ISO timestamp
}

export interface EnvironmentalAssessment {
  highRiskBreedingZones: number[];
  reasoning: string;
  sourceReductionTargets: Array<{
    zoneId: number;
    primaryIndicator: string;
    value: number;
    urgency: 'immediate' | 'planned';
  }>;
  predictedBreedingHotspots: number[];
  recommendedActions: string[];
  confidence: number;
}

export interface BreedingIntelligenceRequest {
  zones: Pick<Zone, 'id' | 'centroid' | 'geometry'>[];
  dateRange?: { from: string; to: string };
}

export interface BreedingIntelligenceResponse {
  enrichedZones: Array<{ zoneId: number; breedingRisk: BreedingRiskScore }>;
  metadata: {
    dataSource: 'satellite' | 'partial' | 'fallback';
    sceneDates: Record<number, string>;
    durationMs: number;
    cached: boolean;
  };
}

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

  // Satellite-derived breeding risk (optional — populated by /api/intelligence/breeding)
  breedingRisk?: BreedingRiskScore;

  // Extended environmental data (optional — populated by /api/city/scan enrichment)
  extendedData?: ExtendedEnvironmentalData;

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
  | 'public_risk'
  | 'environmental_monitor';

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
  phase: 'idle' | 'intelligence' | 'proposing' | 'critiquing' | 'responding' | 'consensus' | 'complete';
  environmentalAssessment?: EnvironmentalAssessment;
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
