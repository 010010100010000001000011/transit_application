import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Commuter } from '@/types/transit';

interface DbCommuterLocation {
  id: string;
  user_id: string;
  current_lat: number;
  current_lng: number;
  destination: string | null;
  is_active: boolean;
  updated_at: string;
}

interface DbProfile {
  user_id: string;
  name: string;
  shirt_color: string | null;
  trouser_color: string | null;
}

export interface CommuterWithAppearance extends Commuter {
  shirtColor?: string;
  trouserColor?: string;
  userId?: string;
}

export interface UseRealtimeCommutersReturn {
  commuters: CommuterWithAppearance[];
  loading: boolean;
  refetch: () => Promise<void>;
  /**
   * Optimistically remove a commuter from the local state.
   * Accepts either the location-row `id` or the underlying `user_id`.
   * Use this BEFORE awaiting the DB round-trip when the local user stops
   * sharing location — provides instant visual feedback.
   */
  removeCommuterOptimistic: (idOrUserId: string) => void;
}

export const useRealtimeCommuters = (): UseRealtimeCommutersReturn => {
  const [commuters, setCommuters] = useState<CommuterWithAppearance[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingIntervalRef = useRef<number | null>(null);

  const fetchCommuters = useCallback(async () => {
    const { data: locations, error: locError } = await supabase
      .from('commuter_locations')
      .select('*')
      .eq('is_active', true);

    if (locError) {
      console.error('Error fetching commuter locations:', locError);
      setLoading(false);
      return;
    }

    if (!locations || locations.length === 0) {
      setCommuters([]);
      setLoading(false);
      return;
    }

    const userIds = locations.map((loc) => loc.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, name, shirt_color, trouser_color')
      .in('user_id', userIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
    }

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    const mapped: CommuterWithAppearance[] = (locations as DbCommuterLocation[]).map((loc) => {
      const profile = profileMap.get(loc.user_id) as DbProfile | undefined;
      const updatedAt = new Date(loc.updated_at);
      const waitingMinutes = Math.floor((Date.now() - updatedAt.getTime()) / 60000);

      return {
        id: loc.id,
        userId: loc.user_id,
        name: profile?.name || 'Commuter',
        location: {
          lat: loc.current_lat,
          lng: loc.current_lng,
        },
        destination: loc.destination || 'Unknown',
        waitingTime: waitingMinutes,
        shirtColor: profile?.shirt_color || undefined,
        trouserColor: profile?.trouser_color || undefined,
      };
    });

    setCommuters(mapped);
    setLoading(false);
  }, []);

  const removeCommuterOptimistic = useCallback((idOrUserId: string) => {
    setCommuters((prev) =>
      prev.filter((c) => c.id !== idOrUserId && c.userId !== idOrUserId),
    );
  }, []);

  useEffect(() => {
    fetchCommuters();

    const channel = supabase
      .channel('commuter-locations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'commuter_locations',
        },
        (_payload) => {
          console.log('Commuter location update:', _payload);
          // Full refetch — realtime UPDATEs only give us the location row,
          // we need profile data (name, colors) too anyway.
          fetchCommuters();
        }
      )
      .subscribe();

    // ── Polling safety net (10s) ─────────────────────────────────────────────
    pollingIntervalRef.current = window.setInterval(() => {
      fetchCommuters();
    }, 10_000);

    return () => {
      supabase.removeChannel(channel);
      if (pollingIntervalRef.current !== null) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [fetchCommuters]);

  return { commuters, loading, refetch: fetchCommuters, removeCommuterOptimistic };
};
