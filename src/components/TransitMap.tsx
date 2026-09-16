// TRANSIT Map Component - Using plain Leaflet for React 18 compatibility
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { Vehicle, Commuter, UserRole } from '@/types/transit';
import { KITWE_CENTER } from '@/data/mockData';
import { Locate } from 'lucide-react';
import { Button } from './ui/button';

import 'leaflet/dist/leaflet.css';

// Fix default marker icons under Vite/webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ── smooth marker animation ───────────────────────────────────────────────────
const ANIMATION_DURATION_MS = 600;
const animationFrames = new Map<string, number>();

function animateMarker(
  markerId: string,
  marker: L.Marker,
  targetLat: number,
  targetLng: number,
) {
  const existing = animationFrames.get(markerId);
  if (existing !== undefined) {
    cancelAnimationFrame(existing);
    animationFrames.delete(markerId);
  }

  const start = marker.getLatLng();
  const dLat = targetLat - start.lat;
  const dLng = targetLng - start.lng;

  if (Math.abs(dLat) < 1e-9 && Math.abs(dLng) < 1e-9) return;

  const startTime = performance.now();

  function step(now: number) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    marker.setLatLng([start.lat + dLat * ease, start.lng + dLng * ease]);
    if (t < 1) {
      animationFrames.set(markerId, requestAnimationFrame(step));
    } else {
      animationFrames.delete(markerId);
    }
  }

  animationFrames.set(markerId, requestAnimationFrame(step));
}

// ── staleness helpers (Issue #2D: 90s dim, 3min remove) ──────────────────────
const DIM_AFTER_MS = 90_000;   // 1.5 min — translucent, grey, ⏸ badge
const REMOVE_AFTER_MS = 180_000; // 3 min — evict completely (polling + realtime also catch this)

function ageSeconds(updatedAt?: string): number {
  if (!updatedAt) return 0;
  return (Date.now() - new Date(updatedAt).getTime()) / 1000;
}

// Commuters don't have updatedAt on the Commuter type directly but the hook
// computes waitingTime as minutes since updated_at. Convert that to ms.
function commuterAgeMs(commuter: Commuter): number {
  return (commuter.waitingTime || 0) * 60_000;
}

export type MarkerLiveness = 'fresh' | 'stale' | 'dead';

function vehicleLiveness(v: Vehicle): MarkerLiveness {
  const sec = ageSeconds(v.updatedAt);
  if (sec > REMOVE_AFTER_MS / 1000) return 'dead';
  if (sec > DIM_AFTER_MS / 1000) return 'stale';
  return 'fresh';
}

function commuterLiveness(c: Commuter): MarkerLiveness {
  const ms = commuterAgeMs(c);
  if (ms > REMOVE_AFTER_MS) return 'dead';
  if (ms > DIM_AFTER_MS) return 'stale';
  return 'fresh';
}

// ── icon creators ─────────────────────────────────────────────────────────────

const createVehicleIcon = (
  vehicle: Vehicle,
  isSelected: boolean,
  isTracked: boolean,
  liveness: MarkerLiveness,
) => {
  const isStale = liveness === 'stale';

  const bgColor = isSelected || isTracked ? '#1d6b45' : isStale ? '#e5e7eb' : '#ffffff';
  const iconColor = isSelected || isTracked ? '#ffffff' : isStale ? '#9ca3af' : '#1d6b45';
  const borderColor = isTracked
    ? '#f59e0b'
    : isSelected
    ? '#f59e0b'
    : isStale
    ? 'rgba(156,163,175,0.5)'
    : 'rgba(29,107,69,0.3)';

  let statusColor: string;
  if (isStale) {
    statusColor = '#9ca3af';
  } else {
    statusColor =
      vehicle.status === 'available'
        ? '#22c55e'
        : vehicle.status === 'few-seats'
        ? '#eab308'
        : '#ef4444';
  }

  const iconSize = vehicle.type === 'bus' ? 48 : vehicle.type === 'minibus' ? 44 : 40;
  const opacity = isStale ? 0.55 : 1;
  const saturate = isStale ? 'saturate(0.15)' : 'none';

  const vehicleSvg =
    vehicle.type === 'bus'
      ? `<svg viewBox="0 0 24 24" fill="${iconColor}"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>`
      : vehicle.type === 'minibus'
      ? `<svg viewBox="0 0 24 24" fill="${iconColor}"><path d="M17 5H3c-1.1 0-2 .9-2 2v9h2c0 1.65 1.35 3 3 3s3-1.35 3-3h5c0 1.65 1.35 3 3 3s3-1.35 3-3h2v-5l-3-4-2-2zM6 17.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V8.5h2.5zM18 17.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="${iconColor}"><path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/></svg>`;

  const trackingRing = isTracked
    ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:2px dashed #f59e0b;animation:spin 4s linear infinite;pointer-events:none;"></div>`
    : '';

  const staleBadge = isStale
    ? `<div style="position:absolute;top:-12px;left:-8px;min-width:20px;height:20px;background:#6b7280;color:#fff;font-size:9.5px;font-weight:600;display:flex;align-items:center;justify-content:center;border-radius:9999px;padding:0 5px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.2);">⏸</div>`
    : '';

  const html = `
    <div class="vehicle-marker-wrapper" style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${iconSize}px;
      height: ${iconSize}px;
      background: ${bgColor};
      border: 3px solid ${borderColor};
      border-radius: 50%;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.3s ease;
      opacity: ${opacity};
      filter: ${saturate};
    ">
      ${trackingRing}
      ${staleBadge}
      <div style="width:${iconSize * 0.55}px;height:${iconSize * 0.55}px;">${vehicleSvg}</div>
      <div style="
        position: absolute; bottom: -4px; right: -4px;
        width: 16px; height: 16px;
        background: ${statusColor};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      "></div>
      ${vehicle.status !== 'full' ? `
        <div style="
          position: absolute; top: -8px; right: -8px;
          min-width: 22px; height: 22px;
          background: linear-gradient(135deg,${isStale ? '#9ca3af,#6b7280' : '#f59e0b,#f97316'});
          color: white; font-size: 11px; font-weight: bold;
          display: flex; align-items: center; justify-content: center;
          border-radius: 9999px; padding: 0 5px;
          box-shadow: 0 2px 6px rgba(245,158,11,0.4);
        ">${vehicle.availableSeats}</div>
      ` : ''}
    </div>`;

  return L.divIcon({
    html,
    className: 'custom-vehicle-marker',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
  });
};

const createCommuterIcon = (commuter: Commuter, isSelected: boolean, liveness: MarkerLiveness) => {
  const isStale = liveness === 'stale';
  const bgColor = isSelected ? '#f97316' : isStale ? '#e5e7eb' : '#ffffff';
  const iconColor = isSelected ? '#ffffff' : isStale ? '#9ca3af' : '#f97316';
  const opacity = isStale ? 0.55 : 1;
  const saturate = isStale ? 'saturate(0.15)' : 'none';

  const staleBadge = isStale
    ? `<div style="position:absolute;top:-10px;left:-10px;min-width:20px;height:20px;background:#6b7280;color:#fff;font-size:9.5px;font-weight:600;display:flex;align-items:center;justify-content:center;border-radius:9999px;padding:0 5px;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.2);">⏸</div>`
    : '';

  const html = `
    <div class="commuter-marker-wrapper" style="
      position: relative; display: flex;
      align-items: center; justify-content: center;
      width: 42px; height: 42px;
      background: ${bgColor};
      border: 3px solid ${isSelected ? '#f59e0b' : isStale ? 'rgba(156,163,175,0.5)' : 'rgba(249,115,22,0.3)'};
      border-radius: 50%;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      cursor: pointer; transition: transform 0.2s ease, opacity 0.3s ease;
      opacity: ${opacity};
      filter: ${saturate};
    ">
      ${staleBadge}
      <svg width="22" height="22" viewBox="0 0 24 24" fill="${iconColor}">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
      </svg>
      <div style="
        position: absolute; top: -8px; right: -8px;
        min-width: 22px; height: 22px;
        background: linear-gradient(135deg,${isStale ? '#9ca3af,#6b7280' : '#f97316,#ea580c'});
        color: white; font-size: 10px; font-weight: bold;
        display: flex; align-items: center; justify-content: center;
        border-radius: 9999px; padding: 0 5px;
        box-shadow: 0 2px 6px rgba(249,115,22,0.4);
      ">${commuter.waitingTime}m</div>
    </div>`;

  return L.divIcon({
    html,
    className: 'custom-commuter-marker',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
};

const createSmallVehicleIcon = (liveness: MarkerLiveness) => {
  const isStale = liveness === 'stale';
  return L.divIcon({
    html: `<div style="
      width:14px;height:14px;
      background:linear-gradient(135deg,${isStale ? 'rgba(156,163,175,0.7)' : 'rgba(29,107,69,0.8)'},${isStale ? 'rgba(107,114,128,0.5)' : 'rgba(29,107,69,0.6)'});
      border:2px solid white;border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.2);
      opacity:${isStale ? 0.5 : 1};
    "></div>`,
    className: 'small-vehicle-marker',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

// ── spinning keyframes injected once ─────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('transit-map-styles')) {
  const style = document.createElement('style');
  style.id = 'transit-map-styles';
  style.textContent = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .leaflet-container {
      touch-action: none;
    }

    .leaflet-map-pane,
    .leaflet-tile-pane,
    .leaflet-objects-pane {
      touch-action: none;
    }

    .transit-map-mount {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      min-height: 100%;
      min-width: 100%;
    }
  `;
  document.head.appendChild(style);
}

// ── component ─────────────────────────────────────────────────────────────────

export interface PanToSafeCenterOptions {
  /** Height (in px) of the UI element(s) covering the BOTTOM of the map.
   *  The target marker will be panned to the VERTICAL CENTER of the
   *  remaining (uncovered) area so no sheet obscures it. */
  bottomCoverHeight?: number;
  /** Desired zoom when panning. If undefined, uses current zoom. */
  zoom?: number;
}

export interface TransitMapHandle {
  /** Pan the map so a given (lat, lng) lands in the "uncovered" center. */
  panToSafeCenter: (lat: number, lng: number, opts?: PanToSafeCenterOptions) => void;
  /** Get current map ref for advanced operations. */
  getMap: () => L.Map | null;
  /** Programmatically deselect any selected marker. */
  clearSelection: () => void;
}

interface TransitMapProps {
  vehicles: Vehicle[];
  commuters: Commuter[];
  role: UserRole;
  selectedDestination: string | null;
  /** When a marker is tapped/clicked, the PARENT is responsible for opening
   *  the detail sheet and calling `panToSafeCenter`. mapHandle lets parent do this. */
  onVehicleSelect?: (vehicle: Vehicle | null) => void;
  onCommuterSelect?: (commuter: Commuter | null) => void;
  /** Ref callback: parent can use the map handle to pan/zoom on marker select. */
  mapHandle?: (handle: TransitMapHandle) => void;
}

export const TransitMap: React.FC<TransitMapProps> = ({
  vehicles,
  commuters,
  role,
  selectedDestination,
  onVehicleSelect,
  onCommuterSelect,
  mapHandle,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedCommuter, setSelectedCommuter] = useState<Commuter | null>(null);
  const [trackedVehicleId, setTrackedVehicleId] = useState<string | null>(null);
  // Local "now" ticker so staleness recalculates every 15s even without realtime.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  // ── filtered + liveness-filtered lists ─────────────────────────────────────
  const filteredVehicles = useMemo(() => {
    const active = vehicles
      .filter((v) => v.status !== 'full' || selectedDestination)
      // Staleness evictor: DEAD vehicles are removed from render list.
      .filter((v) => vehicleLiveness(v) !== 'dead');
    if (!selectedDestination) return active;
    return active.filter((v) =>
      v.destination.toLowerCase().includes(selectedDestination.toLowerCase()),
    );
  }, [vehicles, selectedDestination]);

  const filteredCommuters = useMemo(() => {
    const active = commuters.filter((c) => commuterLiveness(c) !== 'dead');
    if (!selectedDestination) return active;
    return active.filter((c) =>
      c.destination.toLowerCase().includes(selectedDestination.toLowerCase()),
    );
  }, [commuters, selectedDestination]);

  // ── map handle (exposed to parent) ─────────────────────────────────────────
  useEffect(() => {
    if (!mapHandle) return;
    mapHandle({
      panToSafeCenter: (lat, lng, opts = {}) => {
        if (!mapRef.current || !mapContainerRef.current) return;
        const map = mapRef.current;
        const containerH = mapContainerRef.current.clientHeight;
        const { bottomCoverHeight = 0, zoom } = opts;
        const visibleH = Math.max(200, containerH - bottomCoverHeight);
        // Target y: center of the visible area. Since Leaflet pans in LatLng,
        // we translate the (lat,lng) upward in screen space by (visibleH/2 - containerH/2)
        const targetScreenY = bottomCoverHeight + visibleH / 2;
        const currentCenterScreen = containerH / 2;
        const deltaPx = currentCenterScreen - targetScreenY;
        // 1 px vertically ≈ how many degrees of latitude? Convert via bounds.
        const bounds = map.getBounds();
        const degPerPxLat = (bounds.getNorth() - bounds.getSouth()) / Math.max(1, containerH);
        const targetLat = lat + deltaPx * degPerPxLat;

        if (zoom !== undefined) {
          map.flyTo([targetLat, lng], zoom, { duration: 0.6 });
        } else {
          map.flyTo([targetLat, lng], { duration: 0.5 });
        }
      },
      getMap: () => mapRef.current,
      clearSelection: () => {
        setSelectedVehicle(null);
        setSelectedCommuter(null);
      },
    });
    // mapHandle is a ref callback — intended to fire once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── initialise map ──────────────────────────────────────────────────────────
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [KITWE_CENTER.lat, KITWE_CENTER.lng],
      zoom: 14,
      minZoom: 3,
      maxZoom: 19,
      attributionControl: false,
      zoomControl: false,
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      tap: true,
      tapTolerance: 15,
      worldCopyJump: false,
      inertia: true,
      inertiaDeceleration: 3000,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      maxNativeZoom: 19,
      keepBuffer: 8,
      attribution: '&copy; OpenStreetMap contributors',
      subdomains: 'abc',
    }).addTo(map);

    mapRef.current = map;

    requestAnimationFrame(() => {
      map.invalidateSize(false);
      requestAnimationFrame(() => map.invalidateSize(false));
    });

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserverRef.current = new ResizeObserver(() => {
        mapRef.current?.invalidateSize(false);
      });
      resizeObserverRef.current.observe(mapContainerRef.current);
    }

    const onOrientationOrResize = () => mapRef.current?.invalidateSize(false);
    window.addEventListener('resize', onOrientationOrResize);
    window.addEventListener('orientationchange', onOrientationOrResize);

    return () => {
      window.removeEventListener('resize', onOrientationOrResize);
      window.removeEventListener('orientationchange', onOrientationOrResize);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      animationFrames.forEach((id) => cancelAnimationFrame(id));
      animationFrames.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── follow tracked vehicle ──────────────────────────────────────────────────
  useEffect(() => {
    if (!trackedVehicleId || !mapRef.current) return;
    const tracked = vehicles.find((v) => v.id === trackedVehicleId);
    if (tracked) {
      mapRef.current.panTo(
        [tracked.currentLocation.lat, tracked.currentLocation.lng],
        { animate: true, duration: 0.5 },
      );
    }
  }, [trackedVehicleId, vehicles]);

  // ── update / animate markers ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    const currentMarkerIds = new Set<string>();

    // BOTH roles see active vehicles and active commuters.
    // Commuters get full vehicle icons (tappable for details).
    // Drivers get full commuter icons (tappable) + smaller vehicle dots for context.

    // ── Vehicles ────────────────────────────────────────────────────────────
    filteredVehicles.forEach((vehicle) => {
      // Commuter role: full vehicle icons, high z-index, tappable → VehicleCard
      // Driver role: small dots only (context), not tappable
      const useFullIcon = role === 'commuter';
      const markerId = useFullIcon ? `vehicle-${vehicle.id}` : `small-vehicle-${vehicle.id}`;
      currentMarkerIds.add(markerId);

      const isSelected = selectedVehicle?.id === vehicle.id;
      const isTracked = trackedVehicleId === vehicle.id;
      const lv = vehicleLiveness(vehicle);
      const newLat = vehicle.currentLocation.lat;
      const newLng = vehicle.currentLocation.lng;
      const existingMarker = markersRef.current.get(markerId);

      const icon = useFullIcon
        ? createVehicleIcon(vehicle, isSelected, isTracked, lv)
        : createSmallVehicleIcon(lv);

      // Prefer vehicle hits when a commuter pin is nearby (commuter map)
      const zIndexOffset = useFullIcon ? 1000 : 100;

      const bindVehicleClick = (marker: L.Marker) => {
        marker.off('click');
        if (!useFullIcon) return;
        marker.on('click', () => {
          setSelectedVehicle(vehicle);
          setSelectedCommuter(null);
          setTrackedVehicleId(null);
          onVehicleSelect?.(vehicle);
        });
      };

      if (existingMarker) {
        animateMarker(markerId, existingMarker, newLat, newLng);
        existingMarker.setIcon(icon);
        existingMarker.setZIndexOffset(zIndexOffset);
        bindVehicleClick(existingMarker);
      } else {
        const marker = L.marker([newLat, newLng], { icon, zIndexOffset }).addTo(mapRef.current!);
        bindVehicleClick(marker);
        markersRef.current.set(markerId, marker);
      }
    });

    // Commuters:
    // Driver role → full icons, high z-index, tappable → CommuterCard
    // Commuter role → visible for context but NOT tappable (prevents opening
    // CommuterCard when the user meant to tap a nearby vehicle / driver)
    filteredCommuters.forEach((commuter) => {
      const markerId = `commuter-${commuter.id}`;
      currentMarkerIds.add(markerId);

      const isSelected = selectedCommuter?.id === commuter.id;
      const lv = commuterLiveness(commuter);
      const newLat = commuter.location.lat;
      const newLng = commuter.location.lng;
      const existingMarker = markersRef.current.get(markerId);
      const icon = createCommuterIcon(commuter, isSelected, lv);

      const commuterInteractive = role === 'driver';
      const zIndexOffset = commuterInteractive ? 1000 : 200;

      const bindCommuterClick = (marker: L.Marker) => {
        marker.off('click');
        if (!commuterInteractive) return;
        marker.on('click', () => {
          setSelectedCommuter(commuter);
          setSelectedVehicle(null);
          onCommuterSelect?.(commuter);
        });
      };

      if (existingMarker) {
        animateMarker(markerId, existingMarker, newLat, newLng);
        existingMarker.setIcon(icon);
        existingMarker.setZIndexOffset(zIndexOffset);
        bindCommuterClick(existingMarker);
      } else {
        const marker = L.marker([newLat, newLng], { icon, zIndexOffset }).addTo(mapRef.current!);
        bindCommuterClick(marker);
        markersRef.current.set(markerId, marker);
      }
    });

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        const frameId = animationFrames.get(id);
        if (frameId !== undefined) {
          cancelAnimationFrame(frameId);
          animationFrames.delete(id);
        }
        marker.remove();
        markersRef.current.delete(id);
      }
    });
  }, [
    role,
    filteredVehicles,
    filteredCommuters,
    selectedVehicle,
    selectedCommuter,
    trackedVehicleId,
    onVehicleSelect,
    onCommuterSelect,
  ]);

  // Keep selected vehicle data fresh
  useEffect(() => {
    if (!selectedVehicle) return;
    const fresh = vehicles.find((v) => v.id === selectedVehicle.id);
    if (fresh) setSelectedVehicle(fresh);
  }, [vehicles, selectedVehicle]);

  // ── recenter ────────────────────────────────────────────────────────────────
  const handleRecenter = useCallback(() => {
    setTrackedVehicleId(null);
    mapRef.current?.flyTo([KITWE_CENTER.lat, KITWE_CENTER.lng], 14, { duration: 0.5 });
  }, []);

  // ── track handler ───────────────────────────────────────────────────────────
  const handleTrack = useCallback((vehicle: Vehicle) => {
    setTrackedVehicleId((prev) => (prev === vehicle.id ? null : vehicle.id));
    mapRef.current?.flyTo(
      [vehicle.currentLocation.lat, vehicle.currentLocation.lng],
      16,
      { duration: 0.6 },
    );
  }, []);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="transit-map-mount" />

      {/* Map controls — floating right-edge, safe from sheet overlap at peek */}
      <div className="absolute bottom-4 right-2 sm:right-4 z-[1000] flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-xl shadow-lg bg-card/95 backdrop-blur-sm border border-border text-lg font-bold"
          onClick={() => mapRef.current?.zoomIn()}
          aria-label="Zoom in"
        >
          +
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-xl shadow-lg bg-card/95 backdrop-blur-sm border border-border text-lg font-bold"
          onClick={() => mapRef.current?.zoomOut()}
          aria-label="Zoom out"
        >
          −
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-xl shadow-lg bg-card/95 backdrop-blur-sm border border-border"
          onClick={handleRecenter}
          aria-label="Recenter map"
        >
          <Locate size={18} />
        </Button>
      </div>

      {/* Legend — top-left, padding scales with breakpoint */}
      <motion.div
        className="absolute top-2 left-2 sm:top-4 sm:left-4 z-[1000] bg-card/95 backdrop-blur-sm rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 shadow-lg border border-border"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-status-available" />
            <span>Vehicles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-accent" style={{ background: '#f97316' }} />
            <span>Commuters</span>
          </div>
        </div>
      </motion.div>

      {/* Detail sheet rendering lives in the dashboard parent (uses vaul Drawer). */}
    </div>
  );
};

export default TransitMap;
