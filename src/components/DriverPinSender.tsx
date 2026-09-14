import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Send, X, CheckCircle2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PinMessage, PinResponse } from '@/hooks/usePinMessages';

interface DriverPinSenderProps {
  destination: string;
  driverLat: number;
  driverLng: number;
  onSendPin: (destination: string, message: string, lat: number, lng: number) => Promise<{ error: Error | null }>;
  myPins: PinMessage[];
  responses: PinResponse[];
  onDeactivatePin: (pinId: string) => void;
}

const DriverPinSender: React.FC<DriverPinSenderProps> = ({
  destination,
  driverLat,
  driverLng,
  onSendPin,
  myPins,
  responses,
  onDeactivatePin,
}) => {
  const { toast } = useToast();
  const [message, setMessage] = useState(`Heading to ${destination}?`);
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSend = async () => {
    if (!destination) {
      toast({ variant: 'destructive', title: 'Set a destination first' });
      return;
    }

    setSending(true);
    const { error } = await onSendPin(destination, message, driverLat, driverLng);
    setSending(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to send', description: error.message });
    } else {
      toast({ title: '📍 Pin sent!', description: `Notified commuters heading to ${destination}` });
      setMessage(`Heading to ${destination}?`);
    }
  };

  const yesCount = (pinId: string) => responses.filter((r) => r.pin_message_id === pinId && r.response === 'yes').length;
  const noCount = (pinId: string) => responses.filter((r) => r.pin_message_id === pinId && r.response === 'no').length;

  return (
    <div className="space-y-3">
      {/* Send Pin Button / Form */}
      <motion.div
        className="bg-card rounded-xl border border-border p-3 transit-shadow-card"
        layout
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Pin Message</p>
              <p className="text-xs text-muted-foreground">Notify commuters on your route</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {myPins.length} active
          </Badge>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3">
                {destination ? (
                  <>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>Sending to commuters heading to <span className="font-semibold text-foreground">{destination}</span></span>
                    </div>
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Your message..."
                      maxLength={100}
                      className="h-10"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={sending || !message.trim()}
                      className="w-full h-10"
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {sending ? 'Sending...' : 'Send Pin'}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Set your destination first to send a pin.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Active Pins with Responses */}
      <AnimatePresence>
        {myPins.map((pin) => (
          <motion.div
            key={pin.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="bg-card rounded-xl border border-border p-3 transit-shadow-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">{pin.message}</p>
                  <p className="text-xs text-muted-foreground">→ {pin.destination}</p>
                </div>
              </div>
              <button onClick={() => onDeactivatePin(pin.id)}>
                <X className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-status-available" />
                <span className="text-xs font-semibold">{yesCount(pin.id)} interested</span>
              </div>
              <div className="flex items-center gap-1">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{noCount(pin.id)} passed</span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default DriverPinSender;
