import { supabase } from '@/integrations/supabase/client';

const BROADCAST_CHANNEL = 'transit-presence';

async function sendPresenceBroadcast(
  event: 'vehicle-offline' | 'commuter-offline',
  id: string
): Promise<void> {
  const channel = supabase.channel(BROADCAST_CHANNEL);

  return new Promise((resolve, reject) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const result = await channel.send({
          type: 'broadcast',
          event,
          payload: { id },
        });
        supabase.removeChannel(channel);
        if (result === 'ok') {
          resolve();
        } else {
          reject(new Error(`Presence broadcast failed: ${result}`));
        }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        supabase.removeChannel(channel);
        reject(new Error(`Presence broadcast channel ${status}`));
      }
    });
  });
}

export function broadcastVehicleOffline(vehicleId: string): Promise<void> {
  return sendPresenceBroadcast('vehicle-offline', vehicleId);
}

export function broadcastCommuterOffline(locationId: string): Promise<void> {
  return sendPresenceBroadcast('commuter-offline', locationId);
}

export const PRESENCE_BROADCAST_CHANNEL = BROADCAST_CHANNEL;
