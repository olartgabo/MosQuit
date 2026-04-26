import { stepDay, applyInterventions, runSimulation } from './engine';
import { Zone, SimulationParameters } from '@/types';

const mockParams: SimulationParameters = {
  baseTransmissionRate: 0.5,
  recoveryRate: 0.05,
  incubationPeriod: 3,
  fumigationEffectiveness: 0.8,
  fumigationDuration: 3,
  fumigationCostPerZone: 1000,
  adjacentZoneSpreadMultiplier: 1.2,
  densitySpreadMultiplier: 0.0001,
  randomVariance: 0, // Disable variance for deterministic tests
};

const createMockZone = (id: number, infected: number = 0, susceptible: number = 1000): Zone => ({
  id,
  name: `Zone ${id}`,
  geometry: { type: 'Polygon', coordinates: [] },
  centroid: [0, 0],
  population: susceptible + infected,
  populationDensity: (susceptible + infected) / 1,
  baseRisk: 0.5,
  environmentalFactors: { temperature: 28, humidity: 0.7, vegetation: 0.5, waterProximity: 0.5 },
  susceptible,
  infected,
  recovered: 0,
  interventions: [],
  adjacentZoneIds: [],
  landUse: 'residential',
  hasSensitiveLocation: false,
});

describe('Simulation Engine', () => {
  describe('stepDay', () => {
    it('should increase infections in a zone with existing infections', () => {
      const zones = [createMockZone(1, 10, 990)];
      const { zones: nextZones, metrics } = stepDay(zones, 1, mockParams, () => 0.5);
      
      expect(nextZones[0].infected).toBeGreaterThan(10);
      expect(nextZones[0].susceptible).toBeLessThan(990);
      expect(metrics.newInfections).toBeGreaterThan(0);
    });

    it('should spread infections to adjacent zones', () => {
      const zone1 = createMockZone(1, 100, 900);
      const zone2 = createMockZone(2, 0, 1000);
      zone1.adjacentZoneIds = [2];
      zone2.adjacentZoneIds = [1];
      
      const { zones: nextZones } = stepDay([zone1, zone2], 1, mockParams, () => 0.5);
      
      expect(nextZones[1].infected).toBeGreaterThan(0);
      expect(nextZones[1].susceptible).toBeLessThan(1000);
    });

    it('should respect recovery rate', () => {
      const zones = [createMockZone(1, 100, 0)]; // No susceptible left
      const { zones: nextZones } = stepDay(zones, 1, mockParams, () => 0.5);
      
      // With recovery rate 0.05, exactly 5 people should recover (100 * 0.05)
      expect(nextZones[0].recovered).toBe(5);
      expect(nextZones[0].infected).toBe(95);
    });
  });

  describe('applyInterventions', () => {
    it('should add fumigation intervention to selected zones', () => {
      const zones = [createMockZone(1), createMockZone(2)];
      const { zones: nextZones, cost, interventions } = applyInterventions(zones, [1], 0, mockParams);
      
      expect(nextZones[0].interventions).toHaveLength(1);
      expect(nextZones[0].interventions[0].type).toBe('fumigation');
      expect(nextZones[1].interventions).toHaveLength(0);
      expect(cost).toBe(mockParams.fumigationCostPerZone);
      expect(interventions).toHaveLength(1);
    });
  });

  describe('Intervention Effect', () => {
    it('should reduce infection spread in fumigated zones', () => {
      const paramsWithHighEffect = { ...mockParams, fumigationEffectiveness: 0.9 };
      
      const zonesNormal = [createMockZone(1, 10, 990)];
      const zonesFumigated = [createMockZone(1, 10, 990)];
      zonesFumigated[0].interventions.push({
        type: 'fumigation',
        appliedOnDay: 0,
        effectiveDays: 3,
        effectivenessReduction: 0.9,
        cost: 1000,
      });

      const resNormal = stepDay(zonesNormal, 1, paramsWithHighEffect, () => 0.5);
      const resFumigated = stepDay(zonesFumigated, 1, paramsWithHighEffect, () => 0.5);

      const newInfNormal = resNormal.metrics.newInfections;
      const newInfFumigated = resFumigated.metrics.newInfections;

      expect(newInfFumigated).toBeLessThan(newInfNormal);
    });
  });

  describe('runSimulation', () => {
    it('should run for the specified number of days', () => {
      const zones = [createMockZone(1, 10, 990)];
      const snapshots = runSimulation(zones, mockParams, [1], 5);
      
      expect(snapshots).toHaveLength(6); // Day 0 to Day 5
      expect(snapshots[0].day).toBe(0);
      expect(snapshots[5].day).toBe(5);
    });
  });
});
