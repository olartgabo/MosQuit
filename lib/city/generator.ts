import { Zone } from '@/types';

// Manila city center coordinates
const MANILA_CENTER: [number, number] = [120.9842, 14.5995];

// Zone names based on real Manila districts/areas
const ZONE_NAMES = [
  'Ermita', 'Malate', 'Intramuros', 'Binondo', 'Quiapo',
  'Sampaloc', 'San Miguel', 'Santa Cruz', 'Tondo', 'Pandacan',
  'San Andres', 'Paco', 'Santa Ana', 'Mandaluyong', 'San Juan',
  'Makati Central', 'Poblacion', 'Guadalupe', 'Pasig', 'Marikina'
];

/**
 * Generate a grid of zones covering Manila metro area
 */
export function generateMockCity(numZones: number = 20): Zone[] {
  const zones: Zone[] = [];

  // Create a rough grid pattern
  const gridSize = Math.ceil(Math.sqrt(numZones));
  const spacingLng = 0.04; // ~4km
  const spacingLat = 0.03; // ~3km

  let zoneId = 1;

  for (let i = 0; i < gridSize && zoneId <= numZones; i++) {
    for (let j = 0; j < gridSize && zoneId <= numZones; j++) {
      const centerLng = MANILA_CENTER[0] + (i - gridSize / 2) * spacingLng;
      const centerLat = MANILA_CENTER[1] + (j - gridSize / 2) * spacingLat;

      zones.push(createZone(zoneId, centerLng, centerLat));
      zoneId++;
    }
  }

  // Calculate adjacencies
  calculateAdjacencies(zones);

  return zones;
}

/**
 * Create a single zone with mock data
 */
function createZone(id: number, centerLng: number, centerLat: number): Zone {
  const zoneSize = 0.015; // ~1.5km square

  // Create polygon geometry (square zone)
  const geometry: GeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [[
      [centerLng - zoneSize, centerLat - zoneSize],
      [centerLng + zoneSize, centerLat - zoneSize],
      [centerLng + zoneSize, centerLat + zoneSize],
      [centerLng - zoneSize, centerLat + zoneSize],
      [centerLng - zoneSize, centerLat - zoneSize], // Close the polygon
    ]]
  };

  // Random but seeded on zone ID for consistency
  const rng = seededRandom(id);

  // Population (5,000 to 50,000 per zone)
  const population = Math.floor(5000 + rng() * 45000);
  const area = 2.25; // ~2.25 km² per zone
  const populationDensity = population / area;

  // Environmental factors (tropical climate)
  const temperature = 28 + rng() * 5; // 28-33°C
  const humidity = 0.6 + rng() * 0.3; // 60-90%
  const vegetation = rng(); // 0-1
  const waterProximity = rng(); // 0-1

  // Calculate base risk from environmental factors
  const baseRisk = calculateBaseRisk(temperature, humidity, vegetation, waterProximity);

  // Initial disease state (SIR model)
  // Start with 0-5 infected in some zones
  const initialInfected = rng() < 0.3 ? Math.floor(rng() * 5) : 0;
  const susceptible = population - initialInfected;

  // Land use type
  const landUseOptions: Zone['landUse'][] = ['residential', 'commercial', 'industrial', 'mixed'];
  const landUse = landUseOptions[Math.floor(rng() * landUseOptions.length)];

  // Sensitive locations (schools, hospitals)
  const hasSensitiveLocation = rng() < 0.4; // 40% of zones have sensitive locations

  return {
    id,
    name: ZONE_NAMES[id - 1] || `Zone ${id}`,
    geometry,
    centroid: [centerLng, centerLat],

    population,
    populationDensity,

    baseRisk,
    environmentalFactors: {
      temperature,
      humidity,
      vegetation,
      waterProximity,
    },

    susceptible,
    infected: initialInfected,
    recovered: 0,

    interventions: [],
    adjacentZoneIds: [],

    landUse,
    hasSensitiveLocation,
  };
}

/**
 * Calculate base risk score from environmental factors
 */
function calculateBaseRisk(
  temperature: number,
  humidity: number,
  vegetation: number,
  waterProximity: number
): number {
  // Optimal temperature for dengue mosquitoes: 25-30°C
  const tempScore = temperature >= 25 && temperature <= 30 ? 1 : 0.5;

  // High humidity is conducive to mosquitoes
  const humidityScore = humidity;

  // Vegetation and water proximity increase breeding sites
  const envScore = (vegetation * 0.5 + waterProximity * 0.5);

  // Weighted combination
  const risk = (tempScore * 0.3) + (humidityScore * 0.4) + (envScore * 0.3);

  // Normalize to 0-1
  return Math.min(1, Math.max(0, risk));
}

/**
 * Calculate which zones are adjacent (within ~3km of each other)
 */
function calculateAdjacencies(zones: Zone[]): void {
  const MAX_DISTANCE = 0.045; // ~4-5km in degrees

  for (const zone of zones) {
    const neighbors: number[] = [];

    for (const other of zones) {
      if (zone.id === other.id) continue;

      const distance = calculateDistance(
        zone.centroid[0], zone.centroid[1],
        other.centroid[0], other.centroid[1]
      );

      if (distance < MAX_DISTANCE) {
        neighbors.push(other.id);
      }
    }

    zone.adjacentZoneIds = neighbors;
  }
}

/**
 * Calculate distance between two points (simple Euclidean)
 */
function calculateDistance(lng1: number, lat1: number, lng2: number, lat2: number): number {
  return Math.sqrt((lng2 - lng1) ** 2 + (lat2 - lat1) ** 2);
}

/**
 * Seeded random number generator for consistency
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Get GeoJSON feature collection from zones (for map rendering)
 */
export function zonesToGeoJSON(zones: Zone[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: zones.map(zone => ({
      type: 'Feature',
      id: zone.id,
      geometry: zone.geometry,
      properties: {
        id: zone.id,
        name: zone.name,
        population: zone.population,
        baseRisk: zone.baseRisk,
        infected: zone.infected,
        susceptible: zone.susceptible,
        recovered: zone.recovered,
        landUse: zone.landUse,
        hasSensitiveLocation: zone.hasSensitiveLocation,
      },
    })),
  };
}

/**
 * Get initial simulation parameters
 */
export function getDefaultSimulationParameters() {
  return {
    baseTransmissionRate: 0.15, // 15% chance per day
    recoveryRate: 0.14, // ~7 day recovery
    incubationPeriod: 3,

    fumigationEffectiveness: 0.7, // 70% reduction
    fumigationDuration: 3, // 3 days effective
    fumigationCostPerZone: 8000,

    adjacentZoneSpreadMultiplier: 1.5,
    densitySpreadMultiplier: 0.00001,

    randomVariance: 0.1,
  };
}

/**
 * Get default resource constraints
 */
export function getDefaultConstraints() {
  return {
    availableTeams: 4,
    budgetTotal: 30000,
    timeWindow: 48, // hours

    teamCapacity: 1,
    teamSpeed: 30, // km/h

    fumigationCostPerZone: 8000,
    teamDeploymentCost: 1000,
  };
}
