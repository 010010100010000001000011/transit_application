import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[Supabase] Missing environment variables.\n' +
      'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel (and .env locally).\n' +
      'After changing env vars on Vercel you must Redeploy.'
  );
}

// Fallback empty strings prevent createClient from throwing at import time;
// requests will fail clearly instead of crashing the whole app on boot.
export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
