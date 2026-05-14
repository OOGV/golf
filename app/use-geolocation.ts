"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLng } from "./geo";

export type GeoStatus =
  | "unknown"
  | "locating"
  | "granted"
  | "denied"
  | "unavailable"
  | "unsupported";

export type GeoFix = LatLng & {
  accuracy: number;
  ts: number;
};

export type GeoState = {
  position: GeoFix | null;
  status: GeoStatus;
  error: string | null;
  positionRef: React.RefObject<GeoFix | null>;
};

export function useGeolocation(): GeoState {
  const [position, setPosition] = useState<GeoFix | null>(null);
  const [status, setStatus] = useState<GeoStatus>("unknown");
  const [error, setError] = useState<string | null>(null);
  const positionRef = useRef<GeoFix | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("locating");
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const fix: GeoFix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          ts: pos.timestamp,
        };
        positionRef.current = fix;
        setPosition(fix);
        setStatus("granted");
        setError(null);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setStatus("unavailable");
        } else {
          setStatus("unavailable");
        }
        setError(err.message);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { position, status, error, positionRef };
}
