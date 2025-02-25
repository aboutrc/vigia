import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://opzqmoaimiqiiflivqtq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wenFtb2FpbWlxaWlmbGl2cXRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODM4Nzk4NywiZXhwIjoyMDUzOTYzOTg3fQ.I6Hm_qI1iUNrAM8WFQbjHDK3ZCGRp7AQwk_KQlPRIPI';

// Create Supabase client with proper configuration
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'vigia@1.0.0',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }
  }
);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const hasConfig = Boolean(supabaseUrl && supabaseAnonKey && supabase);
  if (!hasConfig) {
    console.warn('Supabase configuration is missing');
  }
  return hasConfig;
};

// Helper function to test Supabase connection with retries
export const testSupabaseConnection = async (retryCount = 0, maxRetries = 3) => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase configuration is missing');
    return false;
  }

  try {
    console.info(`Supabase connection attempt ${retryCount + 1}`);
    const { data, error } = await supabase
      .from('markers')
      .select('count')
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