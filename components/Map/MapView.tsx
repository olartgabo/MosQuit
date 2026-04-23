'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Zone } from '@/types';
import { zonesToGeoJSON } from '@/lib/city/generator';

interface MapViewProps {
  zones: Zone[];
  highlightedZones: number[];
  selectedZone?: number;
  onZoneClick?: (zoneId: number) => void;
}

const MANILA_CENTER: [number, number] = [120.9842, 14.5995];

export default function MapView({
  zones,
  highlightedZones = [],
  onZoneClick,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const styleReady = useRef(false);
  const [mapError, setMapError] = useState<string | null>(null);

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
        center: MANILA_CENTER,
        zoom: 11,
        pitch: 30,
        bearing: -8,
        attributionControl: false,
      });
      map.current = m;

      m.on('load', () => {
        styleReady.current = true;
        installLayers(m, zones);
        applyHighlights(m, highlightedZones);
        wireInteractions(m, onZoneClick);
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

  // Push zone updates
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

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/60">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2">Map Error</div>
          <div className="text-white/60 text-sm">{mapError}</div>
          <div className="mt-3 text-xs text-white/40">
            Add your token to <code className="text-cyan-300">.env.local</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
    </div>
  );
}

// ─── Layers ────────────────────────────────────────────────────────────

function installLayers(m: mapboxgl.Map, zones: Zone[]) {
  const zoneGeo = zonesToGeoJSON(zones);
  const points = zonesToPointFC(zones);

  m.addSource('zones', { type: 'geojson', data: zoneGeo });
  m.addSource('zone-points', { type: 'geojson', data: points });

  // Heatmap underlay
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

  // Zone fills (tinted by risk)
  m.addLayer({
    id: 'zones-fill',
    type: 'fill',
    source: 'zones',
    paint: {
      'fill-color': [
        'interpolate', ['linear'], ['get', 'baseRisk'],
        0, '#22c55e',
        0.3, '#eab308',
        0.6, '#f97316',
        1, '#ef4444',
      ],
      'fill-opacity': 0.18,
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

  // Infection glow (proportional to infected count)
  m.addLayer({
    id: 'infection-glow',
    type: 'circle',
    source: 'zone-points',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['get', 'infected'],
        0, 0,
        5, 10,
        50, 22,
        200, 36,
      ],
      'circle-color': '#ef4444',
      'circle-opacity': [
        'case',
        ['>', ['get', 'infected'], 0], 0.25,
        0,
      ],
      'circle-blur': 0.8,
    },
  });

  // Infection core dot
  m.addLayer({
    id: 'infection-core',
    type: 'circle',
    source: 'zone-points',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['get', 'infected'],
        0, 0,
        1, 2,
        50, 5,
        200, 8,
      ],
      'circle-color': '#fca5a5',
      'circle-opacity': [
        'case',
        ['>', ['get', 'infected'], 0], 1,
        0,
      ],
      'circle-stroke-color': '#ef4444',
      'circle-stroke-width': 1,
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

function updateSources(m: mapboxgl.Map, zones: Zone[]) {
  const zoneSrc = m.getSource('zones') as mapboxgl.GeoJSONSource | undefined;
  const pointSrc = m.getSource('zone-points') as mapboxgl.GeoJSONSource | undefined;
  if (zoneSrc) zoneSrc.setData(zonesToGeoJSON(zones));
  if (pointSrc) pointSrc.setData(zonesToPointFC(zones));
}

function applyHighlights(m: mapboxgl.Map, ids: number[]) {
  if (!m.getLayer('zones-fill')) return;
  const expr = ['in', ['id'], ['literal', ids]] as mapboxgl.Expression;

  m.setPaintProperty('zones-fill', 'fill-opacity', [
    'case',
    expr,
    0.55,
    0.18,
  ] as unknown as mapboxgl.ExpressionSpecification);

  m.setPaintProperty('zones-border', 'line-color', [
    'case',
    expr,
    '#22d3ee',
    'rgba(255,255,255,0.35)',
  ] as unknown as mapboxgl.ExpressionSpecification);

  m.setPaintProperty('zones-border', 'line-width', [
    'case',
    expr,
    3,
    1,
  ] as unknown as mapboxgl.ExpressionSpecification);

  m.setPaintProperty('zones-border', 'line-opacity', [
    'case',
    expr,
    1,
    0.55,
  ] as unknown as mapboxgl.ExpressionSpecification);
}

function wireInteractions(m: mapboxgl.Map, onZoneClick?: (id: number) => void) {
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 12,
  });

  m.on('mousemove', 'zones-fill', (e) => {
    if (!e.features?.length) return;
    m.getCanvas().style.cursor = 'pointer';
    const f = e.features[0];
    const p = f.properties as Record<string, unknown>;
    popup
      .setLngLat(e.lngLat)
      .setHTML(
        `<div style="min-width:180px">
           <div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#22d3ee;font-weight:700">${p.name}</div>
           <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px">${p.landUse}${p.hasSensitiveLocation ? ' · sensitive' : ''}</div>
           <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;margin-top:8px;font-size:12px">
             <span style="color:rgba(255,255,255,0.5)">risk</span><span style="font-family:monospace;font-weight:600;color:#fca5a5">${(Number(p.baseRisk) * 100).toFixed(0)}%</span>
             <span style="color:rgba(255,255,255,0.5)">pop</span><span style="font-family:monospace;font-weight:600">${Number(p.population).toLocaleString()}</span>
             <span style="color:rgba(255,255,255,0.5)">infected</span><span style="font-family:monospace;font-weight:600;color:#ef4444">${p.infected}</span>
             <span style="color:rgba(255,255,255,0.5)">recovered</span><span style="font-family:monospace;font-weight:600;color:#22c55e">${p.recovered}</span>
           </div>
         </div>`
      )
      .addTo(m);
  });

  m.on('mouseleave', 'zones-fill', () => {
    m.getCanvas().style.cursor = '';
    popup.remove();
  });

  m.on('click', 'zones-fill', (e) => {
    if (!e.features?.length) return;
    const id = e.features[0].id as number;
    onZoneClick?.(id);
  });
}

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
      },
    })),
  };
}
