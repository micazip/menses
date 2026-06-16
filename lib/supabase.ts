import { createClient } from '@supabase/supabase-js'

function clean(val: string | undefined) {
  return (val ?? '').replace(/^\uFEFF/, '').replace(/[^\x20-\x7E]/g, '').trim()
}

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
