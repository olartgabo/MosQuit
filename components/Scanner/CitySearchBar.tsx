'use client';

import { useEffect, useRef, useState } from 'react';
import type { GeocodeSuggestion, ScanProgress } from '@/types';

interface CitySearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  suggestions: GeocodeSuggestion[];
  isGeocoding: boolean;
  selectedPlace: GeocodeSuggestion | null;
  onSelectSuggestion: (s: GeocodeSuggestion) => void;
  onClear: () => void;
  onScan: () => void;
  scanProgress: ScanProgress;
}

const PHASE_LABELS: Record<ScanProgress['phase'], string> = {
  idle: '',
  searching: 'Iniciando…',
  fetching_boundaries: 'Límites OSM',
  enriching: 'Satélite + Clima',
  complete: 'Listo',
  error: 'Error',
};

const PHASE_STEPS: ScanProgress['phase'][] = [
  'fetching_boundaries',
  'enriching',
  'complete',
];

export default function CitySearchBar({
  searchQuery,
  onSearchChange,
  suggestions,
  isGeocoding,
  selectedPlace,
  onSelectSuggestion,
  onClear,
  onScan,
  scanProgress,
}: CitySearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const isScanning =
    scanProgress.phase !== 'idle' && scanProgress.phase !== 'complete' && scanProgress.phase !== 'error';
  const canScan = !!selectedPlace && !isScanning;
  const dropdownOpen = isFocused && suggestions.length > 0;

  // Reset highlight whenever the result set changes.
  useEffect(() => {
    setActiveIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions]);

  // Keep the highlighted row in view when navigating with the keyboard.
  useEffect(() => {
    if (dropdownOpen) activeItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, dropdownOpen]);

  // Close on outside click.
  useEffect(() => {
    if (!isFocused) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isFocused]);

  const selectAt = (i: number) => {
    const s = suggestions[i];
    if (!s) return;
    onSelectSuggestion(s);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (!dropdownOpen) return;
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      if (!dropdownOpen) return;
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (dropdownOpen && activeIndex >= 0) {
        selectAt(activeIndex);
      } else if (canScan) {
        onScan();
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="pointer-events-auto flex flex-col gap-2 w-full max-w-md">
      {/* Search input row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          {/* Leading icon */}
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar ciudad…"
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={dropdownOpen}
            aria-autocomplete="list"
            aria-controls="city-search-listbox"
            aria-activedescendant={
              dropdownOpen && activeIndex >= 0 ? `city-search-option-${activeIndex}` : undefined
            }
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
          />

          {/* Trailing icon: spinner while geocoding, clear button when there's text */}
          {isGeocoding ? (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-white/40 border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
          ) : searchQuery.length > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : null}

          {/* Suggestions dropdown */}
          {dropdownOpen && (
            <div
              id="city-search-listbox"
              role="listbox"
              className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl overflow-hidden z-50 shadow-2xl max-h-80 overflow-y-auto"
            >
              {suggestions.map((s, i) => {
                const active = i === activeIndex;
                return (
                  <button
                    key={`${s.placeName}-${i}`}
                    ref={active ? activeItemRef : undefined}
                    id={`city-search-option-${i}`}
                    role="option"
                    aria-selected={active}
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    // mousedown fires before input blur — use it so the click registers
                    // before the outside-click handler closes the dropdown.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectAt(i);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 transition border-b border-white/5 last:border-0 flex items-start gap-3 ${
                      active ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Location pin */}
                    <svg
                      className={`mt-0.5 w-4 h-4 flex-none ${active ? 'text-cyan-300' : 'text-white/40'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium truncate ${active ? 'text-white' : 'text-white/90'}`}>
                        {s.mainText}
                      </div>
                      {s.secondaryText && (
                        <div className="text-xs text-white/50 truncate">{s.secondaryText}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={onScan}
          disabled={!canScan}
          className="flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isScanning ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
              Scan…
            </span>
          ) : (
            'Scan Area'
          )}
        </button>
      </div>

      {/* Progress indicator */}
      {(isScanning || scanProgress.phase === 'complete') && (
        <div className="rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl px-4 py-2.5">
          {/* Phase steps */}
          <div className="flex items-center gap-1 mb-1.5">
            {PHASE_STEPS.map((step, i) => {
              const stepIdx = PHASE_STEPS.indexOf(scanProgress.phase);
              const currentIdx = PHASE_STEPS.indexOf(step);
              const done = currentIdx < stepIdx || scanProgress.phase === 'complete';
              const active = step === scanProgress.phase;
              return (
                <div key={step} className="flex items-center gap-1">
                  <span
                    className={`text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-full transition ${
                      done
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : active
                          ? 'bg-white/10 text-white animate-pulse'
                          : 'text-white/25'
                    }`}
                  >
                    {PHASE_LABELS[step]}
                  </span>
                  {i < PHASE_STEPS.length - 1 && (
                    <span className={`text-[10px] ${done ? 'text-cyan-400' : 'text-white/20'}`}>→</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Zone counter */}
          {scanProgress.phase === 'enriching' && scanProgress.totalZones > 0 && (
            <div className="text-[11px] text-white/50 font-mono">
              Enriqueciendo {scanProgress.zonesEnriched} / {scanProgress.totalZones} zonas…
            </div>
          )}
          {scanProgress.phase === 'complete' && (
            <div className="text-[11px] text-cyan-300 font-mono">
              {scanProgress.zonesFound} zonas cargadas · datos satelitales y climáticos disponibles
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {scanProgress.phase === 'error' && scanProgress.errorMessage && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 backdrop-blur-xl px-4 py-2.5 text-xs text-red-300">
          {scanProgress.errorMessage}
        </div>
      )}
    </div>
  );
}
