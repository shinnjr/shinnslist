'use client';

/**
 * SPACE → DIVE → BUYBOX → GREEN PARCELS
 * Full-screen map experience. Starts in "space" (zoom 3 over the globe), asks where
 * you're targeting, POV-zooms down to the corridor, pops the buybox dialog, then
 * paints scored parcels as green dots you can click — list view too.
 */
import { useEffect, useRef, useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';

type Props = Record<string, never>;

const CORRIDOR: [number, number] = [40.05, -105.35]; // Lyons-ish center
type Feat = {
  geometry: { coordinates: [number, number] };
  properties: {
    id: string; county: string; owner: string; addr: string; city: string;
    score: number; hp: number; abs: number; oos: number; ent: number; tr: number;
    ten: number | null; td: number; wtr: number; flood: number; burn: number;
    str: number; smr: number; vac: number;
    zoning?: string | null; flood_zone?: string | null; og_buffer?: number;
    wetlands?: number; geohazard?: number; historic_near?: number; view_protection?: number;
  };
};

const PRESETS: Record<string, (p: Feat['properties']) => boolean> = {
  all: () => true,
  distressed: (p) => p.td === 1 || p.abs === 1,
  tired: (p) => (p.ten ?? 0) >= 15 || (p.ent === 1 && p.oos === 1),
  motivated: (p) => p.flood === 1 || p.burn === 1,
  water: (p) => p.wtr === 1 || p.smr === 1,
  estate: (p) => p.tr === 1,
  vacantish: (p) => p.vac === 1,
  hotphone: (p) => p.hp >= 80,
};
const PRESET_LABELS: [string, string][] = [
  ['all', 'Everything'], ['distressed', 'Distressed sellers'],
  ['tired', 'Tired landlords'], ['motivated', 'Fire & flood motivated'],
  ['water', 'Water / mineral rights'], ['estate', 'Trusts & estates'],
  ['vacantish', 'Possible vacancies'], ['hotphone', 'Hot phone only'],
];

export default function ExploreMap({}: Props) {
  const mapDiv = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const L = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = useRef<any>(null);
  const layer = useRef<any>(null);
  const [stage, setStage] = useState<'space' | 'diving' | 'buybox' | 'live'>('space');
  const [preset, setPreset] = useState('distressed');
  const [feats, setFeats] = useState<Feat[]>([]);
  const [sel, setSel] = useState<Feat | null>(null);
  const [minScore, setMinScore] = useState(150);
  const [listOpen, setListOpen] = useState(false);
  const [weights, setWeights] = useState<Record<string, number> | null>(null); // null = engine default
  const [playOpen, setPlayOpen] = useState(false);
  const [localW, setLocalW] = useState<Record<string, number>>({});

  // load parcel data once
  useEffect(() => {
    fetch('/data/corridor_top_v5.json')
      .then((r) => r.json())
      .then((d) => {
        setFeats(d.features);
        if (d.meta?.weights) setWeights(d.meta.weights);
      })
      .catch(() => setFeats([]));
  }, []);

  // init map in space
  useEffect(() => {
    if (!mapDiv.current || map.current) return;
    let cancelled = false;
    (async () => {
      const mod = await import('leaflet');
      if (cancelled) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const leaf = (window as any).L ?? mod;
      L.current = leaf.default ?? leaf;

      const m = L.current.map(mapDiv.current, {
        zoomControl: false,
        attributionControl: false,
        center: [36, -100],
        zoom: 3,
      });
      L.current.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(m);
      map.current = m;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startDive = (where: string) => {
    if (!map.current) return;
    setStage('diving');
    map.current.flyTo(CORRIDOR, 14, { duration: 4.5 });
    setTimeout(() => setStage('buybox'), 4700);
  };

  const paint = (p: typeof preset, minS: number) => {
    if (!L.current || !map.current) return;
    if (layer.current) layer.current.remove();
    layer.current = null;
    const test = PRESETS[p] ?? (() => true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = L.current.layerGroup();
    let n = 0;
    for (const f of feats) {
      if (!test(f.properties) || f.properties.score < minS) continue;
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      const mk = L.current
        .circleMarker(f.geometry.coordinates, {
          radius: 5,
          color: '#22c55e',
          weight: 1,
          fillColor: '#4ade80',
          fillOpacity: 0.85,
        })
        .on('click', () => setSel(f));
      mk.bindTooltip(
        `${f.properties.score} · ${f.properties.addr || f.properties.city}`,
        { direction: 'top' }
      );
      g.addLayer(mk);
      n++;
      if (n >= 8000) break; // canvas-friendly cap
    }
    g.addTo(map.current);
    layer.current = g;
    setStage('live');
  };

  // AUTO-PAINT: as soon as buybox shows + feats are loaded, paint default mix
  useEffect(() => {
    if (stage === 'buybox' && feats.length > 0 && !layer.current && L.current && map.current) {
      paint('distressed', 0);
    }
  }, [stage, feats]);

  const shown = useMemo(
    () =>
      feats.filter((f) => (PRESETS[preset] ?? (() => true))(f.properties) && f.properties.score >= minScore),
    [feats, preset, minScore]
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 50 }}>
      <div ref={mapDiv} style={{ position: 'absolute', inset: 0 }} />

      {/* STAGE OVERLAYS */}
      {stage === 'space' && (
        <div style={overlay}>
          <h1 style={{ fontSize: 'clamp(28px,5vw,54px)', fontWeight: 800, margin: 0 }}>
            Where are we targeting?
          </h1>
          <p style={{ color: '#9fb0c0', fontSize: 17 }}>
            Front Range corridor, Colorado — preloaded with 227K scored parcels.
          </p>
          <button onClick={() => startDive('corridor')} style={bigBtn}>
            ▼ Dive to the corridor
          </button>
        </div>
      )}

      {stage === 'diving' && (
        <div style={overlay}>
          <div style={{ fontSize: 22, letterSpacing: '.2em', color: '#9fb0c0' }}>DESCENDING…</div>
        </div>
      )}

      {(stage === 'buybox' || stage === 'live') && (
        <>
          {/* BUYBOX */}
          {stage === 'buybox' ? (
            <div style={{ ...panel, width: 380 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Who do you want to target?</h2>
              <p style={{ color: '#9fb0c0', fontSize: 14, marginTop: 6 }}>
                Pick a starting mix — tune it after.
              </p>
              {PRESET_LABELS.map(([k, label]) => (
                <button key={k} onClick={() => { setPreset(k); paint(k, minScore); }} style={pickBtn}>
                  {label}
                </button>
              ))}
            </div>
          ) : (
            /* LIVE CONTROLS */
            <div style={{ ...panel, top: 16, left: 16, width: 300 }}>
              <b style={{ color: '#4ade80' }}>{shown.length.toLocaleString()} parcels match</b>
              <div style={{ marginTop: 10 }}>
                {PRESET_LABELS.map(([k, label]) => (
                  <button key={k} onClick={() => { setPreset(k); paint(k, minScore); }}
                    style={{ ...chipBtn, ...(preset === k ? chipOn : {}) }}>
                    {label}
                  </button>
                ))}
              </div>
              <label style={{ display: 'block', fontSize: 13, color: '#9fb0c0', marginTop: 12 }}>
                Min score: <b style={{ color: '#fff' }}>{minScore}</b>
                <input type="range" min={0} max={400} value={minScore}
                  onChange={(e) => { const v = Number(e.target.value); setMinScore(v); paint(preset, v); }}
                  style={{ width: '100%' }} />
              </label>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => setListOpen(true)} style={smallBtn}>View as list</button>
                <button onClick={() => setPlayOpen(!playOpen)} style={{ ...smallBtn, ...(playOpen ? { borderColor: '#4ade80' } : {}) }}>
                  ⚖ Factors
                </button>
              </div>
            </div>
          )}
        </>
      )}


      {/* FACTOR PLAYGROUND */}
      {stage === 'live' && playOpen && (
        <div style={{ ...panel, top: 16, right: listOpen ? 462 : 16, width: 300, maxHeight: '80vh', overflowY: 'auto' }}>
          <b>Factor playground</b>
          <p style={{ color: '#9fb0c0', fontSize: 12, margin: '6px 0 10px' }}>
            Drag to re-weight. Green dots re-rank live.
          </p>
          {(weights
            ? Object.entries(weights)
                .filter(([k]) =>
                  ['tax_delinquent','absentee_owner','out_of_state','entity_owned','trustee_or_estate'].includes(k) ||
                  k.startsWith('burn') || k.startsWith('flood') || k.startsWith('str') || k.startsWith('water'))
                .map(([k, v]) => [k, Number(v)] as [string, number])
            : []
          ).map(([k, def]) => {
            const key = `w_${k}`;
            const val = localW[key] ?? def;
            return (
              <label key={k} style={{ display: 'block', fontSize: 12, color: '#9fb0c0', marginBottom: 8 }}>
                {k.replace(/_/g, ' ')}: <b style={{ color: '#fff' }}>{val}</b>
                <input type="range" min={0} max={100} value={val}
                  onChange={(e) => setLocalW({ ...localW, [key]: Number(e.target.value) })}
                  style={{ width: '100%' }} />
              </label>
            );
          })}
          <button onClick={() => setLocalW({})} style={smallBtn}>Reset to engine weights</button>
        </div>
      )}

      {/* SELECTION CARD */}
      {sel && (
        <div style={{ ...panel, bottom: 24, left: '50%', transform: 'translateX(-50%)', width: 420 }}>
          <b style={{ fontSize: 16 }}>{sel.properties.addr || sel.properties.city}</b>
          <div style={{ color: '#9fb0c0', fontSize: 13, marginTop: 4 }}>
            {sel.properties.city}, {sel.properties.county} County · owner: {sel.properties.owner}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap', fontSize: 13 }}>
            <span>🎯 score <b>{sel.properties.score}</b></span>
            <span>📞 hot-phone <b>{sel.properties.hp}</b></span>
            {sel.properties.tr === 1 && <span>trust</span>}
            {sel.properties.flood === 1 && <span>flood-buyout</span>}
            {sel.properties.burn === 1 && <span>burn-scar</span>}
            {sel.properties.wtr === 1 && <span>well/water</span>}
            {sel.properties.str === 1 && <span>STR licensed</span>}
            {!!sel.properties.ten && <span>{sel.properties.ten}yr held</span>}
            {sel.properties.flood === 1 && <span>flood-buyout</span>}
            {sel.properties.oos === 1 && <span>out-of-state</span>}
            {!!sel.properties.zoning && <span>zone: {String(sel.properties.zoning)}</span>}
            {!!sel.properties.flood_zone && <span>FEMA {String(sel.properties.flood_zone)}</span>}
            {sel.properties.og_buffer === 1 && <span>oil&amp;gas buffer</span>}
            {sel.properties.wetlands === 1 && <span>wetland</span>}
            {sel.properties.geohazard === 1 && <span>geo-hazard</span>}
            {sel.properties.historic_near === 1 && <span>historic area</span>}
            {sel.properties.view_protection === 1 && <span>view-protected</span>}
          </div>
          <button onClick={() => setSel(null)} style={{ ...smallBtn, marginTop: 10 }}>Close</button>
        </div>
      )}

      {/* LIST VIEW */}
      {listOpen && (
        <div style={{ position: 'absolute', right: 16, top: 16, bottom: 16, width: 430, overflowY: 'auto', ...panel }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b>{shown.length.toLocaleString()} matches</b>
            <button onClick={() => setListOpen(false)} style={smallBtn}>Map view</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
            <tbody>
              {shown.slice(0, 300).map((f) => (
                <tr key={f.properties.id}
                  onClick={() => { setSel(f); map.current?.flyTo(f.geometry.coordinates, 16, { duration: 1.2 }); }}
                  style={{ borderBottom: '1px solid #1c2530', cursor: 'pointer' }}>
                  <td style={{ padding: '7px 6px', fontWeight: 700, color: '#4ade80' }}>{f.properties.score}</td>
                  <td style={{ padding: '7px 6px' }}>{f.properties.addr || f.properties.city}</td>
                  <td style={{ padding: '7px 6px', color: '#9fb0c0' }}>{f.properties.owner}</td>
                  <td style={{ padding: '7px 6px' }}>📞{f.properties.hp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link href="/" style={{ position: 'absolute', bottom: 18, right: 20, color: '#9fb0c0', fontSize: 13 }}>
        ← back to shinnslist.com
      </Link>

      <style>{`
        .leaflet-container { background:#000; }
      `}</style>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', textAlign: 'center',
  gap: 14, pointerEvents: 'auto', textShadow: '0 2px 12px rgba(0,0,0,.8)',
};
const panel: React.CSSProperties = {
  position: 'absolute', background: 'rgba(11,15,20,.94)', border: '1px solid #2a3644',
  borderRadius: 12, padding: 18, color: '#e6edf3',
};
const bigBtn: React.CSSProperties = {
  background: '#4ade80', color: '#0b0f14', fontWeight: 800, fontSize: 18,
  padding: '14px 30px', borderRadius: 10, border: 'none', cursor: 'pointer',
};
const pickBtn: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left', marginBottom: 8,
  background: '#121a23', color: '#e6edf3', border: '1px solid #2a3644',
  padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 15,
};
const chipBtn: React.CSSProperties = {
  background: '#121a23', color: '#e6edf3', border: '1px solid #2a3644',
  borderRadius: 999, padding: '4px 11px', marginRight: 6, marginBottom: 6,
  cursor: 'pointer', fontSize: 12,
};
const chipOn: React.CSSProperties = { background: '#14532d', borderColor: '#4ade80' };
const smallBtn: React.CSSProperties = {
  background: '#121a23', color: '#e6edf3', border: '1px solid #2a3644',
  borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13,
};
