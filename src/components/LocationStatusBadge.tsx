import React from 'react';
import type { GpsStatus } from '@/hooks/useDriverLocation';
import {
  AlertTriangle, CheckCircle2, Loader2, MapPinOff, XCircle, Timer,
} from 'lucide-react';

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'unavailable'
  | 'timeout';

// ── Shared badge utilities ──────────────────────────────────────────────────
const shellClass =
  'inline-flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs';

function StatusChip({
  tone, children,
}: { tone: 'muted' | 'info' | 'success' | 'warn' | 'error'; children: React.ReactNode }) {
  const cls = {
    muted:   'bg-muted text-muted-foreground',
    info:    'bg-secondary/50 text-secondary-foreground',
    success: 'bg-status-available/10 text-status-available border-status-available/30',
    warn:    'bg-status-few-seats/15 text-status-few-seats border-status-few-seats/40',
    error:   'bg-status-full/12 text-status-full border-status-full/40',
  }[tone];
  return <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>{children}</div>;
}

export const LocationStatusBadge: React.FC<{ status: LocationStatus }> = ({ status }) => {
  switch (status) {
    case 'idle':
      return (
        <div className={`${shellClass} bg-muted/40`}>
          <MapPinOff className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Location sharing is off</span>
          <div className="ml-auto">
            <StatusChip tone="muted"><XCircle className="h-3 w-3" /> Off</StatusChip>
          </div>
        </div>
      );
    case 'requesting':
      return (
        <div className={`${shellClass} bg-secondary/40`}>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-secondary-foreground" />
          <span>Looking for GPS signal…</span>
          <div className="ml-auto">
            <StatusChip tone="info"><Loader2 className="h-3 w-3 animate-spin" /> Loading</StatusChip>
          </div>
        </div>
      );
    case 'active':
      return (
        <div className={`${shellClass} bg-status-available/6 border-status-available/30`}>
          <CheckCircle2 className="h-3.5 w-3.5 text-status-available" />
          <span className="text-status-available">Live location is being shared</span>
          <div className="ml-auto">
            <StatusChip tone="success">
              <span className="h-1.5 w-1.5 rounded-full bg-status-available animate-pulse" />
              Live
            </StatusChip>
          </div>
        </div>
      );
    case 'denied':
      return (
        <div className={`${shellClass} bg-status-full/8 border-status-full/30`}>
          <XCircle className="h-3.5 w-3.5 text-status-full" />
          <span>Location permission denied. Enable it in browser settings.</span>
          <div className="ml-auto"><StatusChip tone="error">Blocked</StatusChip></div>
        </div>
      );
    case 'unavailable':
      return (
        <div className={`${shellClass} bg-status-few-seats/10 border-status-few-seats/30`}>
          <AlertTriangle className="h-3.5 w-3.5 text-status-few-seats" />
          <span>Location unavailable. Check device GPS.</span>
          <div className="ml-auto"><StatusChip tone="warn">Unavailable</StatusChip></div>
        </div>
      );
    case 'timeout':
      return (
        <div className={`${shellClass} bg-status-few-seats/10 border-status-few-seats/30`}>
          <Timer className="h-3.5 w-3.5 text-status-few-seats" />
          <span>Location request timed out. Move to an open area.</span>
          <div className="ml-auto"><StatusChip tone="warn">Timeout</StatusChip></div>
        </div>
      );
  }
};

interface GpsStatusBadgeProps {
  status: GpsStatus;
  lastUpdated: Date | null;
}

export const GpsStatusBadge: React.FC<GpsStatusBadgeProps> = ({ status, lastUpdated }) => {
  const timeAgo = lastUpdated
    ? `${Math.max(1, Math.floor((Date.now() - lastUpdated.getTime()) / 1000))}s ago`
    : null;

  switch (status) {
    case 'idle':
      return (
        <div className={`${shellClass} bg-muted/40`}>
          <MapPinOff className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">GPS not active</span>
          <div className="ml-auto">
            <StatusChip tone="muted"><XCircle className="h-3 w-3" /> Offline</StatusChip>
          </div>
        </div>
      );
    case 'requesting':
      return (
        <div className={`${shellClass} bg-secondary/40`}>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-secondary-foreground" />
          <span>Acquiring GPS signal... (may take 30s)</span>
          <div className="ml-auto">
            <StatusChip tone="info"><Loader2 className="h-3 w-3 animate-spin" /> Fixing</StatusChip>
          </div>
        </div>
      );
    case 'active':
      return (
        <div className={`${shellClass} bg-status-available/6 border-status-available/30`}>
          <CheckCircle2 className="h-3.5 w-3.5 text-status-available" />
          <span>GPS tracking active</span>
          <div className="ml-auto">
            <StatusChip tone="success">
              <span className="h-1.5 w-1.5 rounded-full bg-status-available animate-pulse" />
              {timeAgo || 'Live'}
            </StatusChip>
          </div>
        </div>
      );
    case 'denied':
      return (
        <div className={`${shellClass} bg-status-full/8 border-status-full/30`}>
          <XCircle className="h-3.5 w-3.5 text-status-full" />
          <span>GPS permission denied. Enable in browser settings.</span>
          <div className="ml-auto"><StatusChip tone="error">Blocked</StatusChip></div>
        </div>
      );
    case 'unavailable':
      return (
        <div className={`${shellClass} bg-status-few-seats/10 border-status-few-seats/30`}>
          <AlertTriangle className="h-3.5 w-3.5 text-status-few-seats" />
          <span>GPS not available. Move to an open area with clear sky view.</span>
          <div className="ml-auto"><StatusChip tone="warn">No GPS</StatusChip></div>
        </div>
      );
    case 'timeout':
      return (
        <div className={`${shellClass} bg-status-few-seats/10 border-status-few-seats/30`}>
          <Timer className="h-3.5 w-3.5 text-status-few-seats" />
          <span>GPS acquisition timed out. Try again in an open area.</span>
          <div className="ml-auto"><StatusChip tone="warn">Timeout</StatusChip></div>
        </div>
      );
    case 'unsupported':
      return (
        <div className={`${shellClass} bg-status-full/8 border-status-full/30`}>
          <AlertTriangle className="h-3.5 w-3.5 text-status-full" />
          <span>Browser does not support location services.</span>
          <div className="ml-auto"><StatusChip tone="error">Unsupported</StatusChip></div>
        </div>
      );
  }
};

export default LocationStatusBadge;
