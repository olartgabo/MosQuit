'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BreedingIntelligenceResponse, Zone } from '@/types';

export function useBreedingIntelligence(initialZones: Zone[]) {
  const [enrichedZones, setEnrichedZones] = useState<Zone[]>(initialZones);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<BreedingIntelligenceResponse['metadata']['dataSource'] | null>(null);
  const [metadata, setMetadata] = useState<BreedingIntelligenceResponse['metadata'] | null>(null);
  const hasFetched = useRef(false);

  const fetchBreedingData = useCallback(async (zones: Zone[]) => {
    if (zones.length === 0) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/intelligence/breeding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          zones: zones.map((z) => ({ id: z.id, centroid: z.centroid, geometry: z.geometry })),
        }),
      });

      if (!res.ok) return;
      const data: BreedingIntelligenceResponse = await res.json();

      // Merge breedingRisk back onto zones
      const byId = new Map(data.enrichedZones.map((e) => [e.zoneId, e.breedingRisk]));
      setEnrichedZones(zones.map((z) => {
        const br = byId.get(z.id);
        return br ? { ...z, breedingRisk: br } : z;
      }));
      setDataSource(data.metadata.dataSource);
      setMetadata(data.metadata);
    } catch {
      // Silently degrade — zones without breedingRisk still work
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch once when zones are first available
  useEffect(() => {
    if (initialZones.length > 0 && !hasFetched.current) {
      hasFetched.current = true;
      fetchBreedingData(initialZones);
    }
  }, [initialZones, fetchBreedingData]);

  // Keep enrichedZones in sync if initialZones reference changes (e.g. reset)
  useEffect(() => {
    setEnrichedZones(initialZones);
    hasFetched.current = false;
  }, [initialZones]);

  return {
    enrichedZones,
    isLoadingSatellite: isLoading,
    dataSource,
    metadata,
    refetch: () => fetchBreedingData(enrichedZones),
  };
}
