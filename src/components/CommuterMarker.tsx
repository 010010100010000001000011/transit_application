import React from 'react';
import { motion } from 'framer-motion';
import { Commuter } from '@/types/transit';
import { CommuterIcon } from './icons/VehicleIcons';
import { cn } from '@/lib/utils';

interface CommuterMarkerProps {
  commuter: Commuter;
  isSelected?: boolean;
  onClick?: () => void;
}

export const CommuterMarker: React.FC<CommuterMarkerProps> = ({
  commuter,
  isSelected,
  onClick,
}) => {
  return (
    <motion.div
      className="relative cursor-pointer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Waiting pulse */}
      <motion.div
        className="absolute inset-0 rounded-full bg-accent/30"
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      
      {/* Main marker */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full p-2 shadow-lg transition-all duration-200',
          isSelected
            ? 'bg-accent text-accent-foreground ring-4 ring-secondary'
            : 'bg-card text-accent border-2 border-accent/30'
        )}
      >
        <CommuterIcon size={20} />
      </div>
      
      {/* Waiting time badge */}
      <div className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-accent-foreground shadow-md">
        {commuter.waitingTime}m
      </div>
    </motion.div>
  );
};

export default CommuterMarker;
