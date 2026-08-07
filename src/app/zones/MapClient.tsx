'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Dynamic import for leaflet-draw to avoid SSR issues
let leafletDraw: any = null;
if (typeof window !== 'undefined') {
  leafletDraw = require('leaflet-draw');
  require('leaflet-draw/dist/leaflet.draw.css');
}

interface Zone {
  id: string;
  name: string;
  points: [number, number][];
  state: string;
}

interface Props {
  zones: Zone[];
  activeState: string;
  mode: 'view' | 'draw';
  roadTrip: boolean;
  onZoneCreated: (zone: Zone) => void;
}

// Fix Leaflet marker icon paths (broken by webpack)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// State centers for initial map position
const STATE_CENTERS: Record<string, [number, number]> = {
  CO: [39.0, -105.5],
  WY: [42.8, -107.5],
  NE: [41.5, -99.7],
  KS: [38.5, -98.3],
  OK: [35.5, -97.5],
  NM: [34.4, -106.1],
  AZ: [34.0, -111.0],
  UT: [39.3, -111.7],
  ID: [44.1, -114.7],
  MT: [46.9, -110.0],
  TX: [31.0, -100.0],
};

export default function MapClient({ zones, activeState, mode, roadTrip, onZoneCreated }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<any>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || initialized) return;

    const center = STATE_CENTERS[activeState] || [39.0, -105.5];

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: roadTrip ? 5 : 8,
      zoomControl: true,
      attributionControl: true,
    });

    // OpenStreetMap tiles (free)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Draw control — leaflet-draw extends L via side-effect
    const DrawControl = (L as any)['Control']?.['Draw'];
    if (!DrawControl) {
      console.warn('Leaflet Draw not available');
      return;
    }
    const drawControl = new DrawControl({
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#FF1493',
            weight: 2,
            fillOpacity: 0.15,
          },
        },
        polyline: roadTrip ? {
          shapeOptions: {
            color: '#39FF14',
            weight: 4,
          },
        } : false,
        rectangle: {
          shapeOptions: {
            color: '#FF1493',
            weight: 2,
            fillOpacity: 0.15,
          },
        },
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });

    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    // Handle zone creation
    map.on((L as any).Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);

      let points: [number, number][] = [];

      if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
        const latlngs: any = layer.getLatLngs();
        // Flatten nested latlng arrays
        const flatten = (arr: any): any[] => {
          if (arr.length > 0 && typeof arr[0].lat === 'number') return arr;
          return arr.flatMap(flatten);
        };
        points = flatten(latlngs).map((ll: any) => [ll.lat, ll.lng] as [number, number]);
      } else if (layer instanceof L.Polyline) {
        const latlngs: any = layer.getLatLngs();
        points = latlngs.map((ll: any) => [ll.lat, ll.lng] as [number, number]);
      }

      const zoneId = `zone_${Date.now()}`;
      onZoneCreated({
        id: zoneId,
        name: `Zone ${zones.length + 1}`,
        points,
        state: activeState,
      });
    });

    mapRef.current = map;
    setInitialized(true);

    return () => {
      map.remove();
    };
  }, []);

  // Fly to state when changed
  useEffect(() => {
    if (!mapRef.current) return;
    const center = STATE_CENTERS[activeState] || [39.0, -105.5];
    mapRef.current.flyTo(center, roadTrip ? 5 : 8, { duration: 1 });
  }, [activeState, roadTrip]);

  // Toggle draw mode
  useEffect(() => {
    if (!mapRef.current || !drawControlRef.current) return;
    const container = mapRef.current.getContainer();
    if (mode === 'draw') {
      container.style.cursor = 'crosshair';
      // Enable polygon tool
      ((drawControlRef.current as any)._toolbars?.draw?._modes?.polygon as any)?.handler?.enable?.();
    } else {
      container.style.cursor = '';
    }
  }, [mode]);

  // Show existing zones
  useEffect(() => {
    if (!mapRef.current || !drawnItemsRef.current) return;
    drawnItemsRef.current.clearLayers();

    zones.forEach(zone => {
      const polygon = L.polygon(zone.points, {
        color: '#FF1493',
        weight: 2,
        fillOpacity: 0.15,
      });
      polygon.bindPopup(`<b>${zone.name}</b><br>${zone.state} — ${zone.points.length} points`);
      drawnItemsRef.current!.addLayer(polygon);
    });
  }, [zones]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full min-h-[60vh] rounded-xl overflow-hidden"
      style={{ background: '#1a1a2e' }}
    />
  );
}
