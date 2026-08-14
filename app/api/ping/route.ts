import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing env vars')

    const res = await fetch(`${url}/rest/v1/cycles?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Supabase ${res.status}: ${text}`)
    }
    return NextResponse.json({ ok: true, time: new Date().toISOString() })
  } catch (e) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
