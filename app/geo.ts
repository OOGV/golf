import { COURSES_BY_ID } from "./data";

export type LatLng = { lat: number; lng: number };

const R = 6371000;

export function haversine(a: LatLng, b: LatLng) {
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function offset(origin: LatLng, north: number, east: number): LatLng {
  const dLat = north / 111320;
  const dLng = east / (111320 * Math.cos((origin.lat * Math.PI) / 180));
  return { lat: origin.lat + dLat, lng: origin.lng + dLng };
}

const PORI_GK: LatLng = { lat: 61.473, lng: 21.625 };

const COURSE_OFFSETS: Record<string, { phase: number; northBias: number; eastBias: number }> = {
  puisto: { phase: 0.0, northBias: 0, eastBias: 0 },
  joki: { phase: 0.18, northBias: 280, eastBias: -120 },
  suisto: { phase: 0.36, northBias: -150, eastBias: 220 },
};

export function greenLatLng(courseId: string, holeNumber: number): LatLng {
  const course = COURSES_BY_ID[courseId];
  if (course?.comboParts) {
    const [a, b] = course.comboParts;
    return holeNumber <= 9
      ? greenLatLng(a, holeNumber)
      : greenLatLng(b, holeNumber - 9);
  }
  const off = COURSE_OFFSETS[courseId] ?? COURSE_OFFSETS.puisto;
  const i = holeNumber - 1;
  const angle = (i / 9) * Math.PI * 2 + off.phase * Math.PI * 2;
  const radius = 180 + ((i * 67) % 220);
  const north = Math.cos(angle) * radius + off.northBias;
  const east = Math.sin(angle) * radius + off.eastBias;
  return offset(PORI_GK, north, east);
}

export function formatDistance(meters: number | null): string {
  if (meters == null || !Number.isFinite(meters)) return "—";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
