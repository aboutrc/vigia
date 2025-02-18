import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client with proper configuration
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      }
    })
  : null;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabase);
};

// Helper function to test Supabase connection
export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured()) {
    console.info('Supabase is not configured. Please connect using the "Connect to Supabase" button.');
    return false;
  }
  
  try {
    const { error } = await supabase!.from('markers').select('id').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is OK
      throw error;
    }
    return true;
  } catch (err) {
    // Only log as error if it's not due to missing configuration
    if (isSupabaseConfigured()) {
      console.error('Supabase connection test failed:', err);
    }
    return false;
  }
};