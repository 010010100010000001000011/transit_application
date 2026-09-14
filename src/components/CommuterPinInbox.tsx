import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Check, X, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PinMessage } from '@/hooks/usePinMessages';

interface CommuterPinInboxProps {
  pins: PinMessage[];
  respondedPinIds: Set<string>;
  onRespond: (pinId: string, response: 'yes' | 'no') => Promise<{ error: Error | null }>;
}

const CommuterPinInbox: React.FC<CommuterPinInboxProps> = ({
  pins,
  respondedPinIds,
  onRespond,
}) => {
  const { toast } = useToast();

  const handleRespond = async (pinId: string, response: 'yes' | 'no') => {
    const { error } = await onRespond(pinId, response);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else if (response === 'yes') {
      toast({
        title: '✅ Driver notified!',
        description: 'Your location is visible to this driver.',
      });
    }
  };

  const unrepliedPins = pins.filter((p) => !respondedPinIds.has(p.id));

  if (unrepliedPins.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {unrepliedPins.map((pin, index) => {
          const timeDiff = Math.floor((Date.now() - new Date(pin.created_at).getTime()) / 60000);

          return (
            <motion.div
              key={pin.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-xl border-2 border-primary/30 p-4 transit-shadow-card"
            >
              {/* Pin header */}
              <div className="flex items-start gap-3">
                <motion.div
                  className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Navigation className="h-5 w-5 text-primary" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{pin.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Driver heading to {pin.destination} • {timeDiff < 1 ? 'Just now' : `${timeDiff}m ago`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Response buttons */}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => handleRespond(pin.id, 'yes')}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Yes, I'm interested
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-9"
                  onClick={() => handleRespond(pin.id, 'no')}
                >
                  <X className="h-4 w-4 mr-1" />
                  No thanks
                </Button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default CommuterPinInbox;
