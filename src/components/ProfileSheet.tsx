import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, MapPin, Shirt, Car, Palette, Hash, Users, Save, X, Check, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DESTINATIONS } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

interface DriverVehicle {
  id: string;
  license_plate: string;
  vehicle_type: string;
  color: string;
  total_seats: number;
  destination: string | null;
}

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLOR_PRESETS = [
  { name: 'White', value: 'White' },
  { name: 'Black', value: 'Black' },
  { name: 'Blue', value: 'Blue' },
  { name: 'Red', value: 'Red' },
  { name: 'Green', value: 'Green' },
  { name: 'Yellow', value: 'Yellow' },
  { name: 'Orange', value: 'Orange' },
  { name: 'Purple', value: 'Purple' },
  { name: 'Pink', value: 'Pink' },
  { name: 'Grey', value: 'Grey' },
  { name: 'Brown', value: 'Brown' },
];

export const ProfileSheet: React.FC<ProfileSheetProps> = ({ open, onOpenChange }) => {
  const { profile, role, user, updateProfile } = useAuth();
  const { toast } = useToast();

  // Commuter fields
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [shirtColor, setShirtColor] = useState('');
  const [trouserColor, setTrouserColor] = useState('');

  // Driver fields
  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('minibus');
  const [vehicleColor, setVehicleColor] = useState('');
  const [totalSeats, setTotalSeats] = useState(14);
  const [vehicleDestination, setVehicleDestination] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setDestination(profile.destination || '');
      setShirtColor(profile.shirt_color || '');
      setTrouserColor(profile.trouser_color || '');
    }
  }, [profile]);

  // Load vehicle data for drivers
  useEffect(() => {
    const fetchVehicle = async () => {
      if (!user || role !== 'driver') return;
      
      const { data } = await supabase
        .from('vehicles')
        .select('*')
        .eq('driver_id', user.id)
        .single();

      if (data) {
        setVehicle(data as DriverVehicle);
        setLicensePlate(data.license_plate);
        setVehicleType(data.vehicle_type);
        setVehicleColor(data.color);
        setTotalSeats(data.total_seats);
        setVehicleDestination(data.destination || '');
      }
    };

    if (open) fetchVehicle();
  }, [user, role, open]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Update profile
      const { error: profileError } = await updateProfile({
        name,
        destination: role === 'commuter' ? destination : undefined,
        shirt_color: role === 'commuter' ? shirtColor : undefined,
        trouser_color: role === 'commuter' ? trouserColor : undefined,
      });

      if (profileError) throw profileError;

      // Update vehicle for drivers
      if (role === 'driver' && vehicle) {
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({
            license_plate: licensePlate,
            vehicle_type: vehicleType,
            color: vehicleColor,
            total_seats: totalSeats,
            destination: vehicleDestination,
          })
          .eq('id', vehicle.id);

        if (vehicleError) throw vehicleError;
      }

      setSaveSuccess(true);
      toast({
        title: 'Profile saved!',
        description: 'Your changes have been saved successfully.',
      });

      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="block">Edit Profile</span>
              <span className="text-xs font-normal text-muted-foreground capitalize">
                {role} account
              </span>
            </div>
          </SheetTitle>
          <SheetDescription>
            Update your personal information and preferences
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Avatar placeholder */}
          <motion.div 
            className="flex justify-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-3xl font-bold text-primary-foreground">
                {name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center shadow-md hover:bg-secondary/80 transition-colors">
                <Camera className="h-4 w-4 text-secondary-foreground" />
              </button>
            </div>
          </motion.div>

          {/* Basic info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Basic Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                value={profile?.email || ''}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>
          </div>

          {/* Commuter-specific fields */}
          {role === 'commuter' && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Travel Details
              </h3>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Default Destination
                </Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger>
                    <SelectValue placeholder="Where do you usually go?" />
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

              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider pt-2">
                Appearance (Helps drivers find you)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-muted-foreground" />
                    Shirt Color
                  </Label>
                  <Select value={shirtColor} onValueChange={setShirtColor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_PRESETS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full border"
                              style={{ 
                                backgroundColor: color.value.toLowerCase() === 'white' ? '#f8f8f8' : color.value.toLowerCase() 
                              }}
                            />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    Trouser Color
                  </Label>
                  <Select value={trouserColor} onValueChange={setTrouserColor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_PRESETS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full border"
                              style={{ 
                                backgroundColor: color.value.toLowerCase() === 'white' ? '#f8f8f8' : color.value.toLowerCase() 
                              }}
                            />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Driver-specific fields */}
          {role === 'driver' && vehicle && (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Vehicle Details
              </h3>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  License Plate
                </Label>
                <Input
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC 1234"
                  className="uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    Vehicle Type
                  </Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minibus">Minibus</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="taxi">Taxi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    Vehicle Color
                  </Label>
                  <Select value={vehicleColor} onValueChange={setVehicleColor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_PRESETS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full border"
                              style={{ 
                                backgroundColor: color.value.toLowerCase() === 'white' ? '#f8f8f8' : color.value.toLowerCase() 
                              }}
                            />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Total Seats
                  </Label>
                  <Input
                    type="number"
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(parseInt(e.target.value) || 14)}
                    min={1}
                    max={60}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Route/Destination
                  </Label>
                  <Select value={vehicleDestination} onValueChange={setVehicleDestination}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
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
            </motion.div>
          )}

          {/* Save Button */}
          <motion.div 
            className="pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-12 text-base font-semibold"
              variant={saveSuccess ? 'default' : 'default'}
            >
              <AnimatePresence mode="wait">
                {isSaving ? (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </motion.div>
                ) : saveSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-5 w-5" />
                    Saved!
                  </motion.div>
                ) : (
                  <motion.div
                    key="save"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-5 w-5" />
                    Save Changes
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileSheet;
