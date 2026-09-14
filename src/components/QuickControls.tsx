import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Minus, Plus, Users, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DESTINATIONS } from '@/data/mockData';

interface QuickControlsProps {
  role: 'commuter' | 'driver';
  // Commuter props
  destination?: string;
  onDestinationChange?: (dest: string) => void;
  isSharing?: boolean;
  onToggleSharing?: () => void;
  // Driver props
  availableSeats?: number;
  totalSeats?: number;
  onSeatChange?: (delta: number) => void;
  vehicleDestination?: string;
  onVehicleDestinationChange?: (dest: string) => void;
}

export const QuickControls: React.FC<QuickControlsProps> = ({
  role,
  destination,
  onDestinationChange,
  isSharing,
  onToggleSharing,
  availableSeats,
  totalSeats,
  onSeatChange,
  vehicleDestination,
  onVehicleDestinationChange,
}) => {
  if (role === 'commuter') {
    return (
      <motion.div
        className="bg-card/95 backdrop-blur-md rounded-2xl border border-border p-4 shadow-lg space-y-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Where to?</Label>
            <Select value={destination || ''} onValueChange={onDestinationChange}>
              <SelectTrigger className="h-9 border-0 bg-transparent p-0 text-base font-semibold shadow-none focus:ring-0">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {DESTINATIONS.map((dest) => (
                  <SelectItem key={dest} value={dest}>
                    {dest}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={onToggleSharing}
          variant={isSharing ? 'destructive' : 'default'}
          className="w-full h-11"
        >
          <Navigation className={`h-4 w-4 mr-2 ${isSharing ? 'animate-pulse' : ''}`} />
          {isSharing ? 'Stop Sharing Location' : 'Share My Location'}
        </Button>
      </motion.div>
    );
  }

  // Driver controls
  return (
    <motion.div
      className="bg-card/95 backdrop-blur-md rounded-2xl border border-border p-4 shadow-lg space-y-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Destination */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Route</Label>
          <Select value={vehicleDestination || ''} onValueChange={onVehicleDestinationChange}>
            <SelectTrigger className="h-9 border-0 bg-transparent p-0 text-base font-semibold shadow-none focus:ring-0">
              <SelectValue placeholder="Select route" />
            </SelectTrigger>
            <SelectContent>
              {DESTINATIONS.map((dest) => (
                <SelectItem key={dest} value={dest}>
                  {dest}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Seats control */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/30 text-secondary-foreground">
          <Users className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Available Seats</Label>
          <div className="flex items-center gap-3 mt-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onSeatChange?.(-1)}
              disabled={availableSeats === 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex-1 text-center">
              <span className="text-xl font-bold">{availableSeats}</span>
              <span className="text-muted-foreground text-sm"> / {totalSeats}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onSeatChange?.(1)}
              disabled={availableSeats === totalSeats}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuickControls;
