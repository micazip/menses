'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-pink-200 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌸</div>
          <h1 className="text-2xl font-bold text-gray-800">우리 가족 달력</h1>
          <p className="text-gray-400 text-sm mt-1">PIN 4자리를 입력해주세요</p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                i < pin.length
                  ? error
                    ? 'bg-red-400 scale-110'
                    : 'bg-rose-400 scale-110'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-center text-sm mb-4 animate-pulse">
            PIN이 올바르지 않아요
          </p>
        )}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              disabled={loading || pin.length >= 4}
              className="h-14 rounded-2xl bg-pink-50 hover:bg-pink-100 active:scale-95 text-gray-800 font-semibold text-xl transition-all disabled:opacity-40"
            >
              {d}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            disabled={loading || pin.length >= 4}
            className="h-14 rounded-2xl bg-pink-50 hover:bg-pink-100 active:scale-95 text-gray-800 font-semibold text-xl transition-all disabled:opacity-40"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || pin.length === 0}
            className="h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-500 text-xl transition-all disabled:opacity-40"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  )
}
