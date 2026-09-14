// TRANSIT Type Definitions

export type VehicleType = 'bus' | 'minibus' | 'taxi';

export type VehicleStatus = 'available' | 'few-seats' | 'full';

export interface Vehicle {
  id: string;
  type: VehicleType;
  licensePlate: string;
  color: string;
  destination: string;
  currentLocation: {
    lat: number;
    lng: number;
  };
  totalSeats: number;
  availableSeats: number;
  status: VehicleStatus;
  driverName: string;
  heading: number; // Direction in degrees
  updatedAt?: string; // ISO timestamp from DB updated_at
}

export interface Commuter {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  destination: string;
  waitingTime: number; // in minutes
}

export type UserRole = 'commuter' | 'driver';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
