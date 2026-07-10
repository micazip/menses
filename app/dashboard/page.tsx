'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Cycle, Symptom, PERSONS, Person } from '@/types'
import { getPersonSettings } from '@/app/actions'
import Calendar from '@/components/Calendar'
import DayModal from '@/components/DayModal'
import PersonSettingsModal from '@/components/PersonSettingsModal'
import { todayStr } from '@/lib/utils'

const DEFAULT_CYCLE_SETTINGS: Record<Person, number> = {
  big: 28, small: 28, mom: 28,
}

const CACHE_KEY = 'cycle-tracker-v1'

type CacheData = {
  cycles: Cycle[]
  symptoms: Symptom[]
  cycleSettings: Record<Person, number>
}

function loadCache(): CacheData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveCache(data: CacheData) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch {}
}

export default function DashboardPage() {
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [cycleSettings, setCycleSettings] = useState<Record<Person, number>>(DEFAULT_CYCLE_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | undefined>(undefined)
  const [settingsPerson, setSettingsPerson] = useState<Person | null>(null)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  // 캐시 먼저 표시
  useEffect(() => {
    const cached = loadCache()
    if (cached) {
      setCycles(cached.cycles)
      setSymptoms(cached.symptoms)
      setCycleSettings(cached.cycleSettings)
      setLoading(false)
    }
  }, [])

  const fetchData = useCallback(async (retry = 0) => {
    setSyncing(true)
    setSyncError(false)
    const [c, s, ps] = await Promise.all([
      supabase.from('cycles').select('*').order('start_date', { ascending: false }),
      supabase.from('symptoms').select('*'),
      getPersonSettings(),
    ])
    if (c.error) {
      if (retry < 6) {
        setTimeout(() => fetchData(retry + 1), 15000)
      } else {
        setSyncing(false)
        setSyncError(true)
      }
      setLoading(false)
      return
    }
    const newCycles = c.data ?? []
    const newSymptoms = s.data ?? []
    const newSettings = { ...DEFAULT_CYCLE_SETTINGS }
    if (Array.isArray(ps) && ps.length > 0) {
      ps.forEach((row: { person: string; cycle_length: number }) => {
        newSettings[row.person as Person] = row.cycle_length
      })
    }
    setCycles(newCycles)
    setSymptoms(newSymptoms)
    setCycleSettings(newSettings)
    saveCache({ cycles: newCycles, symptoms: newSymptoms, cycleSettings: newSettings })
    setSyncing(false)
    setSyncError(false)
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

  const personColors = Object.fromEntries(PERSONS.map(p => [p.key, p.color]))

  const today = todayStr()
  const currentCycleStatus = PERSONS.map(p => {
    const active = cycles.find(c =>
      c.person === p.key && c.start_date <= today && (!c.end_date || c.end_date >= today)
    )
    if (!active) return { person: p, status: null }
    const day = Math.floor((new Date(today).getTime() - new Date(active.start_date).getTime()) / 86400000) + 1
    return { person: p, status: `D+${day}` }
  })

  const settingPersonConfig = settingsPerson ? PERSONS.find(p => p.key === settingsPerson) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50/50">
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1
              className="text-lg font-bold text-gray-800 flex items-center gap-2 cursor-pointer hover:text-rose-400 active:scale-95 transition-all select-none"
              onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()) }}
              title="오늘로 이동"
            >
              여성 달력
            </h1>
            <div className="flex gap-3">
              {PERSONS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setSettingsPerson(p.key)}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:opacity-70 active:scale-95 transition-all"
                  title={`${p.label} 주기 설정`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: personColors[p.key] }}
                  />
                  {p.label}
                  <span className="text-gray-400">({cycleSettings[p.key]}일)</span>
                </button>
              ))}
            </div>
          </div>

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

          {/* 동기화 실패시에만 표시 */}
          {syncError && (
            <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
              <a
                href="https://supabase.com/dashboard/project/gdzkcsfxgypasgigbvuw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-rose-400 text-white px-3 py-1 rounded-full font-medium"
              >
                서버 시작하기
              </a>
              <button
                onClick={() => fetchData(0)}
                className="text-xs text-gray-400 underline"
              >
                연결 재시도
              </button>
            </div>
          )}
        </div>
      </header>

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
            cycleSettings={cycleSettings}
            onDayClick={(date, person) => { setSelectedDate(date); setSelectedPerson(person) }}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />
        )}
      </main>

      {selectedDate && (
        <DayModal
          date={selectedDate}
          cycles={cycles}
          symptoms={symptoms}
          initialPerson={selectedPerson}
          onClose={() => { setSelectedDate(null); setSelectedPerson(undefined); fetchData() }}
        />
      )}

      {settingsPerson && settingPersonConfig && (
        <PersonSettingsModal
          person={settingPersonConfig}
          currentLength={cycleSettings[settingsPerson]}
          onClose={() => setSettingsPerson(null)}
          onSaved={(newLength) => {
            setCycleSettings(prev => ({ ...prev, [settingsPerson!]: newLength }))
            setSettingsPerson(null)
          }}
        />
      )}
    </div>
  )
}
