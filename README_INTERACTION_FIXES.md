# Driver ↔ Commuter interaction + performance fixes

## What was wrong

1. **Map visibility** – Commuters only saw vehicles; drivers only saw commuters.
   Now both roles see **vehicles and commuters** when location is active.

2. **Click details**
   - Commuter taps a vehicle → vehicle details (destination, color, seats, etc.)
   - Commuter taps another commuter → appearance (shirt/trouser colors, destination)
   - Driver taps a commuter → appearance + destination + wait time

3. **Pin messages**
   - `usePinMessages('commuter')` was invalid (hook takes no args; role comes from AuthContext)
   - Empty destination caused **zero pins** to show (`filtered = []`)
   - Now shows all active pins; prioritizes destination matches
   - Driver sees yes/no interest counts via realtime + 15s poll

4. **Slowness**
   - Polling every 10s always (even background tabs)
   - Now 15s and **only when tab is visible**
   - Commuter fetch skips rows with null lat/lng
   - Prevents overlapping concurrent fetches

5. **Driver vehicle load** re-ran on every GPS status change → UI flicker; fixed to load once per user.

## Files changed

- `src/components/TransitMap.tsx`
- `src/components/CommuterDashboard.tsx`
- `src/components/DriverDashboard.tsx`
- `src/hooks/usePinMessages.ts`
- `src/hooks/useRealtimeCommuters.ts`
- `src/hooks/useRealtimeVehicles.ts`

## Deploy

```bash
# copy files into repo, then:
git add src/
git commit -m "fix: mutual map visibility, pin messages, click details, performance"
git push
```

Redeploy on Vercel (disable build cache). Clear service workers once more if needed.
