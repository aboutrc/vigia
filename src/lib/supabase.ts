import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client with proper configuration
export const supabase = supabaseUrl && supabaseAnonKey ? createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'vigia@1.0.0',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }
  }
) : null;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const hasConfig = Boolean(supabaseUrl && supabaseAnonKey && supabase);
  if (!hasConfig) {
    console.warn('Supabase configuration is missing. Please check your environment variables.');
  }
  return hasConfig;
};

// Helper function to test Supabase connection with retries
export const testSupabaseConnection = async (retryCount = 0, maxRetries = 3) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not configured');
    return false;
  }

  try {
    console.info(`Supabase connection attempt ${retryCount + 1}`);
    const { data, error } = await supabase!.from('markers')
      .select('id, created_at')
      .limit(1)
      .maybeSingle();
      
    // PGRST116 means no rows found, which is OK
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return true;
  } catch (err) {
    console.error(`Supabase connection attempt ${retryCount + 1} failed:`, err);
    
    if (retryCount < maxRetries) {
      // Exponential backoff: wait longer between each retry
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return testSupabaseConnection(retryCount + 1, maxRetries);
    }
    
    return false;
  }
};