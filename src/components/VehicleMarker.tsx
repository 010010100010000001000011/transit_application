import React from 'react';
import { motion } from 'framer-motion';
import { Vehicle } from '@/types/transit';
import { BusIcon, MinibusIcon, TaxiIcon } from './icons/VehicleIcons';
import { cn } from '@/lib/utils';

interface VehicleMarkerProps {
  vehicle: Vehicle;
  isSelected?: boolean;
  onClick?: () => void;
}

const getVehicleIcon = (type: Vehicle['type'], size: number) => {
  switch (type) {
    case 'bus':
      return <BusIcon size={size} />;
    case 'minibus':
      return <MinibusIcon size={size} />;
    case 'taxi':
      return <TaxiIcon size={size} />;
  }
};

const getStatusColor = (status: Vehicle['status']) => {
  switch (status) {
    case 'available':
      return 'bg-status-available';
    case 'few-seats':
      return 'bg-status-few-seats';
    case 'full':
      return 'bg-status-full';
  }
};

export const VehicleMarker: React.FC<VehicleMarkerProps> = ({
  vehicle,
  isSelected,
  onClick,
}) => {
  const iconSize = vehicle.type === 'bus' ? 28 : vehicle.type === 'minibus' ? 24 : 22;

  return (
    <motion.div
      className="relative cursor-pointer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Pulse ring for available vehicles */}
      {vehicle.status === 'available' && (
        <motion.div
          className="absolute inset-0 rounded-full bg-status-available/30"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Main marker */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full p-2 shadow-lg transition-all duration-200',
          isSelected
            ? 'bg-primary text-primary-foreground ring-4 ring-secondary'
            : 'bg-card text-primary border-2 border-primary/20'
        )}
        style={{
          transform: `rotate(${vehicle.heading}deg)`,
        }}
      >
        <div style={{ transform: `rotate(-${vehicle.heading}deg)` }}>
          {getVehicleIcon(vehicle.type, iconSize)}
        </div>
      </div>
      
      {/* Status indicator dot */}
      <div
        className={cn(
          'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card shadow-sm',
          getStatusColor(vehicle.status)
        )}
      />
      
      {/* Seat count badge */}
      {vehicle.status !== 'full' && (
        <div className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-xs font-bold text-secondary-foreground shadow-md">
          {vehicle.availableSeats}
        </div>
      )}
    </motion.div>
  );
};

export default VehicleMarker;
