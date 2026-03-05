import { createBrowserClient } from '@supabase/ssr';
import { logger } from '@/utils/logger';
import type { Database } from '@/types/supabase';

// Clean environment variables
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const urlMatch = rawUrl.match(/https:\/\/[^\s]+/);
const cleanUrl = urlMatch ? urlMatch[0] : rawUrl.trim();
const cleanAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

if (!cleanUrl || !cleanAnonKey) {
  logger.warn('Supabase credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createBrowserClient<Database>(cleanUrl, cleanAnonKey); 