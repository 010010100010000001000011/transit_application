import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import TransitMap, { TransitMapHandle } from '@/components/TransitMap';
import { useRealtimeVehicles } from '@/hooks/useRealtimeVehicles';
import {
  useRealtimeCommuters,
  CommuterWithAppearance,
} from '@/hooks/useRealtimeCommuters';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { usePinMessages } from '@/hooks/usePinMessages';
import QuickControls from '@/components/QuickControls';
import DriverPinSender from '@/components/DriverPinSender';
import CommuterCard from '@/components/CommuterCard';
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
import {
  Loader2, Car, Radio, User as UserIcon, X, ChevronUp,
} from 'lucide-react';
import { GpsStatusBadge } from '@/components/LocationStatusBadge';
import { toast } from 'sonner';

import type { Vehicle } from '@/types/transit';
import type { Commuter } from '@/types/transit';

const NAV_HEIGHT = 64;

interface DriverVehicle {
  id: string;
  driver_id: string;
  license_plate: string;
  vehicle_type: 'bus' | 'minibus' | 'taxi';
  color: string;
  total_seats: number;
  available_seats: number;
  destination: string;
  is_active: boolean;
  current_lat?: number | null;
  current_lng?: number | null;
}

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    gpsStatus, lastUpdated, isTracking, vehicleId: trackingVehicleId, startTracking, stopTracking,
  } = useDriverLocation();
  const { vehicles, removeVehicleOptimistic, refetch: refetchVehicles } = useRealtimeVehicles();
  const { commuters, refetch: refetchCommuters } = useRealtimeCommuters();
  const pins = usePinMessages();

  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null);
  const [registering, setRegistering] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedCommuter, setSelectedCommuter] = useState<Commuter | null>(null);

  const mapHandleRef = useRef<TransitMapHandle | null>(null);
  const latestPosRef = useRef<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  // ── Load driver's vehicle ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('driver_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data) {
        setVehicle(data as DriverVehicle);
        // If DB vehicle is still active locally but driver has no active watcher,
        // mark the visual state as offline (it'll be re-enabled when they tap Online).
        if (!isTracking) {
          setVehicle((v) => v ? { ...v, is_active: false } : v);
        }
      }
      setLoadingVehicle(false);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Optimistically keep latestPosRef up to date from realtime vehicles list
  useEffect(() => {
    if (!vehicle) return;
    const self = vehicles.find((v: Vehicle) => v.id === vehicle.id);
    if (self) {
      latestPosRef.current = {
        lat: self.currentLocation.lat,
        lng: self.currentLocation.lng,
      };
    }
  }, [vehicles, vehicle]);

  // ── Seat change ────────────────────────────────────────────────────────────
  const updateAvailableSeats = useCallback(async (delta: number) => {
    if (!vehicle) return;
    const newAvailable = Math.max(0, Math.min(vehicle.total_seats, vehicle.available_seats + delta));
    setVehicle({ ...vehicle, available_seats: newAvailable });
    const { error } = await supabase
      .from('vehicles')
      .update({ available_seats: newAvailable })
      .eq('id', vehicle.id);
    if (error) {
      toast.error('Failed to update seats');
      setVehicle(vehicle); // rollback
    }
  }, [vehicle]);

  // ── Destination change ─────────────────────────────────────────────────────
  const updateDestination = useCallback(async (newDest: string) => {
    if (!vehicle) return;
    setVehicle({ ...vehicle, destination: newDest });
    const { error } = await supabase
      .from('vehicles')
      .update({ destination: newDest })
      .eq('id', vehicle.id);
    if (error) toast.error('Failed to update destination');
    else toast.success('Destination updated');
  }, [vehicle]);

  // ── Online/offline toggle with atomic writes + optimistic removal ──────────
  const toggleOnline = useCallback(async () => {
    if (!vehicle) return;
    if (vehicle.is_active) {
      // Going offline.
      // 1) Stop GPS watcher first (it also fires the atomic DB write: is_active=false + lat/lng=null)
      const stoppedVid = await stopTracking();
      // 2) Optimistically remove our own vehicle marker from the local map immediately.
      if (stoppedVid) removeVehicleOptimistic(stoppedVid);
      // 3) Flip is_active in local state so the header status updates.
      setVehicle((v) => v ? { ...v, is_active: false } : v);
    } else {
      // Going online.
      const { error } = await supabase
        .from('vehicles')
        .update({ is_active: true })
        .eq('id', vehicle.id);
      if (error) {
        toast.error('Failed to go online');
        return;
      }
      setVehicle((v) => v ? { ...v, is_active: true } : v);
      startTracking(vehicle.id);
      toast.success('You are now online');
    }
  }, [vehicle, startTracking, stopTracking, removeVehicleOptimistic]);

  // ── Register vehicle (first-run) ───────────────────────────────────────────
  const [regLicense, setRegLicense] = useState('');
  const [regType, setRegType] = useState<DriverVehicle['vehicle_type']>('minibus');
  const [regColor, setRegColor] = useState('White');
  const [regSeats, setRegSeats] = useState<number>(14);
  const [regDestination, setRegDestination] = useState('Town Centre');

  const handleRegister = async () => {
    if (!user) return;
    setRegistering(true);
    const { error } = await supabase.from('vehicles').insert({
      driver_id: user.id,
      license_plate: regLicense.toUpperCase().trim(),
      vehicle_type: regType,
      color: regColor,
      total_seats: regSeats,
      available_seats: regSeats,
      destination: regDestination || null,
      is_active: false,
    }).select().single();
    setRegistering(false);
    if (error) {
      toast.error(error.message || 'Registration failed');
      return;
    }
    toast.success('Vehicle registered. Tap Go Online to start!');
    await refetchVehicles();
    // Load registered vehicle into state
    if (!error) {
      const { data: v } = await supabase
        .from('vehicles')
        .select('*')
        .eq('driver_id', user.id)
        .maybeSingle();
      if (v) setVehicle(v as DriverVehicle);
    }
  };

  // ── Filter commuters by destination ────────────────────────────────────────
  const filteredCommuters = useMemo(() => {
    if (!vehicle?.destination || vehicle.destination === 'Any') return commuters;
    return commuters.filter((c) =>
      c.destination.toLowerCase().includes(vehicle.destination.toLowerCase()),
    );
  }, [commuters, vehicle?.destination]);

  // ── Commuter tap → open detail drawer + pan-to-safe-center ─────────────────
  const handleCommuterSelect = useCallback((c: Commuter | null) => {
    setSelectedCommuter(c);
    if (!c || !mapHandleRef.current) return;
    // Detail drawer ≈ 45% of screen height + GlobalNav.
    const cover = Math.round(window.innerHeight * 0.45) + NAV_HEIGHT;
    mapHandleRef.current.panToSafeCenter(
      c.location.lat, c.location.lng, { bottomCoverHeight: cover, zoom: 16 },
    );
  }, []);

  if (loadingVehicle) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-transit-green" />
      </div>
    );
  }

  // ── Registration screen ────────────────────────────────────────────────────
  if (!vehicle) {
    return (
      <div className="h-full w-full bg-background p-4 overflow-y-auto">
        <div className="max-w-md mx-auto py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-transit-green/10 text-transit-green flex items-center justify-center">
              <Car size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Register your vehicle</h2>
              <p className="text-sm text-muted-foreground">You only need to do this once.</p>
            </div>
          </div>

          <div className="space-y-4 bg-card border border-border rounded-2xl p-5">
            <div>
              <label className="text-sm font-medium">License plate</label>
              <input
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                placeholder="ABC 1234"
                value={regLicense}
                onChange={(e) => setRegLicense(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Vehicle type</label>
              <select
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={regType}
                onChange={(e) => setRegType(e.target.value as DriverVehicle['vehicle_type'])}
              >
                <option value="bus">Bus</option>
                <option value="minibus">Minibus</option>
                <option value="taxi">Taxi</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Colour</label>
              <input
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                placeholder="White"
                value={regColor}
                onChange={(e) => setRegColor(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Total seats</label>
              <input
                type="number"
                min={1}
                max={80}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={regSeats}
                onChange={(e) => setRegSeats(Number(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Default route</label>
              <input
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                placeholder="Town Centre"
                value={regDestination}
                onChange={(e) => setRegDestination(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleRegister}
              disabled={registering || !regLicense.trim()}
            >
              {registering ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {registering ? 'Registering…' : 'Register Vehicle'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Peek content (vehicle status pill) ──────────────────────────────────────
  const peekContent = (
    <div className="h-full flex items-center gap-3">
      <div
        className={`h-3 w-3 rounded-full flex-none ${
          vehicle.is_active ? 'bg-status-available animate-pulse' : 'bg-muted'
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {vehicle.vehicle_type} • {vehicle.color}
        </p>
        <p className="font-semibold truncate">{vehicle.license_plate}</p>
      </div>
      <div className="flex-none flex items-center gap-2 sm:gap-3">
        <div className="text-right">
          <p className="text-lg leading-none font-bold">{vehicle.available_seats}</p>
          <p className="text-[10px] text-muted-foreground">seats</p>
        </div>
        <Button
          variant={vehicle.is_active ? 'destructive' : 'default'}
          size="sm"
          onClick={toggleOnline}
          disabled={gpsStatus === 'requesting'}
          className="rounded-full shadow-sm"
        >
          {gpsStatus === 'requesting' ? (
            <Loader2 className="h-3 w-3 animate-spin sm:mr-1.5" />
          ) : null}
          <span className="hidden sm:inline">
            {vehicle.is_active ? 'Go Offline' : 'Go Online'}
          </span>
          <span className="sm:hidden">
            {vehicle.is_active ? 'Off' : 'On'}
          </span>
        </Button>
      </div>
      <ChevronUp className="flex-none h-4 w-4 text-muted-foreground" />
    </div>
  );

  // ── Half content ───────────────────────────────────────────────────────────
  const halfContent = (
    <div className="space-y-2">
      {vehicle.is_active ? (
        <GpsStatusBadge status={gpsStatus} lastUpdated={lastUpdated} />
      ) : null}
      <QuickControls
        role="driver"
        availableSeats={vehicle.available_seats}
        totalSeats={vehicle.total_seats}
        onSeatChange={updateAvailableSeats}
        vehicleDestination={vehicle.destination}
        onVehicleDestinationChange={updateDestination}
      />
      {pins.myPins.length > 0 ? (
        <div className="border-t border-border pt-2 mt-2">
          <DriverPinSender
            destination={vehicle.destination}
            driverLat={latestPosRef.current.lat}
            driverLng={latestPosRef.current.lng}
            onSendPin={pins.sendPin}
            myPins={pins.myPins}
            responses={pins.responses}
            onDeactivatePin={pins.deactivatePin}
          />
        </div>
      ) : null}
    </div>
  );

  // ── Expanded content ───────────────────────────────────────────────────────
  const expandedContent = (
    <div className="space-y-3 pt-1">
      {pins.myPins.length === 0 ? (
        <DriverPinSender
          destination={vehicle.destination}
          driverLat={latestPosRef.current.lat}
          driverLng={latestPosRef.current.lng}
          onSendPin={pins.sendPin}
          myPins={pins.myPins}
          responses={pins.responses}
          onDeactivatePin={pins.deactivatePin}
        />
      ) : null}
      <StatsBar
        vehicles={vehicles}
        commuters={filteredCommuters as Commuter[]}
        selectedDestination={vehicle.destination || null}
      />
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => setProfileOpen(true)}>
          <UserIcon className="mr-1.5 h-4 w-4" /> Profile
        </Button>
        <Button variant="outline" onClick={() => { refetchVehicles(); refetchCommuters(); }}>
          <Radio className="mr-1.5 h-4 w-4" /> Refresh
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full relative">
      {/* Map always fills viewport — never an image, always interactive */}
      <div className="absolute inset-0 z-0">
        <TransitMap
          vehicles={vehicles}
          commuters={filteredCommuters as Commuter[]}
          role="driver"
          selectedDestination={vehicle.destination || null}
          mapHandle={(h) => (mapHandleRef.current = h)}
          onCommuterSelect={handleCommuterSelect}
        />
      </div>

      <MapBottomSheet
        peekContent={peekContent}
        halfContent={halfContent}
        expandedContent={expandedContent}
        bottomInset={NAV_HEIGHT}
        initialSnap="peek"
        zIndex={40}
      />

      {/* Commuter detail drawer — sits on top of everything */}
      <Drawer
        open={!!selectedCommuter}
        onOpenChange={(open) => !open && setSelectedCommuter(null)}
      >
        <DrawerContent className="rounded-t-2xl border-0 bg-background/95 backdrop-blur-xl max-h-[85vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Commuter details</DrawerTitle>
            <DrawerDescription>{selectedCommuter?.name || ''}</DrawerDescription>
          </DrawerHeader>
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted" />
          {selectedCommuter ? (
            <div className="px-4 pb-4 pt-2">
              <div className="flex justify-end mb-1">
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <X size={16} />
                  </Button>
                </DrawerClose>
              </div>
              <CommuterCard
                commuter={selectedCommuter as CommuterWithAppearance}
                onClose={() => setSelectedCommuter(null)}
              />
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
};

export default DriverDashboard;
