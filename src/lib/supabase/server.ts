import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Server-side Supabase client 
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey);
}