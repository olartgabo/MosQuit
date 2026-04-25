'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { DataLayer, WetlandPoint, Zone } from '@/types';
import { zonesToGeoJSON } from '@/lib/city/generator';
import ZoneInfoPanel from './ZoneInfoPanel';

interface MapViewProps {
  zones: Zone[];
  highlightedZones: number[];
  selectedZone?: number;
  onZoneClick?: (zoneId: number) => void;
  activeDataLayer?: DataLayer;
  breedingHighlightZones?: number[];
  wetlandPoints?: WetlandPoint[];
  mapCenter?: [number, number];
  fitBbox?: [number, number, number, number] | null;
}

const MANILA_CENTER: [number, number] = [121.02, 14.59];

export default function MapView({
  zones,
  highlightedZones = [],
  onZoneClick,
  activeDataLayer = 'infection',
  breedingHighlightZones = [],
  wetlandPoints = [],
  mapCenter,
  fitBbox,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const styleReady = useRef(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Hover state managed inside MapView
  const [hoveredZoneId, setHoveredZoneId] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const hoveredZone = useMemo(
    () => (hoveredZoneId ? zones.find((z) => z.id === hoveredZoneId) ?? null : null),
    [zones, hoveredZoneId]
  );

  const wetlandZoneIds = useMemo(
    () => new Set(wetlandPoints.map((w) => w.zoneId)),
    [wetlandPoints]
  );

  // Capture container rect for panel positioning
  useEffect(() => {
    if (!mapContainer.current) return;
    const rect = mapContainer.current.getBoundingClientRect();
    setContainerRect(rect);
    const obs = new ResizeObserver(() => {
      setContainerRect(mapContainer.current?.getBoundingClientRect() ?? null);
    });
    obs.observe(mapContainer.current);
    return () => obs.disconnect();
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setMapError('NEXT_PUBLIC_MAPBOX_TOKEN not set');
      return;
    }

    mapboxgl.accessToken = token;

    try {
      const m = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: mapCenter ?? MANILA_CENTER,
        zoom: 10.5,
        pitch: 25,
        bearing: -5,
        attributionControl: false,
      });
      map.current = m;

      m.on('load', () => {
        styleReady.current = true;
        installLayers(m, zones, wetlandPoints);
        applyHighlights(m, highlightedZones);
        applyDataLayer(m, activeDataLayer);
        wireInteractions(m, onZoneClick, setHoveredZoneId);
      });
    } catch (e) {
      console.error(e);
      setMapError('Failed to initialize map');
    }

    return () => {
      map.current?.remove();
      map.current = null;
      styleReady.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to new city center when mapCenter changes
  useEffect(() => {
    const m = map.current;
    if (!m || !styleReady.current || !mapCenter) return;
    m.flyTo({ center: mapCenter, zoom: 11, duration: 2000 });
  }, [mapCenter]);

  // Frame the scan bbox as soon as it's set (before zones arrive), so the
  // user sees the area being scanned instead of being stranded on the old view.
  useEffect(() => {
    const m = map.current;
    if (!m || !styleReady.current || !fitBbox) return;
    const [minLng, minLat, maxLng, maxLat] = fitBbox;
    m.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 80, duration: 1500, maxZoom: 12 }
    );
  }, [fitBbox]);

  // Zone data updates
  useEffect(() => {
    const m = map.current;
    if (!m || !styleReady.current) return;
    updateSources(m, zones);
  }, [zones]);

  // Highlight changes
  useEffect(() => {
    const m = map.current;
    if (!m || !styleReady.current) return;
    applyHighlights(m, highlightedZones);
  }, [highlightedZones]);

  // Data layer changes
  useEffect(() => {
    const m = map.current;
    if (!m || !styleReady.current) return;
    applyDataLayer(m, activeDataLayer);
  }, [activeDataLayer]);

  // Breeding highlights
  useEffect(() => {
    const m = map.current;
    if (!m || !styleReady.current) return;
    applyBreedingHighlights(m, breedingHighlightZones);
  }, [breedingHighlightZones]);

  // Wetland points updates
  useEffect(() => {
    const m = map.current;
    if (!m || !styleReady.current) return;
    updateWetlandSource(m, wetlandPoints);
  }, [wetlandPoints]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = mapContainer.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/60">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2">Map Error</div>
          <div className="text-white/60 text-sm">{mapError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" onMouseMove={handleMouseMove}>
      <div ref={mapContainer} className="w-full h-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
      {hoveredZone && (
        <ZoneInfoPanel
          zone={hoveredZone}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
          containerRect={containerRect}
          wetlandZoneIds={wetlandZoneIds}
        />
      )}
    </div>
  );
}

// ─── Layer installation ───────────────────────────────────────────────────────

function installLayers(m: mapboxgl.Map, zones: Zone[], wetlandPoints: WetlandPoint[]) {
  const zoneGeo = zonesToGeoJSON(zones);
  const pointFC = zonesToPointFC(zones);
  const wetlandFC = wetlandPointsToFC(wetlandPoints);

  m.addSource('zones', { type: 'geojson', data: zoneGeo });
  m.addSource('zone-points', { type: 'geojson', data: pointFC });
  m.addSource('wetland-points', { type: 'geojson', data: wetlandFC });

  // Infection heatmap (shown in infection mode only)
  m.addLayer({
    id: 'risk-heatmap',
    type: 'heatmap',
    source: 'zone-points',
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'risk'], 0, 0, 1, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 9, 0.6, 15, 1.2],
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        0, 'rgba(0,0,0,0)',
        0.2, 'rgba(34,197,94,0.25)',
        0.45, 'rgba(234,179,8,0.45)',
        0.7, 'rgba(249,115,22,0.7)',
        1, 'rgba(239,68,68,0.95)',
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 9, 28, 15, 80],
      'heatmap-opacity': 0.55,
    },
  });

  // Main data fill — color driven by activeDataLayer
  m.addLayer({
    id: 'zones-fill',
    type: 'fill',
    source: 'zones',
    paint: {
      'fill-color': getColorExpression('infection'),
      'fill-opacity': 0.22,
    },
  });

  // Zone borders
  m.addLayer({
    id: 'zones-border',
    type: 'line',
    source: 'zones',
    paint: {
      'line-color': 'rgba(255,255,255,0.35)',
      'line-width': 1,
      'line-opacity': 0.6,
    },
  });

  // Infection glow (infection mode only)
  m.addLayer({
    id: 'infection-glow',
    type: 'circle',
    source: 'zone-points',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['get', 'infected'], 0, 0, 5, 10, 50, 22, 200, 36],
      'circle-color': '#ef4444',
      'circle-opacity': ['case', ['>', ['get', 'infected'], 0], 0.25, 0],
      'circle-blur': 0.8,
    },
  });

  m.addLayer({
    id: 'infection-core',
    type: 'circle',
    source: 'zone-points',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['get', 'infected'], 0, 0, 1, 2, 50, 5, 200, 8],
      'circle-color': '#fca5a5',
      'circle-opacity': ['case', ['>', ['get', 'infected'], 0], 1, 0],
      'circle-stroke-color': '#ef4444',
      'circle-stroke-width': 1,
    },
  });

  // Biological risk fill (extra layer for biological_risk mode)
  m.addLayer({
    id: 'breeding-fill',
    type: 'fill',
    source: 'zones',
    layout: { visibility: 'none' },
    paint: {
      'fill-color': ['interpolate', ['linear'], ['get', 'breedingScore'], 0, '#0d9488', 0.4, '#d97706', 1, '#b45309'],
      'fill-opacity': 0.3,
    },
  });

  // Wetland flight radius circles
  m.addLayer({
    id: 'wetland-radius',
    type: 'circle',
    source: 'wetland-points',
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        9, ['/', ['get', 'flightRadius_m'], 85],
        12, ['/', ['get', 'flightRadius_m'], 22],
        15, ['/', ['get', 'flightRadius_m'], 8],
      ],
      'circle-color': '#0891b2',
      'circle-opacity': 0.12,
      'circle-stroke-color': '#22d3ee',
      'circle-stroke-width': 1,
      'circle-stroke-opacity': 0.4,
    },
  });

  // Wetland hotspot core dots
  m.addLayer({
    id: 'wetland-hotspot',
    type: 'circle',
    source: 'wetland-points',
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': 5,
      'circle-color': '#22d3ee',
      'circle-opacity': 0.9,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
      'circle-stroke-opacity': 0.4,
    },
  });

  // Zone labels
  m.addLayer({
    id: 'zones-labels',
    type: 'symbol',
    source: 'zones',
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-size': 11,
      'text-letter-spacing': 0.05,
    },
    paint: {
      'text-color': 'rgba(255,255,255,0.95)',
      'text-halo-color': 'rgba(0,0,0,0.9)',
      'text-halo-width': 1.2,
    },
  });
}

// ─── Data layer switching ─────────────────────────────────────────────────────

function getColorExpression(layer: DataLayer): mapboxgl.ExpressionSpecification {
  switch (layer) {
    case 'infection':
      return ['interpolate', ['linear'], ['get', 'baseRisk'], 0, '#22c55e', 0.3, '#eab308', 0.6, '#f97316', 1, '#ef4444'] as mapboxgl.ExpressionSpecification;
    case 'water_humidity':
      return ['match', ['get', 'wetlandClass'],
        'open_water', '#06b6d4',
        'marsh_wetland', '#0284c7',
        'moist_vegetation', '#16a34a',
        '#92400e',
      ] as mapboxgl.ExpressionSpecification;
    case 'vegetation':
      return ['interpolate', ['linear'], ['get', 'ndvi'], -0.3, '#92400e', 0.1, '#d9f99d', 0.8, '#15803d'] as mapboxgl.ExpressionSpecification;
    case 'biological_risk':
      return ['interpolate', ['linear'], ['get', 'breteauIndex'], 0, '#22c55e', 5, '#86efac', 20, '#f97316', 100, '#991b1b'] as mapboxgl.ExpressionSpecification;
    case 'climate':
      return ['interpolate', ['linear'], ['get', 'extTemp'], 20, '#3b82f6', 28, '#fbbf24', 38, '#ef4444'] as mapboxgl.ExpressionSpecification;
    default:
      return ['interpolate', ['linear'], ['get', 'baseRisk'], 0, '#22c55e', 1, '#ef4444'] as mapboxgl.ExpressionSpecification;
  }
}

function applyDataLayer(m: mapboxgl.Map, layer: DataLayer) {
  if (!m.getLayer('zones-fill')) return;

  // Update the main fill color
  m.setPaintProperty('zones-fill', 'fill-color', getColorExpression(layer));

  // Infection-only layers
  const infectionLayers = ['risk-heatmap', 'infection-glow', 'infection-core'];
  for (const id of infectionLayers) {
    if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', layer === 'infection' ? 'visible' : 'none');
  }

  // Wetland overlays — visible in water_humidity and biological_risk modes
  const showWetland = layer === 'water_humidity' || layer === 'biological_risk';
  if (m.getLayer('wetland-radius')) m.setLayoutProperty('wetland-radius', 'visibility', showWetland ? 'visible' : 'none');
  if (m.getLayer('wetland-hotspot')) m.setLayoutProperty('wetland-hotspot', 'visibility', showWetland ? 'visible' : 'none');

  // biological_risk also shows breeding heatmap overlay
  if (m.getLayer('breeding-fill')) m.setLayoutProperty('breeding-fill', 'visibility', layer === 'biological_risk' ? 'visible' : 'none');
}

function applyBreedingHighlights(m: mapboxgl.Map, ids: number[]) {
  if (!m.getLayer('breeding-fill')) return;
  const expr = ids.length > 0
    ? (['in', ['id'], ['literal', ids]] as mapboxgl.Expression)
    : (['literal', false] as mapboxgl.Expression);
  m.setPaintProperty('breeding-fill', 'fill-opacity', ['case', expr, 0.6, 0.3] as unknown as mapboxgl.ExpressionSpecification);
}

function applyHighlights(m: mapboxgl.Map, ids: number[]) {
  if (!m.getLayer('zones-fill')) return;
  const expr = ['in', ['id'], ['literal', ids]] as mapboxgl.Expression;

  m.setPaintProperty('zones-fill', 'fill-opacity', [
    'case', expr, 0.55, 0.22,
  ] as unknown as mapboxgl.ExpressionSpecification);

  m.setPaintProperty('zones-border', 'line-color', [
    'case', expr, '#22d3ee', 'rgba(255,255,255,0.35)',
  ] as unknown as mapboxgl.ExpressionSpecification);

  m.setPaintProperty('zones-border', 'line-width', [
    'case', expr, 3, 1,
  ] as unknown as mapboxgl.ExpressionSpecification);

  m.setPaintProperty('zones-border', 'line-opacity', [
    'case', expr, 1, 0.55,
  ] as unknown as mapboxgl.ExpressionSpecification);
}

// ─── Source updates ───────────────────────────────────────────────────────────

function updateSources(m: mapboxgl.Map, zones: Zone[]) {
  const zoneSrc = m.getSource('zones') as mapboxgl.GeoJSONSource | undefined;
  const pointSrc = m.getSource('zone-points') as mapboxgl.GeoJSONSource | undefined;
  if (zoneSrc) zoneSrc.setData(zonesToGeoJSON(zones));
  if (pointSrc) pointSrc.setData(zonesToPointFC(zones));
}

function updateWetlandSource(m: mapboxgl.Map, points: WetlandPoint[]) {
  const src = m.getSource('wetland-points') as mapboxgl.GeoJSONSource | undefined;
  if (src) src.setData(wetlandPointsToFC(points));
}

// ─── Interactions ─────────────────────────────────────────────────────────────

function wireInteractions(
  m: mapboxgl.Map,
  onZoneClick?: (id: number) => void,
  setHoveredZoneId?: (id: number | null) => void
) {
  m.on('mousemove', 'zones-fill', (e) => {
    if (!e.features?.length) return;
    m.getCanvas().style.cursor = 'crosshair';
    const id = e.features[0].id as number;
    setHoveredZoneId?.(id);
  });

  m.on('mouseleave', 'zones-fill', () => {
    m.getCanvas().style.cursor = '';
    setHoveredZoneId?.(null);
  });

  m.on('click', 'zones-fill', (e) => {
    if (!e.features?.length) return;
    const id = e.features[0].id as number;
    onZoneClick?.(id);
  });
}

// ─── GeoJSON helpers ──────────────────────────────────────────────────────────

function zonesToPointFC(zones: Zone[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: zones.map((z) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: z.centroid },
      properties: {
        id: z.id,
        risk: z.baseRisk,
        infected: z.infected,
        population: z.population,
        breedingScore: z.extendedData?.compositeBreedingScore ?? z.breedingRisk?.compositeBreedingScore ?? 0,
      },
    })),
  };
}

function wetlandPointsToFC(points: WetlandPoint[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: p.centroid },
      properties: {
        id: p.id,
        ndwi: p.ndwi,
        flightRadius_m: p.flightRadius_m,
        zoneId: p.zoneId,
        zoneName: p.zoneName,
      },
    })),
  };
}
