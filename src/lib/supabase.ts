import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client with proper configuration
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Don't persist auth session
        autoRefreshToken: false, // Don't auto refresh token
        detectSessionInUrl: false // Don't detect session in URL
      },
      global: {
        headers: {
          'X-Client-Info': 'vigia-app'
        }
      }
    })
  : null;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabase);
};

// Helper function to test Supabase connection
export const testSupabaseConnection = async () => {
  if (!supabase) return false;
  
  try {
    const { data, error } = await supabase.from('markers').select('count');
    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is OK
      console.error('Supabase connection test failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase connection test failed:', err);
    return false;
  }
};