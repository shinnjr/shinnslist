// Geo helpers — haversine distance + drive-time estimate. Zero deps.

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rough drive minutes for surface streets (~45 km/h avg in metro). */
export function driveMinutes(km: number): number {
  return Math.max(1, Math.round((km / 45) * 60));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  if (km < 10) return `${km.toFixed(1)}km away`;
  return `${Math.round(km)}km away`;
}

export function formatMinutes(km: number): string {
  return `${driveMinutes(km)} min drive`;
}

export const DENVER: { lat: number; lng: number } = { lat: 39.7392, lng: -104.9903 };
