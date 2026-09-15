import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PinMessage {
  id: string;
  driver_id: string;
  destination: string;
  message: string;
  driver_lat: number;
  driver_lng: number;
  is_active: boolean;
  created_at: string;
}

export interface PinResponse {
  id: string;
  pin_message_id: string;
  commuter_id: string;
  response: 'yes' | 'no';
  created_at: string;
}

/**
 * Pin messages: driver broadcasts to commuters on the same route;
 * commuter responds yes/no; driver sees interest counts in realtime.
 *
 * Call with no args — role comes from AuthContext.
 */
export const usePinMessages = () => {
  const { user, role } = useAuth();
  const [incomingPins, setIncomingPins] = useState<PinMessage[]>([]);
  const [myPins, setMyPins] = useState<PinMessage[]>([]);
  const [responses, setResponses] = useState<PinResponse[]>([]);
  const [respondedPinIds, setRespondedPinIds] = useState<Set<string>>(new Set());
  const destinationRef = useRef<string | undefined>(undefined);
  const pollRef = useRef<number | null>(null);

  const fetchIncomingPins = useCallback(
    async (commuterDestination?: string) => {
      if (!user || role !== 'commuter') return;

      if (commuterDestination !== undefined) {
        destinationRef.current = commuterDestination;
      }
      const dest = destinationRef.current;

      const { data, error } = await supabase
        .from('pin_messages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('[pins] fetchIncoming error', error);
        return;
      }

      const all = (data || []) as PinMessage[];

      // If commuter has a destination, prefer matching pins; still show others
      // so messages are never silently dropped when destinations differ slightly.
      const filtered =
        dest && dest.trim() && dest !== 'Any'
          ? [
              ...all.filter(
                (p) => p.destination.toLowerCase().trim() === dest.toLowerCase().trim()
              ),
              ...all.filter(
                (p) => p.destination.toLowerCase().trim() !== dest.toLowerCase().trim()
              ),
            ]
          : all;

      setIncomingPins(filtered);

      if (filtered.length > 0) {
        const pinIds = filtered.map((p) => p.id);
        const { data: resData } = await supabase
          .from('pin_responses')
          .select('*')
          .eq('commuter_id', user.id)
          .in('pin_message_id', pinIds);

        if (resData) {
          setRespondedPinIds(new Set(resData.map((r: PinResponse) => r.pin_message_id)));
        }
      }
    },
    [user, role]
  );

  const fetchMyPins = useCallback(async () => {
    if (!user || role !== 'driver') return;

    const { data, error } = await supabase
      .from('pin_messages')
      .select('*')
      .eq('driver_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[pins] fetchMyPins error', error);
      return;
    }

    setMyPins((data || []) as PinMessage[]);

    if (data && data.length > 0) {
      const pinIds = data.map((p: PinMessage) => p.id);
      const { data: resData } = await supabase
        .from('pin_responses')
        .select('*')
        .in('pin_message_id', pinIds);

      if (resData) {
        setResponses(resData as PinResponse[]);
      } else {
        setResponses([]);
      }
    } else {
      setResponses([]);
    }
  }, [user, role]);

  const sendPin = async (
    destination: string,
    message: string,
    lat: number,
    lng: number
  ) => {
    if (!user) return { error: new Error('Not authenticated') };
    if (!destination?.trim()) {
      return { error: new Error('Set a destination before sending a pin') };
    }

    const { error } = await supabase.from('pin_messages').insert({
      driver_id: user.id,
      destination: destination.trim(),
      message: message.trim() || `Heading to ${destination}?`,
      driver_lat: lat,
      driver_lng: lng,
      is_active: true,
    });

    if (!error) {
      await fetchMyPins();
    }

    return { error };
  };

  const respondToPin = async (pinMessageId: string, response: 'yes' | 'no') => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase.from('pin_responses').insert({
      pin_message_id: pinMessageId,
      commuter_id: user.id,
      response,
    });

    if (!error) {
      setRespondedPinIds((prev) => new Set([...prev, pinMessageId]));
      // Keep "yes" pins visible briefly so user sees confirmation; remove "no"
      if (response === 'no') {
        setIncomingPins((prev) => prev.filter((p) => p.id !== pinMessageId));
      }
    }

    return { error };
  };

  const deactivatePin = async (pinId: string) => {
    if (!user) return;

    await supabase.from('pin_messages').update({ is_active: false }).eq('id', pinId);
    setMyPins((prev) => prev.filter((p) => p.id !== pinId));
  };

  // Realtime + light polling (15s) so interest counts stay fresh without hammering
  useEffect(() => {
    if (!user || !role) return;

    if (role === 'commuter') fetchIncomingPins();
    if (role === 'driver') fetchMyPins();

    const pinChannel = supabase
      .channel(`pin-messages-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pin_messages' },
        () => {
          if (role === 'commuter') fetchIncomingPins();
          if (role === 'driver') fetchMyPins();
        }
      )
      .subscribe();

    const responseChannel = supabase
      .channel(`pin-responses-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pin_responses' },
        () => {
          if (role === 'driver') fetchMyPins();
          if (role === 'commuter') fetchIncomingPins();
        }
      )
      .subscribe();

    pollRef.current = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (role === 'commuter') fetchIncomingPins();
      if (role === 'driver') fetchMyPins();
    }, 15_000);

    return () => {
      supabase.removeChannel(pinChannel);
      supabase.removeChannel(responseChannel);
      if (pollRef.current !== null) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [user, role, fetchIncomingPins, fetchMyPins]);

  return {
    incomingPins,
    myPins,
    responses,
    respondedPinIds,
    sendPin,
    respondToPin,
    deactivatePin,
    fetchIncomingPins,
    fetchMyPins,
  };
};
