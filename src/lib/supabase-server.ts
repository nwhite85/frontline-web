import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import type { Database } from '@/types/supabase';

/**
 * Creates a Supabase client with service role key for server-side operations
 * Handles environment variable cleaning and validation
 */
export function createServerSupabaseClient() {
  // Clean the URL to remove any whitespace, newlines, or unwanted prefixes
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  // Remove any unwanted prefixes that might be added during build
  supabaseUrl = supabaseUrl.replace(/^\d+\.\s*/, '');
  
  // Remove potential duplication of environment variable name in value
  if (supabaseUrl.includes('NEXT_PUBLIC_SUPABASE_URL')) {
    supabaseUrl = supabaseUrl.replace(/.*NEXT_PUBLIC_SUPABASE_URL\s*=\s*/, '');
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (_error) {
    logger.error('Invalid Supabase URL length:', supabaseUrl.length);
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey);
}