import type { DataLayer } from '@/types';

export interface DataLayerMeta {
  id: DataLayer;
  label: string;
  unit: string;
  colorFrom: string;
  colorMid?: string;
  colorTo: string;
  domain: [number, number];
  description: string;
  legendTicks: Array<{ value: number; label: string }>;
}

export const DATA_LAYER_CONFIG: Record<DataLayer, DataLayerMeta> = {
  infection: {
    id: 'infection',
    label: 'Infección',
    unit: '%',
    colorFrom: '#22c55e',
    colorMid: '#f97316',
    colorTo: '#ef4444',
    domain: [0, 1],
    description: 'Riesgo base de infección por zona',
    legendTicks: [
      { value: 0, label: '0%' },
      { value: 0.5, label: '50%' },
      { value: 1, label: '100%' },
    ],
  },
  water_humidity: {
    id: 'water_humidity',
    label: 'Agua / Humedad',
    unit: 'NDWI',
    colorFrom: '#92400e',
    colorMid: '#fef3c7',
    colorTo: '#06b6d4',
    domain: [-0.5, 0.5],
    description: 'Índice de agua normalizado (NDWI) y tipo de humedal',
    legendTicks: [
      { value: -0.5, label: 'Seco' },
      { value: 0, label: 'Neutro' },
      { value: 0.5, label: 'Agua' },
    ],
  },
  vegetation: {
    id: 'vegetation',
    label: 'Vegetación',
    unit: 'NDVI',
    colorFrom: '#92400e',
    colorMid: '#d9f99d',
    colorTo: '#15803d',
    domain: [-0.3, 0.8],
    description: 'Índice de vegetación normalizado (NDVI)',
    legendTicks: [
      { value: -0.3, label: 'Árido' },
      { value: 0.3, label: 'Moderado' },
      { value: 0.8, label: 'Denso' },
    ],
  },
  biological_risk: {
    id: 'biological_risk',
    label: 'Riesgo Biológico',
    unit: 'IB',
    colorFrom: '#22c55e',
    colorMid: '#f97316',
    colorTo: '#991b1b',
    domain: [0, 100],
    description: 'Índice de Breteau aproximado (criaderos/100 casas)',
    legendTicks: [
      { value: 0, label: 'Bajo (<5)' },
      { value: 20, label: 'Mod (5-20)' },
      { value: 100, label: 'Alto (>20)' },
    ],
  },
  climate: {
    id: 'climate',
    label: 'Clima',
    unit: '°C',
    colorFrom: '#3b82f6',
    colorMid: '#fbbf24',
    colorTo: '#ef4444',
    domain: [20, 40],
    description: 'Temperatura media 14 días',
    legendTicks: [
      { value: 20, label: '20°C' },
      { value: 30, label: '30°C' },
      { value: 40, label: '40°C' },
    ],
  },
};
