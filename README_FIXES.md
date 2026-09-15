# Fix: endless "Loading dashboard..." on hard refresh (v3)

## Root cause
AuthContext awaited profile + role DB queries before setting `loading = false`.
If those queries hung (RLS, network, old SW), the UI stayed on the spinner forever.

## Fix
1. Set `loading = false` as soon as the **session** is known from getSession().
2. Fetch profile/role in the **background** (with a 4s timeout).
3. Default role to `commuter` if the fetch fails or times out.
4. Dashboard only blocks on session loading — never on profile/role.
5. Dashboard uses `role ?? 'commuter'` so it never shows "Preparing..." forever.

## Deploy
1. Copy files into repo
2. git add + commit + push
3. Vercel Redeploy (no build cache)
4. Browser: unregister Service Workers + Clear site data
5. Hard refresh /dashboard while logged in
