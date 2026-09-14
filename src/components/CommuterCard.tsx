import React from 'react';
import { motion } from 'framer-motion';
import { Commuter } from '@/types/transit';
import { CommuterIcon } from './icons/VehicleIcons';
import { Button } from './ui/button';
import { MapPin, Clock, Navigation, Shirt } from 'lucide-react';

interface CommuterWithAppearance extends Commuter {
  shirtColor?: string;
  trouserColor?: string;
}

interface CommuterCardProps {
  commuter: CommuterWithAppearance;
  onClose?: () => void;
  onPickup?: () => void;
}

export const CommuterCard: React.FC<CommuterCardProps> = ({
  commuter,
  onClose,
  onPickup,
}) => {
  return (
    <motion.div
      className="w-full max-w-sm overflow-hidden rounded-2xl bg-card shadow-xl border border-border"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="relative flex items-center gap-4 p-4 bg-accent text-accent-foreground">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-foreground/20 backdrop-blur-sm">
          <CommuterIcon size={32} className="text-accent-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold">{commuter.name}</h3>
          <p className="text-sm text-accent-foreground/80">Waiting for transport</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent-foreground/20 text-accent-foreground/80 transition-colors hover:bg-accent-foreground/30 hover:text-accent-foreground"
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
            <p className="font-semibold text-foreground">{commuter.destination}</p>
          </div>
        </div>
        
        {/* Waiting time */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Waiting</p>
            <p className="font-semibold text-foreground">{commuter.waitingTime} min</p>
          </div>
        </div>

        {/* Appearance details */}
        {(commuter.shirtColor || commuter.trouserColor) && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shirt size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Appearance</p>
              <p className="font-semibold text-foreground">
                {commuter.shirtColor && `${commuter.shirtColor} shirt`}
                {commuter.shirtColor && commuter.trouserColor && ', '}
                {commuter.trouserColor && `${commuter.trouserColor} trousers`}
              </p>
            </div>
          </div>
        )}
        
        {/* Action button */}
        {onPickup && (
          <Button
            variant="default"
            size="lg"
            className="w-full"
            onClick={onPickup}
          >
            <Navigation size={18} />
            Navigate to Pickup
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default CommuterCard;
