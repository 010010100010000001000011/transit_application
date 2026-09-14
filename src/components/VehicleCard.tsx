import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Vehicle } from '@/types/transit';
import { BusIcon, MinibusIcon, TaxiIcon } from './icons/VehicleIcons';
import { Button } from './ui/button';
import { MapPin, Users, Navigation, Crosshair, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClose?: () => void;
  onIntercept?: () => void;
  onTrack?: () => void;
}

const getVehicleIcon = (type: Vehicle['type']) => {
  switch (type) {
    case 'bus': return <BusIcon size={32} />;
    case 'minibus': return <MinibusIcon size={32} />;
    case 'taxi': return <TaxiIcon size={32} />;
  }
};

const getStatusLabel = (status: Vehicle['status']) => {
  switch (status) {
    case 'available': return 'Available';
    case 'few-seats': return 'Few Seats Left';
    case 'full': return 'Full';
  }
};

const getStatusBadgeClass = (status: Vehicle['status']) => {
  switch (status) {
    case 'available': return 'bg-status-available/15 text-status-available border-status-available/30';
    case 'few-seats': return 'bg-status-few-seats/15 text-status-few-seats border-status-few-seats/30';
    case 'full': return 'bg-status-full/15 text-status-full border-status-full/30';
  }
};

const getVehicleTypeLabel = (type: Vehicle['type']) => {
  switch (type) {
    case 'bus': return 'Bus';
    case 'minibus': return 'Minibus';
    case 'taxi': return 'Taxi';
  }
};

/** Human-readable staleness label */
function getFreshnessLabel(updatedAt?: string): { label: string; stale: boolean } {
  if (!updatedAt) return { label: 'Unknown', stale: false };
  const seconds = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000);
  if (seconds < 10) return { label: 'Just now', stale: false };
  if (seconds < 60) return { label: `${seconds}s ago`, stale: false };
  const minutes = Math.floor(seconds / 60);
  if (minutes < 5) return { label: `${minutes}m ago`, stale: false };
  return { label: `${minutes}m ago`, stale: true };
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onClose,
  onIntercept,
  onTrack,
}) => {
  // Tick every second so "X sec ago" stays live
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { label: freshnessLabel, stale } = getFreshnessLabel(vehicle.updatedAt);

  return (
    <motion.div
      className="w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-xl border border-border"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="relative flex items-center gap-4 p-4 transit-gradient-primary text-primary-foreground">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
          {getVehicleIcon(vehicle.type)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{vehicle.licensePlate}</h3>
            <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-medium">
              {getVehicleTypeLabel(vehicle.type)}
            </span>
          </div>
          <p className="text-sm text-primary-foreground/80">
            {vehicle.color} • {vehicle.driverName}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground/80 transition-colors hover:bg-primary-foreground/30"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Destination */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50 text-transit-gold">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Destination</p>
            <p className="font-semibold text-foreground">{vehicle.destination}</p>
          </div>
        </div>

        {/* Capacity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Users size={20} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Seats</p>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {vehicle.availableSeats} / {vehicle.totalSeats}
              </span>
              <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', getStatusBadgeClass(vehicle.status))}>
                {getStatusLabel(vehicle.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn(
              'h-full rounded-full',
              vehicle.status === 'available' ? 'bg-status-available'
              : vehicle.status === 'few-seats' ? 'bg-status-few-seats'
              : 'bg-status-full'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${((vehicle.totalSeats - vehicle.availableSeats) / vehicle.totalSeats) * 100}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>

        {/* Location freshness */}
        <div className={cn(
          'flex items-center gap-2 text-xs rounded-lg px-3 py-2',
          stale ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted text-muted-foreground'
        )}>
          {stale
            ? <AlertTriangle size={13} className="flex-shrink-0" />
            : <Clock size={13} className="flex-shrink-0" />}
          <span>
            {stale ? `⚠ Location updated ${freshnessLabel}` : `Updated ${freshnessLabel}`}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {onTrack && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={onTrack}
            >
              <Crosshair size={15} />
              Track
            </Button>
          )}
          {vehicle.status !== 'full' && onIntercept && (
            <Button
              variant="gold"
              size={onTrack ? 'sm' : 'lg'}
              className={cn('gap-1.5', onTrack ? 'flex-1' : 'w-full')}
              onClick={onIntercept}
            >
              <Navigation size={15} />
              Intercept
            </Button>
          )}
        </div>

        {vehicle.status === 'full' && (
          <div className="rounded-lg bg-status-full/10 p-3 text-center text-sm text-status-full">
            This vehicle is currently full
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VehicleCard;
