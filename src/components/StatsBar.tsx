import React from 'react';
import { motion } from 'framer-motion';
import { Bus, Users, MapPin } from 'lucide-react';
import { Vehicle, Commuter } from '@/types/transit';

interface StatsBarProps {
  vehicles: Vehicle[];
  commuters: Commuter[];
  selectedDestination: string | null;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  vehicles,
  commuters,
  selectedDestination,
}) => {
  const availableVehicles = vehicles.filter((v) => v.status !== 'full').length;
  const totalSeats = vehicles.reduce((acc, v) => acc + v.availableSeats, 0);

  return (
    <motion.div
      className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex shrink-0 items-center gap-2 rounded-xl bg-card px-4 py-2.5 shadow-md border border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bus size={16} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Vehicles</p>
          <p className="text-sm font-bold text-foreground">
            {availableVehicles}{' '}
            <span className="font-normal text-muted-foreground">available</span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 rounded-xl bg-card px-4 py-2.5 shadow-md border border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/30 text-transit-gold">
          <Users size={16} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Seats</p>
          <p className="text-sm font-bold text-foreground">
            {totalSeats}{' '}
            <span className="font-normal text-muted-foreground">open</span>
          </p>
        </div>
      </div>

      {selectedDestination && (
        <div className="flex shrink-0 items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 shadow-md border border-primary/20">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <MapPin size={16} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Filtered</p>
            <p className="text-sm font-bold text-primary">{selectedDestination}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StatsBar;
