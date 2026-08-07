'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _browser: SupabaseClient | null = null;

export function createBrowserClient(): SupabaseClient {
  if (!_browser) {
    _browser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
  }
  return _browser;
}
