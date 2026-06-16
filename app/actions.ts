'use server'

import { createClient } from '@supabase/supabase-js'

function clean(val: string | undefined) {
  return (val ?? '').replace(/^\uFEFF/, '').replace(/[^\x20-\x7E]/g, '').trim()
}

function getSupabase() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  return createClient(url, key)
}

export async function savePersonSetting(
  person: string,
  cycleLength: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabase()
    const { data: existing } = await supabase
      .from('person_settings')
      .select('person')
      .eq('person', person)
      .maybeSingle()

    const { error } = existing
      ? await supabase.from('person_settings').update({ cycle_length: cycleLength }).eq('person', person)
      : await supabase.from('person_settings').insert({ person, cycle_length: cycleLength })

    if (error) {
      console.error('[actions] supabase error:', error.message, error.code)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[actions] savePersonSetting catch:', msg)
    return { success: false, error: msg }
  }
}

export async function getPersonSettings(): Promise<{ person: string; cycle_length: number }[]> {
  try {
    const supabase = getSupabase()
    const { data } = await supabase.from('person_settings').select('*')
    return data ?? []
  } catch {
    return []
  }
}
