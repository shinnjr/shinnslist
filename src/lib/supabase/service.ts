import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _service: SupabaseClient | null = null;

export function createServiceClient(): SupabaseClient {
  if (!_service) {
    _service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }
  return _service;
}
