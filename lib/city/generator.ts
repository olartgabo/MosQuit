import { Zone } from '@/types';

// Real Manila metro district definitions: centroid [lng, lat], zone size in degrees, and environmental biases
const ZONE_DEFINITIONS: Array<{
  name: string;
  centroid: [number, number];
  size: number;
  waterBias: number;   // 0-1 added to waterProximity (coastal/riverine zones score higher)
  vegBias: number;     // 0-1 added to vegetation
  population: number;
  landUse: Zone['landUse'];
  hasSensitiveLocation: boolean;
}> = [
  // ─── Manila proper ───────────────────────────────────────────────────────────
  { name: 'Tondo',        centroid: [120.968, 14.622], size: 0.022, waterBias: 0.65, vegBias: 0.05, population: 72000, landUse: 'residential', hasSensitiveLocation: true  },
  { name: 'Binondo',      centroid: [120.972, 14.600], size: 0.011, waterBias: 0.45, vegBias: 0.05, population: 25000, landUse: 'commercial',  hasSensitiveLocation: false },
  { name: 'Intramuros',   centroid: [120.975, 14.591], size: 0.009, waterBias: 0.55, vegBias: 0.15, population: 6000,  landUse: 'mixed',       hasSensitiveLocation: true  },
  { name: 'Quiapo',       centroid: [120.984, 14.595], size: 0.010, waterBias: 0.15, vegBias: 0.10, population: 24000, landUse: 'commercial',  hasSensitiveLocation: true  },
  { name: 'San Miguel',   centroid: [120.993, 14.599], size: 0.008, waterBias: 0.25, vegBias: 0.20, population: 15000, landUse: 'residential', hasSensitiveLocation: true  },
  { name: 'Santa Cruz',   centroid: [120.986, 14.607], size: 0.013, waterBias: 0.15, vegBias: 0.10, population: 44000, landUse: 'mixed',       hasSensitiveLocation: false },
  { name: 'Sampaloc',     centroid: [121.002, 14.617], size: 0.018, waterBias: 0.10, vegBias: 0.20, population: 80000, landUse: 'residential', hasSensitiveLocation: true  },
  { name: 'Ermita',       centroid: [120.984, 14.578], size: 0.011, waterBias: 0.40, vegBias: 0.15, population: 20000, landUse: 'mixed',       hasSensitiveLocation: false },
  { name: 'Malate',       centroid: [120.985, 14.568], size: 0.012, waterBias: 0.35, vegBias: 0.15, population: 30000, landUse: 'residential', hasSensitiveLocation: true  },
  { name: 'Paco',         centroid: [121.001, 14.573], size: 0.012, waterBias: 0.20, vegBias: 0.20, population: 35000, landUse: 'residential', hasSensitiveLocation: false },
  { name: 'Pandacan',     centroid: [121.007, 14.586], size: 0.011, waterBias: 0.40, vegBias: 0.10, population: 28000, landUse: 'industrial',  hasSensitiveLocation: false },
  { name: 'San Andres',   centroid: [121.002, 14.563], size: 0.011, waterBias: 0.10, vegBias: 0.15, population: 32000, landUse: 'residential', hasSensitiveLocation: false },
  { name: 'Santa Ana',    centroid: [121.012, 14.578], size: 0.012, waterBias: 0.30, vegBias: 0.20, population: 30000, landUse: 'mixed',       hasSensitiveLocation: false },
  // ─── NCR neighboring cities ──────────────────────────────────────────────────
  { name: 'Mandaluyong',  centroid: [121.033, 14.580], size: 0.013, waterBias: 0.20, vegBias: 0.15, population: 45000, landUse: 'mixed',       hasSensitiveLocation: false },
  { name: 'San Juan',     centroid: [121.038, 14.601], size: 0.014, waterBias: 0.15, vegBias: 0.20, population: 35000, landUse: 'residential', hasSensitiveLocation: true  },
  { name: 'Makati Central', centroid: [121.020, 14.553], size: 0.013, waterBias: 0.10, vegBias: 0.10, population: 40000, landUse: 'commercial', hasSensitiveLocation: false },
  { name: 'Poblacion',    centroid: [121.034, 14.563], size: 0.009, waterBias: 0.10, vegBias: 0.15, population: 18000, landUse: 'mixed',       hasSensitiveLocation: false },
  { name: 'Guadalupe',    centroid: [121.046, 14.568], size: 0.012, waterBias: 0.35, vegBias: 0.25, population: 30000, landUse: 'residential', hasSensitiveLocation: false },
  { name: 'Pasig',        centroid: [121.069, 14.572], size: 0.018, waterBias: 0.55, vegBias: 0.30, population: 50000, landUse: 'mixed',       hasSensitiveLocation: true  },
  { name: 'Marikina',     centroid: [121.103, 14.623], size: 0.020, waterBias: 0.65, vegBias: 0.40, population: 45000, landUse: 'residential', hasSensitiveLocation: true  },
];

// ─── Polygon generation ──────────────────────────────────────────────────────

function createDistrictPolygon(
  centerLng: number,
  centerLat: number,
  size: number,
  seed: number
): GeoJSON.Polygon {
  const rng = seededRandom(seed * 17 + 31);
  // 7-9 vertices makes a convincingly organic district shape
  const numSides = 7 + Math.floor(rng() * 3);
  const vertices: [number, number][] = [];

  for (let i = 0; i < numSides; i++) {
    const baseAngle = (2 * Math.PI * i) / numSides;
    // Angular jitter up to ±30% of one segment
    const jitter = (rng() - 0.5) * (2 * Math.PI / numSides) * 0.55;
    const angle = baseAngle + jitter;
    // Radius varies 60-140% of base size for organic boundary feel
    const r = size * (0.60 + rng() * 0.80);

    vertices.push([centerLng + r * Math.cos(angle), centerLat + r * Math.sin(angle)]);
  }

  vertices.push(vertices[0]); // close the ring
  return { type: 'Polygon', coordinates: [vertices] };
}

// ─── Main generator ──────────────────────────────────────────────────────────

export function generateMockCity(numZones: number = 20): Zone[] {
  const defs = ZONE_DEFINITIONS.slice(0, numZones);
  const zones: Zone[] = defs.map((def, idx) => {
    const id = idx + 1;
    const rng = seededRandom(id);
    const [centerLng, centerLat] = def.centroid;

    const geometry = createDistrictPolygon(centerLng, centerLat, def.size, id);

    // Environmental factors — tropical climate, biased by district geography
    const temperature = 28 + rng() * 5;
    const humidity = 0.60 + rng() * 0.30;
    const vegetation = Math.min(1, def.vegBias + rng() * (1 - def.vegBias));
    const waterProximity = Math.min(1, def.waterBias + rng() * (1 - def.waterBias) * 0.5);

    const baseRisk = calculateBaseRisk(temperature, humidity, vegetation, waterProximity);

    // Start with a few seeded initial infections so the map is alive
    const initialInfected = rng() < 0.35 ? Math.floor(1 + rng() * 5) : 0;

    const areaKm2 = Math.PI * (def.size * 111) ** 2; // rough circle area estimate
    const populationDensity = def.population / Math.max(1, areaKm2);

    return {
      id,
      name: def.name,
      geometry,
      centroid: def.centroid,

      population: def.population,
      populationDensity,

      baseRisk,
      environmentalFactors: { temperature, humidity, vegetation, waterProximity },

      susceptible: def.population - initialInfected,
      infected: initialInfected,
      recovered: 0,

      interventions: [],
      adjacentZoneIds: [],

      landUse: def.landUse,
      hasSensitiveLocation: def.hasSensitiveLocation,
    };
  });

  calculateAdjacencies(zones);
  return zones;
}

// ─── Risk & adjacency helpers ────────────────────────────────────────────────

function calculateBaseRisk(
  temperature: number,
  humidity: number,
  vegetation: number,
  waterProximity: number
): number {
  const tempScore = temperature >= 25 && temperature <= 30 ? 1 : 0.5;
  const humidityScore = humidity;
  const envScore = vegetation * 0.5 + waterProximity * 0.5;
  return Math.min(1, Math.max(0, tempScore * 0.3 + humidityScore * 0.4 + envScore * 0.3));
}

function calculateAdjacencies(zones: Zone[]): void {
  // Adaptive threshold — tighter for dense inner-city, looser for outer suburbs
  for (const zone of zones) {
    const neighbors: number[] = [];
    for (const other of zones) {
      if (zone.id === other.id) continue;
      const d = calculateDistance(zone.centroid[0], zone.centroid[1], other.centroid[0], other.centroid[1]);
      // Use the sum of both zone sizes as adjacency radius (they overlap if close enough)
      const def = ZONE_DEFINITIONS[zone.id - 1];
      const otherDef = ZONE_DEFINITIONS[other.id - 1];
      const threshold = (def?.size ?? 0.015) + (otherDef?.size ?? 0.015) + 0.005;
      if (d < threshold) neighbors.push(other.id);
    }
    zone.adjacentZoneIds = neighbors;
  }
}

function calculateDistance(lng1: number, lat1: number, lng2: number, lat2: number): number {
  return Math.sqrt((lng2 - lng1) ** 2 + (lat2 - lat1) ** 2);
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

// ─── GeoJSON export ──────────────────────────────────────────────────────────

export function zonesToGeoJSON(zones: Zone[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: zones.map((zone) => {
      const ed = zone.extendedData;
      const br = zone.breedingRisk;
      return {
        type: 'Feature',
        id: zone.id,
        geometry: zone.geometry,
        properties: {
          // Core
          id: zone.id,
          name: zone.name,
          population: zone.population,
          baseRisk: zone.baseRisk,
          infected: zone.infected,
          susceptible: zone.susceptible,
          recovered: zone.recovered,
          landUse: zone.landUse,
          hasSensitiveLocation: zone.hasSensitiveLocation,
          // Breeding (legacy)
          breedingScore: ed?.compositeBreedingScore ?? br?.compositeBreedingScore ?? 0,
          breedingDataSource: ed?.dataSource ?? br?.dataSource ?? 'none',
          // Extended data layers (null when not yet enriched)
          extTemp: ed?.temperature_mean_c ?? zone.environmentalFactors.temperature,
          extHumidity: ed?.humidity_mean_pct ?? zone.environmentalFactors.humidity * 100,
          extSoilMoisture: ed?.soil_moisture_mean ?? null,
          extPrecipitation: ed?.precipitation_14d_mm ?? br?.recentRainfall_mm ?? 0,
          ndwi: ed?.ndwi ?? br?.ndwi ?? 0,
          ndvi: ed?.ndvi ?? br?.ndvi ?? 0,
          wetlandClass: ed?.wetlandClass ?? 'dry_land',
          breteauIndex: ed?.breteauIndex ?? 0,
          dengueRisk: ed
            ? (() => {
                const ts = ed.temperature_mean_c >= 25 && ed.temperature_mean_c <= 35 ? 1 : ed.temperature_mean_c >= 20 ? 0.6 : 0.2;
                const hs = Math.min(1, Math.max(0, (ed.humidity_mean_pct - 40) / 50));
                const ws = Math.min(1, Math.max(0, (ed.ndwi + 0.3) / 0.9));
                return ts * 0.35 + hs * 0.35 + ws * 0.30;
              })()
            : 0,
          flightRadius: ed?.flightRadius_m ?? 50,
        },
      };
    }),
  };
}

// ─── Default parameters ──────────────────────────────────────────────────────

export function getDefaultSimulationParameters() {
  return {
    baseTransmissionRate: 0.15,
    recoveryRate: 0.14,
    incubationPeriod: 3,
    fumigationEffectiveness: 0.7,
    fumigationDuration: 3,
    fumigationCostPerZone: 8000,
    adjacentZoneSpreadMultiplier: 1.5,
    densitySpreadMultiplier: 0.00001,
    randomVariance: 0.1,
  };
}

export function getDefaultConstraints() {
  return {
    availableTeams: 4,
    budgetTotal: 30000,
    timeWindow: 48,
    teamCapacity: 1,
    teamSpeed: 30,
    fumigationCostPerZone: 8000,
    teamDeploymentCost: 1000,
  };
}
