/**
 * Supabase Client for frontend authentication
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables (Vite uses import.meta.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gfsagqfriactnswmjgdi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmc2FncWZyaWFjdG5zd21qZ2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyOTk1MDMsImV4cCI6MjA4Mjg3NTUwM30.ZOg76ZQLGQ65E6tJ4G6PuxVG8pbpQ8hI6-fq4yFcHkY';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not found in environment. Using defaults.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

export default supabase;
