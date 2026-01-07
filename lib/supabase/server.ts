import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!

// Server-side Supabase client
// Use this ONLY on the server (API routes, Server Components, Server Actions)
// Has elevated privileges via service role key
export const supabaseServer = createClient(supabaseUrl, supabaseSecretKey)
