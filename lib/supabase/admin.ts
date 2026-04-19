import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Uses the service-role key — bypasses RLS. MUST only be called from server-side
// code (Server Components, Server Actions, Route Handlers). Never import this from
// a Client Component; SUPABASE_SERVICE_ROLE_KEY is not exposed to the browser.
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('createAdminClient() must not be called from browser code')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
