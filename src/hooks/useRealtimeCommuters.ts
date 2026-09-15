import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Commuter } from '@/types/transit';

interface DbCommuterLocation {
  id: string;
  user_id: string;
  current_lat: number | null;
  current_lng: number | null;
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
  removeCommuterOptimistic: (idOrUserId: string) => void;
}

export const useRealtimeCommuters = (): UseRealtimeCommutersReturn => {
  const [commuters, setCommuters] = useState<CommuterWithAppearance[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingIntervalRef = useRef<number | null>(null);
  const fetchingRef = useRef(false);

  const fetchCommuters = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const { data: locations, error: locError } = await supabase
        .from('commuter_locations')
        .select('*')
        .eq('is_active', true);

      if (locError) {
        console.error('Error fetching commuter locations:', locError);
        setLoading(false);
        return;
      }

      // Only keep rows with real coordinates
      const active = ((locations || []) as DbCommuterLocation[]).filter(
        (loc) =>
          loc.is_active &&
          loc.current_lat != null &&
          loc.current_lng != null &&
          Number.isFinite(loc.current_lat) &&
          Number.isFinite(loc.current_lng)
      );

      if (active.length === 0) {
        setCommuters([]);
        setLoading(false);
        return;
      }

      const userIds = active.map((loc) => loc.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, shirt_color, trouser_color')
        .in('user_id', userIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
      }

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, p as DbProfile])
      );

      const mapped: CommuterWithAppearance[] = active.map((loc) => {
        const profile = profileMap.get(loc.user_id);
        const updatedAt = new Date(loc.updated_at);
        const waitingMinutes = Math.max(
          0,
          Math.floor((Date.now() - updatedAt.getTime()) / 60000)
        );

        return {
          id: loc.id,
          userId: loc.user_id,
          name: profile?.name || 'Commuter',
          location: {
            lat: loc.current_lat as number,
            lng: loc.current_lng as number,
          },
          destination: loc.destination || 'Unknown',
          waitingTime: waitingMinutes,
          shirtColor: profile?.shirt_color || undefined,
          trouserColor: profile?.trouser_color || undefined,
        };
      });

      setCommuters(mapped);
      setLoading(false);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  const removeCommuterOptimistic = useCallback((idOrUserId: string) => {
    setCommuters((prev) =>
      prev.filter((c) => c.id !== idOrUserId && c.userId !== idOrUserId)
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
        () => {
          fetchCommuters();
        }
      )
      .subscribe();

    // 15s poll (was 10s) — only when tab is visible
    pollingIntervalRef.current = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchCommuters();
      }
    }, 15_000);

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
