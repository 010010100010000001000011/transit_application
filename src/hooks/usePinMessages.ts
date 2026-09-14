import { useState, useEffect, useCallback } from 'react';
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

export const usePinMessages = () => {
  const { user, role } = useAuth();
  const [incomingPins, setIncomingPins] = useState<PinMessage[]>([]);
  const [myPins, setMyPins] = useState<PinMessage[]>([]);
  const [responses, setResponses] = useState<PinResponse[]>([]);
  const [respondedPinIds, setRespondedPinIds] = useState<Set<string>>(new Set());

  const fetchIncomingPins = useCallback(async (commuterDestination?: string) => {
    if (!user || role !== 'commuter') return;

    const { data, error } = await supabase
      .from('pin_messages')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pin messages:', error);
      return;
    }

    // Filter by commuter's destination client-side
    const filtered = commuterDestination
      ? (data as PinMessage[]).filter(
          (p) => p.destination.toLowerCase() === commuterDestination.toLowerCase()
        )
      : [];

    setIncomingPins(filtered);

    // Fetch which ones the commuter already responded to
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
  }, [user, role]);

  const fetchMyPins = useCallback(async () => {
    if (!user || role !== 'driver') return;

    const { data, error } = await supabase
      .from('pin_messages')
      .select('*')
      .eq('driver_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching my pins:', error);
      return;
    }

    setMyPins(data as PinMessage[]);

    // Fetch responses to my pins
    if (data && data.length > 0) {
      const pinIds = data.map((p: PinMessage) => p.id);
      const { data: resData } = await supabase
        .from('pin_responses')
        .select('*')
        .in('pin_message_id', pinIds);

      if (resData) {
        setResponses(resData as PinResponse[]);
      }
    }
  }, [user, role]);

  const sendPin = async (destination: string, message: string, lat: number, lng: number) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase.from('pin_messages').insert({
      driver_id: user.id,
      destination,
      message,
      driver_lat: lat,
      driver_lng: lng,
    });

    if (!error) {
      fetchMyPins();
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
      if (response === 'no') {
        setIncomingPins((prev) => prev.filter((p) => p.id !== pinMessageId));
      }
    }

    return { error };
  };

  const deactivatePin = async (pinId: string) => {
    if (!user) return;

    await supabase
      .from('pin_messages')
      .update({ is_active: false })
      .eq('id', pinId);

    setMyPins((prev) => prev.filter((p) => p.id !== pinId));
  };

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const pinChannel = supabase
      .channel('pin-messages-realtime')
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
      .channel('pin-responses-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pin_responses' },
        () => {
          if (role === 'driver') fetchMyPins();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pinChannel);
      supabase.removeChannel(responseChannel);
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
