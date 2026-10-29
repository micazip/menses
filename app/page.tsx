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
