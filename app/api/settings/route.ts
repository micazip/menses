import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase.from('person_settings').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { person, cycle_length } = await req.json()

  const { data: existing } = await supabase
    .from('person_settings')
    .select('person')
    .eq('person', person)
    .maybeSingle()

  const { error } = existing
    ? await supabase.from('person_settings').update({ cycle_length }).eq('person', person)
    : await supabase.from('person_settings').insert({ person, cycle_length })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
