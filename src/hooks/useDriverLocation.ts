import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type GpsStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported';

interface DriverLocationState {
  gpsStatus: GpsStatus;
  lastUpdated: Date | null;
  error: string | null;
}

interface UseDriverLocationReturn extends DriverLocationState {
  startTracking: (vehicleId: string) => void;
  /**
   * Stop tracking and ATOMICALLY mark the vehicle inactive in the DB:
   *   is_active=false AND current_lat=null AND current_lng=null
   * The lat/lng null write ensures:
   *   1. mapDbVehicleToVehicle returns null (marker can't render).
   *   2. Even if realtime UPDATE arrives out-of-order (location write before
   *      is_active=false write), the marker disappears the instant any write wins.
   *
   * Returns the vehicleId that was being tracked so callers can do
   * optimistic local removal before awaiting the DB round-trip.
   */
  stopTracking: () => Promise<string | null>;
  isTracking: boolean;
  vehicleId: string | null;
}

// Only write to DB if moved at least this many degrees (~5.5 metres at Kitwe latitude)
const MIN_DISTANCE_DEG = 0.00005;
// Or if this many ms have passed since last write regardless of movement
const MAX_WRITE_INTERVAL_MS = 5000;
// Only accept GPS positions with accuracy better than this (in meters)
const MAX_ACCURACY_METERS = 100;

/** Haversine-style shortcut — good enough for small deltas */
function hasMovedEnough(
  prevLat: number, prevLng: number,
  nextLat: number, nextLng: number
): boolean {
  const dLat = Math.abs(nextLat - prevLat);
  const dLng = Math.abs(nextLng - prevLng);
  return dLat > MIN_DISTANCE_DEG || dLng > MIN_DISTANCE_DEG;
}

export const useDriverLocation = (): UseDriverLocationReturn => {
  const [state, setState] = useState<DriverLocationState>({
    gpsStatus: 'idle',
    lastUpdated: null,
    error: null,
  });
  const [isTracking, setIsTracking] = useState(false);
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const vehicleIdRef = useRef<string | null>(null);
  const lastWrittenPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastWriteTimeRef = useRef<number>(0);

  const writeToDb = useCallback(async (lat: number, lng: number, heading: number) => {
    const vid = vehicleIdRef.current;
    if (!vid) return;

    const now = Date.now();
    const timeSinceLastWrite = now - lastWriteTimeRef.current;
    const prev = lastWrittenPosRef.current;

    // Throttle: skip write if not moved enough AND not enough time has passed
    if (
      prev &&
      !hasMovedEnough(prev.lat, prev.lng, lat, lng) &&
      timeSinceLastWrite < MAX_WRITE_INTERVAL_MS
    ) {
      return;
    }

    const { error } = await supabase
      .from('vehicles')
      .update({
        current_lat: lat,
        current_lng: lng,
        heading: heading,
      })
      .eq('id', vid);

    if (!error) {
      lastWrittenPosRef.current = { lat, lng };
      lastWriteTimeRef.current = now;
      setState((s) => ({ ...s, lastUpdated: new Date(), error: null }));
    } else {
      console.error('[useDriverLocation] DB write failed:', error.message);
    }
  }, []);

  /**
   * Stop tracking and ATOMICALLY write the row inactive.
   *
   * Writing both is_active=false AND (lat,lng)=null in ONE SQL UPDATE.
   * Returns the vehicleId (or null if none was active).
   */
  const stopTracking = useCallback(async (): Promise<string | null> => {
    const vid = vehicleIdRef.current;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    vehicleIdRef.current = null;
    lastWrittenPosRef.current = null;
    lastWriteTimeRef.current = 0;
    setIsTracking(false);
    setVehicleId(null);
    setState({ gpsStatus: 'idle', lastUpdated: null, error: null });

    if (vid) {
      // Fire-and-forget atomic DB write. Even if this fails the caller has already
      // performed optimistic local removal. But the write guarantees that:
      //   a) the realtime event contains both is_active=false AND lat/lng=null,
      //   b) the polling safety net (in useRealtimeVehicles) catches the change
      //      within 10s even if the realtime event is dropped.
      supabase
        .from('vehicles')
        .update({
          is_active: false,
          current_lat: null,
          current_lng: null,
        })
        .eq('id', vid)
        .then(({ error }) => {
          if (error) console.error('[useDriverLocation] stopTracking DB error:', error.message);
        });
    }

    return vid;
  }, []);

  const startTracking = useCallback((vid: string) => {
    if (!navigator.geolocation) {
      setState({
        gpsStatus: 'unsupported',
        lastUpdated: null,
        error: 'Your browser does not support location services.',
      });
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    vehicleIdRef.current = vid;
    setVehicleId(vid);
    setState({ gpsStatus: 'requesting', lastUpdated: null, error: null });
    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, accuracy, speed } = position.coords;
        
        // Log GPS data for troubleshooting
        console.log('[GPS] Position update:', {
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
          accuracy: accuracy?.toFixed(1) + 'm',
          speed: speed?.toFixed(2) + 'm/s',
          heading: heading?.toFixed(0) + '°',
          timestamp: new Date(position.timestamp).toLocaleTimeString(),
        });

        // Only write to DB if accuracy is acceptable
        if (accuracy && accuracy > MAX_ACCURACY_METERS) {
          console.warn(`[GPS] Ignoring inaccurate position (±${accuracy.toFixed(0)}m). Waiting for better fix...`);
          setState((s) => ({
            ...s,
            gpsStatus: 'active',
            error: `Acquiring accurate position... (current accuracy: ±${accuracy.toFixed(0)}m)`,
          }));
          return;
        }

        // Only use heading if vehicle is moving (speed > 1 m/s = 3.6 km/h)
        const headingToWrite = (speed && speed > 1 && heading !== null && heading !== undefined) 
          ? heading 
          : 0;

        writeToDb(latitude, longitude, headingToWrite);
        
        setState((s) => ({
          ...s,
          gpsStatus: 'active',
          error: accuracy ? `GPS accurate to ±${accuracy.toFixed(0)}m` : null,
        }));
      },
      (err) => {
        let gpsStatus: GpsStatus;
        let error: string;

        switch (err.code) {
          case err.PERMISSION_DENIED:
            gpsStatus = 'denied';
            error = 'Location permission denied. Enable it in your browser settings.';
            break;
          case err.POSITION_UNAVAILABLE:
            gpsStatus = 'unavailable';
            error = 'Location unavailable. Check your device GPS.';
            break;
          case err.TIMEOUT:
            gpsStatus = 'timeout';
            error = 'Location request timed out. Move to an open area and retry.';
            break;
          default:
            gpsStatus = 'unavailable';
            error = 'Unable to get location.';
        }

        setState((s) => ({ ...s, gpsStatus, error }));
        // For any error that means GPS is no longer delivering positions,
        // reset isTracking so the "Go Online" button becomes tappable again.
        if (
          err.code === err.PERMISSION_DENIED ||
          err.code === err.POSITION_UNAVAILABLE ||
          err.code === err.TIMEOUT
        ) {
          setIsTracking(false);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,        // Always force fresh GPS reading (no cached positions)
        timeout: 30000,       // 30 seconds to acquire GPS lock
      }
    );
  }, [writeToDb]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    isTracking,
    vehicleId,
    startTracking,
    stopTracking,
  };
};
