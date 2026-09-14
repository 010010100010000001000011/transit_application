import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import TransitMap, { TransitMapHandle } from '@/components/TransitMap';
import { useRealtimeVehicles } from '@/hooks/useRealtimeVehicles';
import { useRealtimeCommuters } from '@/hooks/useRealtimeCommuters';
import { usePinMessages } from '@/hooks/usePinMessages';
import QuickControls from '@/components/QuickControls';
import CommuterPinInbox from '@/components/CommuterPinInbox';
import VehicleCard from '@/components/VehicleCard';
import StatsBar from '@/components/StatsBar';
import ProfileSheet from '@/components/ProfileSheet';
import MapBottomSheet from '@/components/MapBottomSheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, User as UserIcon, X, ChevronUp } from 'lucide-react';
import { LocationStatusBadge, type LocationStatus } from '@/components/LocationStatusBadge';
import { toast } from 'sonner';
import { Vehicle } from '@/types/transit';

export type { LocationStatus };

const MIN_DISTANCE_DEG = 0.00005; // ~5.5m
const MAX_WRITE_INTERVAL_MS = 10_000;
const MAX_ACCURACY_METERS = 100; // Only accept positions with accuracy better than 100m

function hasMovedEnough(
  prevLat: number, prevLng: number,
  nextLat: number, nextLng: number,
): boolean {
  const dLat = Math.abs(nextLat - prevLat);
  const dLng = Math.abs(nextLng - prevLng);
  return dLat > MIN_DISTANCE_DEG || dLng > MIN_DISTANCE_DEG;
}

const NAV_HEIGHT = 64;

export const CommuterDashboard: React.FC = () => {
  const { profile, user } = useAuth();

  const { vehicles } = useRealtimeVehicles();
  const { commuters, refetch: refetchCommuters, removeCommuterOptimistic } = useRealtimeCommuters();
  const pins = usePinMessages('commuter');

  const [destination, setDestination] = useState<string>(profile?.destination || '');
  const [isSharing, setIsSharing] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [profileOpen, setProfileOpen] = useState(false);


  // Detail sheet: selected vehicle
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const mapHandleRef = useRef<TransitMapHandle | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastWrittenPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastWriteTimeRef = useRef<number>(0);
  const lastKnownPosRef = useRef<{ lat: number; lng: number } | null>(null);

  // ── Destination sync to profile ────────────────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    setDestination(profile.destination || '');
  }, [profile]);

  const fetchIncomingPins = useCallback(async (dest?: string) => {
    if (!dest || dest === 'Any') {
      await pins.fetchIncomingPins();
    } else {
      await pins.fetchIncomingPins(dest);
    }
  }, [pins]);

  useEffect(() => {
    fetchIncomingPins(destination);
  }, [destination, fetchIncomingPins]);

  // ── Location sharing w/ atomic is_active=false + lat=null on stop ──────────
  const writeCommuterLocation = useCallback(async (lat: number, lng: number, destOverride?: string) => {
    if (!user) return;
    const dest = destOverride ?? destination;
    const now = Date.now();
    const prev = lastWrittenPosRef.current;
    if (
      prev &&
      !hasMovedEnough(prev.lat, prev.lng, lat, lng) &&
      now - lastWriteTimeRef.current < MAX_WRITE_INTERVAL_MS &&
      !destOverride
    ) {
      return;
    }
    const { error } = await supabase.from('commuter_locations').upsert({
      user_id: user.id,
      current_lat: lat,
      current_lng: lng,
      destination: dest || null,
      is_active: true,
    }, { onConflict: 'user_id' });
    if (error) {
      toast.error('Failed to update your location. Try again.');
      console.error(error);
    } else {
      lastWrittenPosRef.current = { lat, lng };
      lastWriteTimeRef.current = now;
      lastKnownPosRef.current = { lat, lng };
    }
  }, [user, destination]);

  const stopLocationSharing = useCallback(async () => {
    // 1) Clear watcher immediately; stop local "sharing" UI state.
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    lastWrittenPosRef.current = null;
    lastWriteTimeRef.current = 0;
    setIsSharing(false);
    setLocationStatus('idle');

    // 2) OPTIMISTIC LOCAL REMOVAL — instant visual feedback, no refresh needed.
    if (user) removeCommuterOptimistic(user.id);

    // 3) ATOMIC DB WRITE: is_active=false + (lat,lng)=null so:
    //      a) realtime event, b) 10s polling safety net, c) mapDb* all agree it's gone.
    if (user) {
      await supabase
        .from('commuter_locations')
        .update({
          is_active: false,
          current_lat: null,
          current_lng: null,
        })
        .eq('user_id', user.id);
    }
  }, [user, removeCommuterOptimistic]);

  const toggleLocationSharing = useCallback(async () => {
    if (isSharing) {
      await stopLocationSharing();
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      toast.error('Your browser does not support location services.');
      return;
    }

    setLocationStatus('requesting');
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          
          console.log('[GPS Commuter] Initial position:', {
            lat: latitude.toFixed(6),
            lng: longitude.toFixed(6),
            accuracy: accuracy?.toFixed(1) + 'm',
            timestamp: new Date(pos.timestamp).toLocaleTimeString(),
          });

          lastKnownPosRef.current = { lat: latitude, lng: longitude };
          await writeCommuterLocation(latitude, longitude);
          setIsSharing(true);
          setLocationStatus('active');
          
          // Start continuous watching
          watchIdRef.current = navigator.geolocation.watchPosition(
            (p) => {
              const { latitude: lat, longitude: lng, accuracy: acc } = p.coords;
              
              console.log('[GPS Commuter] Position update:', {
                lat: lat.toFixed(6),
                lng: lng.toFixed(6),
                accuracy: acc?.toFixed(1) + 'm',
              });

              // Warn if accuracy is poor but still write (commuters may be indoors)
              if (acc && acc > MAX_ACCURACY_METERS) {
                console.warn(`[GPS Commuter] Poor accuracy: ±${acc.toFixed(0)}m`);
              }

              lastKnownPosRef.current = { lat, lng };
              writeCommuterLocation(lat, lng);
              setLocationStatus((s) => (s === 'requesting' ? 'active' : s));
            },
            (err) => {
              console.error('[GPS Commuter] Watch error:', err);
              switch (err.code) {
                case err.PERMISSION_DENIED:
                  setLocationStatus('denied');
                  stopLocationSharing();
                  break;
                case err.POSITION_UNAVAILABLE:
                  setLocationStatus('unavailable');
                  break;
                case err.TIMEOUT:
                  setLocationStatus('timeout');
                  break;
              }
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
          );
        },
        async (err) => {
          console.error('[GPS Commuter] Initial position error:', err);
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setLocationStatus('denied');
              break;
            case err.POSITION_UNAVAILABLE:
              setLocationStatus('unavailable');
              break;
            case err.TIMEOUT:
              setLocationStatus('timeout');
              break;
          }
          if (isSharing) await stopLocationSharing();
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 },
      );
    } catch {
      setLocationStatus('unavailable');
    }
  }, [isSharing, stopLocationSharing, writeCommuterLocation]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // ── Destination change handler ─────────────────────────────────────────────
  const handleDestinationChange = useCallback(async (newDest: string) => {
    setDestination(newDest);
    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ destination: newDest })
        .eq('user_id', user.id);
      if (profileError) console.error('Failed to update profile destination:', profileError);
    }
    if (lastKnownPosRef.current) {
      await writeCommuterLocation(lastKnownPosRef.current.lat, lastKnownPosRef.current.lng, newDest);
    }
    await fetchIncomingPins(newDest);
    refetchCommuters();
  }, [user, writeCommuterLocation, fetchIncomingPins, refetchCommuters]);

  // ── Filter vehicles by destination ─────────────────────────────────────────
  const filteredVehicles = useMemo(() => {
    if (!destination || destination === 'Any') return vehicles;
    return vehicles.filter((v) =>
      v.destination.toLowerCase().includes(destination.toLowerCase()),
    );
  }, [vehicles, destination]);

  // ── Vehicle tap → open detail drawer + pan-to-safe-center ──────────────────
  const handleVehicleSelect = useCallback((vehicle: Vehicle | null) => {
    setSelectedVehicle(vehicle);
    if (!vehicle || !mapHandleRef.current) return;
    // Detail drawer open ≈ 45% of screen. Also there's GlobalNav at NAV_HEIGHT.
    const cover = Math.round(window.innerHeight * 0.45) + NAV_HEIGHT;
    mapHandleRef.current.panToSafeCenter(
      vehicle.currentLocation.lat,
      vehicle.currentLocation.lng,
      { bottomCoverHeight: cover, zoom: 16 },
    );
  }, []);

  // ── Peek content (destination pill + sharing status) ───────────────────────
  const peekContent = (
    <div className="h-full flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-transit-green/10 text-transit-green flex items-center justify-center flex-none">
        <MapPin size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Where to?</p>
        <p className="font-semibold truncate">{destination || 'Tap to set destination'}</p>
      </div>
      <div
        className={`flex-none inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
          isSharing
            ? 'bg-status-available/15 text-status-available'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${isSharing ? 'bg-status-available animate-pulse' : 'bg-muted-foreground/50'}`}
        />
        {isSharing ? 'Live' : 'Offline'}
      </div>
      <ChevronUp className="flex-none h-4 w-4 text-muted-foreground" />
    </div>
  );

  // ── Half content (main QuickControls + pin inbox) ───────────────────────────
  const halfContent = (
    <div className="space-y-2">
      <QuickControls
        role="commuter"
        destination={destination}
        onDestinationChange={handleDestinationChange}
        isSharing={isSharing}
        onToggleSharing={toggleLocationSharing}
      />
      <LocationStatusBadge status={locationStatus} />
      {locationStatus === 'active' && (
        <div className="flex items-center gap-1.5 text-xs text-status-available">
          <MapPin className="h-3 w-3" />
          <span>Sharing your live location</span>
        </div>
      )}
      {pins.incomingPins.length > 0 && (
        <div className="border-t border-border pt-2 mt-2">
          <CommuterPinInbox
            pins={pins.incomingPins}
            respondedPinIds={pins.respondedPinIds}
            onRespond={pins.respondToPin}
          />
        </div>
      )}
    </div>
  );

  // ── Expanded content (pins + stats + profile shortcut) ─────────────────────
  const expandedContent = (
    <div className="space-y-3 pt-1">
      <StatsBar
        vehicles={vehicles}
        commuters={commuters as any}
        selectedDestination={destination || null}
      />
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => setProfileOpen(true)}>
          <UserIcon className="mr-1.5 h-4 w-4" /> Profile
        </Button>
        <Button variant="outline" onClick={() => refetchCommuters()}>
          <Navigation className="mr-1.5 h-4 w-4" /> Refresh Map
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full relative">
      {/* Map fills the whole screen at every breakpoint */}
      <div className="absolute inset-0 z-0">
        <TransitMap
          vehicles={filteredVehicles}
          commuters={commuters as any}
          role="commuter"
          selectedDestination={destination || null}
          mapHandle={(h) => (mapHandleRef.current = h)}
          onVehicleSelect={handleVehicleSelect}
        />
      </div>

      {/* Controls bottom sheet — peek/half/expanded */}
      <MapBottomSheet
        peekContent={peekContent}
        halfContent={halfContent}
        expandedContent={expandedContent}
        bottomInset={NAV_HEIGHT}
        initialSnap="peek"
        zIndex={40}
      />

      {/* Vehicle detail drawer — sits on top of control sheet / global nav */}
      <Drawer
        open={!!selectedVehicle}
        onOpenChange={(open) => !open && setSelectedVehicle(null)}
      >
        <DrawerContent className="rounded-t-2xl border-0 bg-background/95 backdrop-blur-xl max-h-[85vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Vehicle details</DrawerTitle>
            <DrawerDescription>{selectedVehicle?.licensePlate || ''}</DrawerDescription>
          </DrawerHeader>
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted" />
          {selectedVehicle && (
            <div className="px-4 pb-4 pt-2">
              <div className="flex justify-end mb-1">
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <X size={16} />
                  </Button>
                </DrawerClose>
              </div>
              <VehicleCard
                vehicle={selectedVehicle}
                onClose={() => setSelectedVehicle(null)}
                onTrack={() => {
                  if (!mapHandleRef.current || !selectedVehicle) return;
                  mapHandleRef.current.panToSafeCenter(
                    selectedVehicle.currentLocation.lat,
                    selectedVehicle.currentLocation.lng,
                    { bottomCoverHeight: 280, zoom: 17 },
                  );
                }}
                onIntercept={() => {
                  toast.success('Route guidance coming soon.');
                }}
              />
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
};

export default CommuterDashboard;
