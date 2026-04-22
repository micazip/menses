'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Cycle, Symptom, PERSONS } from '@/types'
import Calendar from '@/components/Calendar'
import DayModal from '@/components/DayModal'

export default function DashboardPage() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const fetchData = useCallback(async () => {
    const [c, s] = await Promise.all([
      supabase.from('cycles').select('*').order('start_date', { ascending: false }),
      supabase.from('symptoms').select('*'),
    ])
    if (c.data) setCycles(c.data)
    if (s.data) setSymptoms(s.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const personColors: Record<string, string> = {
    big: '#f43f5e',
    small: '#8b5cf6',
    mom: '#0d9488',
  }

  // Current cycle status per person
  const today = new Date().toISOString().split('T')[0]
  const currentCycleStatus = PERSONS.map(p => {
    const active = cycles.find(c => {
      const inStart = c.person === p.key && c.start_date <= today
      const inEnd = !c.end_date || c.end_date >= today
      return inStart && inEnd
    })
    if (!active) return { person: p, status: null }
    const day = Math.floor((new Date(today).getTime() - new Date(active.start_date).getTime()) / 86400000) + 1
    return { person: p, status: `D+${day}` }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50/50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              🌸 우리 가족 달력
            </h1>
            <div className="flex gap-3">
              {PERSONS.map(p => (
                <span key={p.key} className="flex items-center gap-1 text-xs text-gray-600">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: personColors[p.key] }}
                  />
                  {p.label}
                </span>
              ))}
            </div>
          </div>

          {/* Current cycle status bar */}
          {currentCycleStatus.some(s => s.status) && (
            <div className="flex gap-3 mt-2 pt-2 border-t border-gray-100">
              {currentCycleStatus.map(({ person: p, status }) =>
                status ? (
                  <span
                    key={p.key}
                    className="text-xs px-2.5 py-1 rounded-full text-white font-medium"
                    style={{ backgroundColor: personColors[p.key] }}
                  >
                    {p.label} {status}
                  </span>
                ) : null
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="max-w-lg mx-auto px-3 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="text-3xl mb-2 animate-pulse">🌸</div>
              <p className="text-gray-400 text-sm">불러오는 중...</p>
            </div>
          </div>
        ) : (
          <Calendar
            year={year}
            month={month}
            cycles={cycles}
            symptoms={symptoms}
            onDayClick={setSelectedDate}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />
        )}
      </main>

      {/* Day modal */}
      {selectedDate && (
        <DayModal
          date={selectedDate}
          cycles={cycles}
          symptoms={symptoms}
          onClose={() => {
            setSelectedDate(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}
