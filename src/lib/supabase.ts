import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create client only if both env vars are set, otherwise export a safe proxy
function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file to enable backend features.'
    );
    // Return a minimal stub that will not throw on import
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase: SupabaseClient = createSupabaseClient();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
