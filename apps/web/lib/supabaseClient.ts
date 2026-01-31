/**
 * Supabase Client for frontend authentication
 *
 * IMPORTANT: Configure environment variables before using:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous key
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Track if Supabase is properly configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Log warning if not configured (but don't crash the app)
if (!isSupabaseConfigured) {
  console.warn(
    '[YouEdu] Supabase not configured. Authentication features will be disabled.\n' +
      'To enable, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.\n' +
      'See .env.example for reference.'
  );
}

// Create client only if configured, otherwise use a placeholder URL
// The placeholder won't work for actual requests, but prevents initialization errors
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Get the current session token for API calls
 */
export async function getAuthToken(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return null;
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export default supabase;
