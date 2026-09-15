# Hard-refresh + routing fixes (v2)

## Server routing
`vercel.json` rewrites all routes to `index.html` so `/dashboard` no longer 404s.

## Client race on hard refresh
Dashboard used to redirect to `/` as soon as `loading === false && !user`.
On hard refresh there is a brief window where loading finishes before the
session is restored from localStorage → user gets kicked to the home page.

Fix: wait until auth has fully settled before redirecting unauthenticated users,
and keep the loader visible until then.

## Service Worker
Old SW cached Supabase API. New config removes that. `main.tsx` unregisters
any leftover workers and clears workbox/supabase caches on boot.

## Deploy
1. Copy all files from this folder into your repo (same paths).
2. git add + commit + push
3. Vercel → Redeploy (disable build cache)
4. In Chrome DevTools → Application:
   - Service Workers → Unregister ALL
   - Cache Storage → Delete all
   - Application → Storage → Clear site data
5. Close the tab, open a fresh one, log in, hard-refresh on /dashboard

## Env vars on Vercel
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
