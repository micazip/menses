'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    router.prefetch('/dashboard')
  }, [router])

  const submitPin = async (pinValue: string) => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue }),
      })
      if (res.ok) {
        router.push('/dashboard')
      } else {
        setError(true)
        setPin('')
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleDigit = (digit: string) => {
    if (loading) return
    const next = pin + digit
    setError(false)
    setPin(next)
    if (next.length === 4) submitPin(next)
  }

  const handleDelete = () => {
    setPin(p => p.slice(0, -1))
    setError(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-80px] right-[-60px] w-[320px] h-[320px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-100px] left-[-80px] w-[360px] h-[360px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.04) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-[280px]">
        <div className="flex justify-center mb-8">
          <img src="data:image/png;base64,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" alt="" className="h-16" />
        </div>

        <div className="text-center mb-11">
          <p className="text-[13px]" style={{ color: '#aaa' }}>PIN 4자리를 입력해주세요</p>
        </div>

        <div className="flex justify-center gap-5 mb-11">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="rounded-full transition-all duration-150"
              style={{
                width: i < pin.length ? '13px' : '11px',
                height: i < pin.length ? '13px' : '11px',
                background: i < pin.length ? (error ? '#ef4444' : '#f43f5e') : '#e0e0e0',
              }}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-[12px] mb-6 -mt-5" style={{ color: '#f87171' }}>
            PIN이 올바르지 않아요
          </p>
        )}

        <div className="grid grid-cols-3 gap-[10px]">
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              disabled={loading || pin.length >= 4}
              className="h-[60px] rounded-2xl text-[22px] font-light transition-all active:scale-95 disabled:opacity-30"
              style={{
                background: '#fff',
                color: '#111',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 14px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              {d}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            disabled={loading || pin.length >= 4}
            className="h-[60px] rounded-2xl text-[22px] font-light transition-all active:scale-95 disabled:opacity-30"
            style={{
              background: '#fff',
              color: '#111',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 14px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || pin.length === 0}
            className="h-[60px] rounded-2xl text-[18px] transition-all active:scale-95 disabled:opacity-20"
            style={{ background: '#f8f8f8', color: '#999', border: '1px solid rgba(0,0,0,0.05)' }}
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  )
}
