import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, MapPin, Clock, Gauge, Navigation, Laptop, Smartphone } from 'lucide-react';

interface GPSData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export const GPSDiagnosticPanel: React.FC = () => {
  const [gpsData, setGpsData] = useState<GPSData | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  // Detect device type
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  const startDiagnostic = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by browser');
      return;
    }

    setError(null);
    setIsActive(true);
    setUpdateCount(0);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setGpsData({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        });
        setUpdateCount((c) => c + 1);
        setError(null);
      },
      (err) => {
        setError(`Error: ${err.message} (Code: ${err.code})`);
        setIsActive(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 30000,
      }
    );

    setWatchId(id);
  };

  const stopDiagnostic = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsActive(false);
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const accuracyColor = (accuracy: number): string => {
    if (accuracy <= 20) return 'bg-status-available text-white';
    if (accuracy <= 50) return 'bg-status-few-seats text-white';
    return 'bg-status-full text-white';
  };

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const minutes = Math.floor(diff / 60);
    return `${minutes}m ${diff % 60}s ago`;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            GPS Diagnostic Panel
          </CardTitle>
          <Badge variant={isMobile ? 'default' : 'secondary'}>
            {isMobile ? <Smartphone className="h-3 w-3 mr-1" /> : <Laptop className="h-3 w-3 mr-1" />}
            {isMobile ? 'Mobile GPS' : 'Desktop IP-based'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex gap-2">
          {!isActive ? (
            <Button onClick={startDiagnostic} className="flex-1">
              <Activity className="h-4 w-4 mr-2" />
              Start GPS Monitoring
            </Button>
          ) : (
            <Button onClick={stopDiagnostic} variant="destructive" className="flex-1">
              Stop Monitoring
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-status-full/10 border border-status-full/30 rounded-lg text-sm text-status-full">
            {error}
          </div>
        )}

        {/* GPS Data Display */}
        {gpsData && (
          <div className="space-y-3">
            {/* Status Bar */}
            <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-status-available animate-pulse" />
                <span className="text-sm font-medium">Active</span>
              </div>
              <span className="text-xs text-muted-foreground">{updateCount} updates</span>
            </div>

            {/* Accuracy Badge (Most Important) */}
            <div className="p-4 border-2 border-border rounded-lg bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  <span className="font-semibold">GPS Accuracy</span>
                </div>
                <Badge className={accuracyColor(gpsData.accuracy)}>
                  ±{gpsData.accuracy.toFixed(1)}m
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {gpsData.accuracy <= 20 && '✅ Excellent - Ready for navigation'}
                {gpsData.accuracy > 20 && gpsData.accuracy <= 50 && '⚠️ Good - Acceptable accuracy'}
                {gpsData.accuracy > 50 && '❌ Poor - Wait for better signal or move outdoors'}
              </p>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Latitude</span>
                </div>
                <p className="text-sm font-mono">{gpsData.latitude.toFixed(6)}°</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Longitude</span>
                </div>
                <p className="text-sm font-mono">{gpsData.longitude.toFixed(6)}°</p>
              </div>
            </div>

            {/* Additional Data */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Heading</span>
                </div>
                <p className="text-sm">
                  {gpsData.heading !== null ? `${gpsData.heading.toFixed(0)}°` : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Speed</span>
                </div>
                <p className="text-sm">
                  {gpsData.speed !== null
                    ? `${(gpsData.speed * 3.6).toFixed(1)} km/h`
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Timestamp */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium">Last Update</span>
              </div>
              <p className="text-sm">{formatTimestamp(gpsData.timestamp)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(gpsData.timestamp).toLocaleString()}
              </p>
            </div>

            {/* Altitude (if available) */}
            {gpsData.altitude !== null && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Altitude</span>
                </div>
                <p className="text-sm">
                  {gpsData.altitude.toFixed(1)}m
                  {gpsData.altitudeAccuracy !== null &&
                    ` (±${gpsData.altitudeAccuracy.toFixed(1)}m)`}
                </p>
              </div>
            )}

            {/* Google Maps Link */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                window.open(
                  `https://www.google.com/maps?q=${gpsData.latitude},${gpsData.longitude}`,
                  '_blank'
                );
              }}
            >
              <MapPin className="h-4 w-4 mr-2" />
              View on Google Maps
            </Button>
          </div>
        )}

        {/* Instructions */}
        {!gpsData && !error && !isActive && (
          <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground space-y-2">
            <p className="font-medium">📍 How to use:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Start GPS Monitoring"</li>
              <li>Grant location permission when prompted</li>
              <li>Wait 5-30 seconds for GPS to acquire satellites</li>
              <li>Watch accuracy improve over time</li>
            </ol>
            <p className="mt-3 text-xs">
              💡 <strong>Tip:</strong> For best results, test outdoors with clear sky view. Indoor GPS
              accuracy is typically 50-200m.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GPSDiagnosticPanel;
