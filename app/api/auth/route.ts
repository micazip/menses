import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { pin } = await req.json()

  if (pin === process.env.APP_PIN?.trim()) {
    const res = NextResponse.json({ success: true })
    res.cookies.set('auth', 'ok', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30일
      path: '/',
    })
    return res
  }

  return NextResponse.json({ success: false }, { status: 401 })
}
