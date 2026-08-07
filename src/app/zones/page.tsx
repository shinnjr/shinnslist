'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { EmptyState, ErrorBoundary } from '@/components/ErrorBoundary';
import { MapSkeleton } from '@/components/Skeletons';

// Dynamic import to avoid SSR issues with Leaflet
const MapWithNoSSR = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

interface Zone {
  id: string;
  name: string;
  points: [number, number][]; // [lat, lng] pairs
  state: string;
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [mode, setMode] = useState<'view' | 'draw'>('view');
  const [activeState, setActiveState] = useState('CO');
  const [roadTrip, setRoadTrip] = useState(false);

  const addZone = useCallback((zone: Zone) => {
    setZones(prev => [...prev, zone]);
    setMode('view');
  }, []);

  const removeZone = useCallback((id: string) => {
    setZones(prev => prev.filter(z => z.id !== id));
  }, []);

  const states = ['CO', 'WY', 'NE', 'KS', 'OK', 'NM', 'AZ', 'UT', 'ID', 'MT', 'TX'];

  return (
    <main className="flex-1 flex flex-col">
      {/* Top bar */}
      <section className="max-w-7xl mx-auto w-full px-4 pt-6 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Your <span className="text-[var(--shinnslist-pink)]">Zones</span>
            </h1>
            <p className="text-[var(--shinnslist-muted)] text-sm mt-0.5">
              Draw custom polygon search zones — not just radius circles
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!roadTrip && (
              <select
                value={activeState}
                onChange={e => setActiveState(e.target.value)}
                className="min-h-[48px] bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-lg px-3 py-1.5 text-sm text-white"
              >
                {states.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => setMode(mode === 'draw' ? 'view' : 'draw')}
              className={`min-h-[48px] px-4 py-1.5 rounded-full text-sm font-bold border transition-all active:scale-[0.97] ${
                mode === 'draw'
                  ? 'bg-[var(--shinnslist-pink)] border-[var(--shinnslist-pink)] text-white shadow-lg shadow-[var(--shinnslist-pink)]/20'
                  : 'border-[var(--shinnslist-border)] text-[var(--shinnslist-muted)] hover:border-zinc-500'
              }`}
            >
              {mode === 'draw' ? 'Done Drawing' : '+ Draw Zone'}
            </button>

            {/* Road trip toggle */}
            <button
              onClick={() => setRoadTrip(!roadTrip)}
              className={`flex min-h-[48px] items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-[0.97] ${
                roadTrip
                  ? 'bg-green-600/20 border-green-600/40 text-green-400'
                  : 'border-[var(--shinnslist-border)] text-[var(--shinnslist-muted)]'
              }`}
            >
              🚗 Road Trip
            </button>
          </div>
        </div>

        {/* Zone chips */}
        {zones.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {zones.map(zone => (
              <span
                key={zone.id}
                className="flex items-center gap-1.5 bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-full px-3 py-1 text-xs text-white"
              >
                <span className="w-2 h-2 rounded-full bg-[var(--shinnslist-pink)]" />
                {zone.name} ({zone.state})
                <button
                  onClick={() => removeZone(zone.id)}
                  className="ml-1 text-[var(--shinnslist-muted)] hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Map */}
      <section className="flex-1 relative min-h-[60vh]">
        <ErrorBoundary label="The map">
          <MapWithNoSSR
            zones={zones}
            activeState={activeState}
            mode={mode}
            roadTrip={roadTrip}
            onZoneCreated={addZone}
          />
        </ErrorBoundary>

        {/* Empty-state hint overlay when no zones drawn yet */}
        {zones.length === 0 && mode === 'view' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto max-w-xs mx-4">
              <EmptyState
                message="No zones yet"
                description="Tap “+ Draw Zone” and trace a polygon on the map to start searching that area."
                emoji="🗺️"
                action={{ label: 'Draw your first zone', onClick: () => setMode('draw') }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Add-on upsell */}
      {!roadTrip && zones.length > 0 && (
        <section className="max-w-7xl mx-auto w-full px-4 py-4">
          <div className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🏢</span>
                <span className="text-white font-semibold text-sm">Additional State — +$1/week each</span>
              </div>
              <p className="text-[var(--shinnslist-muted)] text-xs mt-0.5">
                Add zones in other states to expand your search area
              </p>
            </div>
            <button className="min-h-[48px] bg-[var(--shinnslist-pink)] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-fuchsia-600 active:scale-[0.97] transition-all whitespace-nowrap">
              Add State
            </button>
          </div>

          <div className="bg-[var(--shinnslist-surface)] border border-[var(--shinnslist-border)] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🚗</span>
                <span className="text-white font-semibold text-sm">Road Trip Mode — +$3/week</span>
              </div>
              <p className="text-[var(--shinnslist-muted)] text-xs mt-0.5">
                Get deals along a route. Toggle on/off anytime.
              </p>
            </div>
            <button
              onClick={() => setRoadTrip(true)}
              className="min-h-[48px] border border-[var(--shinnslist-pink)] text-[var(--shinnslist-pink)] text-xs font-bold px-4 py-2 rounded-full hover:bg-[var(--shinnslist-pink)]/10 active:scale-[0.97] transition-all whitespace-nowrap"
            >
              Try Road Trip
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
