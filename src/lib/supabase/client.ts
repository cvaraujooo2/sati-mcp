import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client usando @supabase/ssr
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}

// Singleton para compatibilidade com código existente
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient()
  }
  return supabaseInstance
})()

