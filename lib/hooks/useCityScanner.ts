'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { generateMockCity } from '@/lib/city/generator';
import type {
  GeocodeSuggestion,
  ScannedCity,
  ScanProgress,
  WetlandPoint,
  Zone,
} from '@/types';

const IDLE_PROGRESS: ScanProgress = {
  phase: 'idle',
  message: '',
  zonesFound: 0,
  zonesEnriched: 0,
  totalZones: 0,
};

export function useCityScanner() {
  const [zones, setZones] = useState<Zone[]>(() => generateMockCity(20));
  const [wetlandPoints, setWetlandPoints] = useState<WetlandPoint[]>([]);
  const [scannedCity, setScannedCity] = useState<ScannedCity | null>(null);
  const [scanProgress, setScanProgress] = useState<ScanProgress>(IDLE_PROGRESS);

  const [searchQuery, setSearchQueryState] = useState('');
  const [geocodeSuggestions, setGeocodeSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<GeocodeSuggestion | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [scanViewBbox, setScanViewBbox] = useState<[number, number, number, number] | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const requestIdRef = useRef(0);
  const skipNextFetchRef = useRef(false);

  // Typing invalidates the current selection so the Scan button re-gates.
  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryState(q);
    setSelectedPlace((prev) => (prev && prev.placeName === q ? prev : null));
  }, []);

  // Debounced geocoding
  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    if (searchQuery.trim().length < 2) {
      setGeocodeSuggestions([]);
      setIsGeocoding(false);
      return;
    }
    clearTimeout(debounceRef.current);
    setIsGeocoding(true);
    const reqId = ++requestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) {
        setIsGeocoding(false);
        return;
      }
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${token}&types=place,locality,district,neighborhood,region&autocomplete=true&limit=6`;
        const res = await fetch(url);
        if (!res.ok) {
          if (process.env.NODE_ENV !== 'production') {
            // Surface geocoding failures during development.
            console.warn('[geocode] request failed', res.status, await res.text());
          }
          if (reqId === requestIdRef.current) setIsGeocoding(false);
          return;
        }
        const data = await res.json();
        if (reqId !== requestIdRef.current) return; // stale response

        type MapboxFeature = {
          place_name: string;
          text?: string;
          place_type?: string[];
          context?: { text: string }[];
          bbox?: number[];
          center: number[];
        };
        const mapped: GeocodeSuggestion[] = (data.features ?? []).map((f: MapboxFeature) => {
          const mainText = f.text ?? f.place_name.split(',')[0];
          const contextParts = (f.context ?? []).map((c) => c.text);
          const secondaryText = contextParts.length
            ? contextParts.join(', ')
            : f.place_name.split(',').slice(1).join(',').trim();
          return {
            placeName: f.place_name,
            mainText,
            secondaryText,
            placeType: f.place_type?.[0] ?? 'place',
            center: f.center as [number, number],
            bbox: f.bbox as [number, number, number, number] | undefined,
          };
        });
        setGeocodeSuggestions(mapped);
        setIsGeocoding(false);
      } catch {
        if (reqId === requestIdRef.current) setIsGeocoding(false);
      }
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const selectSuggestion = useCallback((suggestion: GeocodeSuggestion) => {
    setSelectedPlace(suggestion);
    // Updating searchQuery to the full place name would retrigger the fetch;
    // skip the next effect run so the dropdown stays closed.
    skipNextFetchRef.current = true;
    setSearchQueryState(suggestion.placeName);
    setGeocodeSuggestions([]);
    setIsGeocoding(false);
  }, []);

  const clearSearch = useCallback(() => {
    skipNextFetchRef.current = true;
    setSearchQueryState('');
    setSelectedPlace(null);
    setGeocodeSuggestions([]);
    setIsGeocoding(false);
  }, []);

  const triggerScan = useCallback(async () => {
    if (!selectedPlace) return;

    // Mapbox returns enormous bboxes for admin regions (e.g. "Santa Cruz, Bolivia"
    // spans ~7° because it's the whole department). Overpass chokes on those:
    // too many relations, request times out, scan returns empty. Clamp the
    // scan footprint around the center so we always query a city-sized area.
    const MAX_SPAN = 0.6; // ~65 km at the equator
    const [cx, cy] = selectedPlace.center;
    const raw = selectedPlace.bbox ?? [cx - 0.15, cy - 0.15, cx + 0.15, cy + 0.15];
    const spanX = raw[2] - raw[0];
    const spanY = raw[3] - raw[1];
    const tooWide = spanX > MAX_SPAN || spanY > MAX_SPAN;
    const halfX = tooWide ? MAX_SPAN / 2 : spanX / 2;
    const halfY = tooWide ? MAX_SPAN / 2 : spanY / 2;
    const bbox: [number, number, number, number] = tooWide
      ? [cx - halfX, cy - halfY, cx + halfX, cy + halfY]
      : (raw as [number, number, number, number]);

    // Signal to the map: fly to the scan area as soon as the user clicks Scan.
    setScanViewBbox(bbox);

    setScanProgress({ phase: 'searching', message: 'Iniciando scan…', zonesFound: 0, zonesEnriched: 0, totalZones: 0 });

    try {
      const res = await fetch('/api/city/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bbox, cityName: selectedPlace.placeName }),
      });

      if (!res.ok) {
        setScanProgress({ phase: 'error', message: '', zonesFound: 0, zonesEnriched: 0, totalZones: 0, errorMessage: 'Error en la solicitud de scan' });
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            switch (data.type) {
              case 'progress':
                setScanProgress({
                  phase: data.phase,
                  message: data.message,
                  zonesFound: data.zonesFound,
                  zonesEnriched: data.zonesEnriched,
                  totalZones: data.totalZones,
                });
                break;
              case 'zones_ready':
                setZones(data.zones as Zone[]);
                break;
              case 'zone_enriched':
                setZones((prev) =>
                  prev.map((z) => (z.id === (data.zone as Zone).id ? (data.zone as Zone) : z))
                );
                break;
              case 'wetland_points':
                setWetlandPoints(data.points as WetlandPoint[]);
                break;
              case 'complete':
                setScannedCity(data.city as ScannedCity);
                setScanProgress((prev) => ({ ...prev, phase: 'complete', message: 'Scan completado' }));
                break;
              case 'error':
                setScanProgress((prev) => ({ ...prev, phase: 'error', errorMessage: data.message as string }));
                break;
            }
          } catch {
            // malformed event — skip
          }
        }
      }
    } catch (err) {
      setScanProgress((prev) => ({
        ...prev,
        phase: 'error',
        errorMessage: (err as Error).message,
      }));
    }
  }, [selectedPlace]);

  const reset = useCallback(() => {
    setZones(generateMockCity(20));
    setWetlandPoints([]);
    setScannedCity(null);
    setScanProgress(IDLE_PROGRESS);
    skipNextFetchRef.current = true;
    setSearchQueryState('');
    setGeocodeSuggestions([]);
    setSelectedPlace(null);
    setIsGeocoding(false);
    setScanViewBbox(null);
  }, []);

  return {
    scanProgress,
    scannedCity,
    zones,
    wetlandPoints,
    searchQuery,
    setSearchQuery,
    geocodeSuggestions,
    isGeocoding,
    selectedPlace,
    selectSuggestion,
    clearSearch,
    triggerScan,
    scanViewBbox,
    reset,
  };
}
