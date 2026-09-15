# Hard-refresh + endless loading fixes

## What was broken

1. **No `vercel.json`** → hard refresh on `/dashboard` returned Vercel 404 (React never loaded).
2. **AuthContext** set `loading = true` on *every* `onAuthStateChange` event (including TOKEN_REFRESHED / INITIAL_SESSION after hard refresh). If the subsequent profile/role fetch was slow or failed, the UI stayed on the loader forever.
3. **Service Worker** cached Supabase API responses for 24h → stale/broken auth data after refresh.
4. **`.single()`** on profile/role/vehicle queries threw when 0 rows (PGRST116), contributing to failed fetches.
5. Role could remain `null` → Dashboard showed "Preparing your dashboard..." indefinitely.

## Files changed

| File | Change |
|------|--------|
| `vercel.json` | **NEW** – SPA rewrites so `/dashboard` (and all routes) serve `index.html` |
| `vite.config.ts` | Removed Supabase runtime caching from Workbox; PWA still works for install |
| `src/main.tsx` | Unregisters old service workers + clears stale caches on boot |
| `src/contexts/AuthContext.tsx` | Hard-refresh safe: TOKEN_REFRESHED never flips loading; `maybeSingle`; always default role; `initialLoadDoneRef` |
| `src/pages/Dashboard.tsx` | Longer safety timeout; clearer logging |
| `src/integrations/supabase/client.ts` | Safer missing-env handling |
| `src/components/ProfileSheet.tsx` | `.single()` → `.maybeSingle()` for vehicle load |

## How to deploy

1. Copy these files into your repo root (overwrite existing).
2. Commit and push to `main`.
3. In Vercel → Redeploy **with build cache disabled**.
4. On your browser: DevTools → Application → Service Workers → Unregister all, then clear Cache Storage.
5. Hard refresh `/dashboard` – it should restore correctly.

## Vercel env vars (must exist)

```
VITE_SUPABASE_URL=https://kaciptxhzvpahvjzkadl.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon key>
```

After changing env vars, always Redeploy.
