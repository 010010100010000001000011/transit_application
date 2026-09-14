import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/types/transit';

interface DbVehicle {
  id: string;
  driver_id: string;
  license_plate: string;
  vehicle_type: string;
  color: string;
  total_seats: number;
  available_seats: number;
  destination: string | null;
  current_lat: number | null;
  current_lng: number | null;
  heading: number | null;
  is_active: boolean;
  updated_at: string;
}

export interface UseRealtimeVehiclesReturn {
  vehicles: Vehicle[];
  loading: boolean;
  refetch: () => Promise<void>;
  /**
   * Optimistically remove a vehicle from the local state.
   * Use this BEFORE awaiting the DB round-trip when the local user goes
   * offline — provides instant visual feedback even if the realtime UPDATE
   * is momentarily delayed or dropped.
   */
  removeVehicleOptimistic: (vehicleId: string) => void;
}

export const useRealtimeVehicles = (): UseRealtimeVehiclesReturn => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingIntervalRef = useRef<number | null>(null);

  const mapDbVehicleToVehicle = (dbVehicle: DbVehicle): Vehicle | null => {
    if (!dbVehicle.current_lat || !dbVehicle.current_lng) return null;

    const availableSeats = dbVehicle.available_seats;
    const totalSeats = dbVehicle.total_seats;

    let status: 'available' | 'few-seats' | 'full' = 'available';
    if (availableSeats === 0) {
      status = 'full';
    } else if (availableSeats <= totalSeats * 0.3) {
      status = 'few-seats';
    }

    return {
      id: dbVehicle.id,
      type: dbVehicle.vehicle_type as 'bus' | 'minibus' | 'taxi',
      licensePlate: dbVehicle.license_plate,
      color: dbVehicle.color,
      destination: dbVehicle.destination || 'Unknown',
      currentLocation: {
        lat: dbVehicle.current_lat,
        lng: dbVehicle.current_lng,
      },
      totalSeats: totalSeats,
      availableSeats: availableSeats,
      status,
      driverName: 'Driver',
      heading: dbVehicle.heading || 0,
      updatedAt: dbVehicle.updated_at,
    };
  };

  const fetchVehicles = useCallback(async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching vehicles:', error);
      return;
    }

    const mappedVehicles = (data as DbVehicle[])
      .map(mapDbVehicleToVehicle)
      .filter((v): v is Vehicle => v !== null);

    setVehicles(mappedVehicles);
    setLoading(false);
  }, []);

  const removeVehicleOptimistic = useCallback((vehicleId: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
  }, []);

  useEffect(() => {
    fetchVehicles();

    const channel = supabase
      .channel('vehicles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles',
        },
        (payload) => {
          console.log('Vehicle update:', payload);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const dbVehicle = payload.new as DbVehicle;
            if (dbVehicle.is_active) {
              const vehicle = mapDbVehicleToVehicle(dbVehicle);
              if (vehicle) {
                setVehicles((prev) => {
                  const exists = prev.find((v) => v.id === vehicle.id);
                  if (exists) {
                    return prev.map((v) => (v.id === vehicle.id ? vehicle : v));
                  }
                  return [...prev, vehicle];
                });
              }
            } else {
              setVehicles((prev) => prev.filter((v) => v.id !== dbVehicle.id));
            }
          } else if (payload.eventType === 'DELETE') {
            const oldVehicle = payload.old as { id: string };
            setVehicles((prev) => prev.filter((v) => v.id !== oldVehicle.id));
          }
        }
      )
      .subscribe();

    // ── Polling safety net ───────────────────────────────────────────────────
    // If a realtime UPDATE is dropped (network blip, tab backgrounded,
    // websocket disconnect), a 10s poller guarantees the marker vanishes
    // within 10s max. Supabase SELECTs are lightweight so this does not
    // meaningfully increase load.
    pollingIntervalRef.current = window.setInterval(() => {
      fetchVehicles();
    }, 10_000);

    return () => {
      supabase.removeChannel(channel);
      if (pollingIntervalRef.current !== null) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [fetchVehicles]);

  return { vehicles, loading, refetch: fetchVehicles, removeVehicleOptimistic };
};
