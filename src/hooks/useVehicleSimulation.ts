/**
 * useVehicleSimulation
 *
 * Client-side mock movement for development/testing only.
 * This hook is a no-op in production builds (import.meta.env.DEV === false).
 *
 * It is NOT connected to any dashboard — the live dashboards use
 * useRealtimeVehicles and useRealtimeCommuters against the real Supabase DB.
 * This hook exists purely so developers can visualise map animations and
 * marker behaviour without needing live drivers on the network.
 *
 * To use in dev, import and call this hook in a component, then pass the
 * returned vehicles/commuters to <TransitMap /> directly.
 */

import { useState, useEffect, useCallback } from 'react';
import { Vehicle, Commuter } from '@/types/transit';
import { generateMockVehicles, generateMockCommuters, KITWE_CENTER } from '@/data/mockData';

const MOVEMENT_SPEED = 0.0001; // Degrees per update (~11 m)
const UPDATE_INTERVAL = 1000;  // ms

// ── production stub — zero overhead ──────────────────────────────────────────
const noop = () => {};
const STUB = {
  vehicles: [] as Vehicle[],
  commuters: [] as Commuter[],
  resetSimulation: noop,
  isSimulating: false,
};

// ── simulation implementation ─────────────────────────────────────────────────
function useSimulationImpl() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => generateMockVehicles());
  const [commuters, setCommuters] = useState<Commuter[]>(() => generateMockCommuters());

  // Simulate vehicle movement
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((vehicle) => {
          const headingRad = (vehicle.heading * Math.PI) / 180;
          const newLat = vehicle.currentLocation.lat + Math.cos(headingRad) * MOVEMENT_SPEED;
          const newLng = vehicle.currentLocation.lng + Math.sin(headingRad) * MOVEMENT_SPEED;

          const boundedLat = Math.max(
            KITWE_CENTER.lat - 0.05,
            Math.min(KITWE_CENTER.lat + 0.05, newLat)
          );
          const boundedLng = Math.max(
            KITWE_CENTER.lng - 0.05,
            Math.min(KITWE_CENTER.lng + 0.05, newLng)
          );

          const headingAdjustment = (Math.random() - 0.5) * 10;
          let newHeading =
            boundedLat !== newLat || boundedLng !== newLng
              ? (vehicle.heading + 180) % 360
              : vehicle.heading + headingAdjustment;

          let newAvailableSeats = vehicle.availableSeats;
          if (Math.random() < 0.05) {
            const change = Math.random() < 0.5 ? -1 : 1;
            newAvailableSeats = Math.max(
              0,
              Math.min(vehicle.totalSeats, vehicle.availableSeats + change)
            );
          }

          let newStatus: Vehicle['status'] = 'available';
          if (newAvailableSeats === 0) newStatus = 'full';
          else if (newAvailableSeats <= vehicle.totalSeats * 0.2) newStatus = 'few-seats';

          return {
            ...vehicle,
            currentLocation: { lat: boundedLat, lng: boundedLng },
            heading: newHeading,
            availableSeats: newAvailableSeats,
            status: newStatus,
          };
        })
      );
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Increment commuter waiting times each minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCommuters((prev) =>
        prev.map((c) => ({ ...c, waitingTime: c.waitingTime + 1 }))
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const resetSimulation = useCallback(() => {
    setVehicles(generateMockVehicles());
    setCommuters(generateMockCommuters());
  }, []);

  return { vehicles, commuters, resetSimulation, isSimulating: true };
}

// ── exported hook — dev only ──────────────────────────────────────────────────
export const useVehicleSimulation = import.meta.env.DEV
  ? useSimulationImpl
  : () => STUB;

export default useVehicleSimulation;
