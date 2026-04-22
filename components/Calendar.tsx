'use client'

import { Cycle, Symptom, PERSONS, Person } from '@/types'

interface Props {
  year: number
  month: number
  cycles: Cycle[]
  symptoms: Symptom[]
  onDayClick: (date: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const DAY_NAMES = ['일','월','화','수','목','금','토']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function isInCycle(date: string, cycle: Cycle): boolean {
  if (date < cycle.start_date) return false
  if (!cycle.end_date) return date === cycle.start_date
  return date <= cycle.end_date
}

function predictNext(person: Person, cycles: Cycle[]): string | null {
  const done = cycles
    .filter(c => c.person === person && c.end_date)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
  if (done.length < 2) return null

  const lengths: number[] = []
  for (let i = 0; i < Math.min(done.length - 1, 4); i++) {
    const diff = Math.round(
      (new Date(done[i].start_date).getTime() - new Date(done[i + 1].start_date).getTime()) /
      86400000
    )
    if (diff > 15 && diff < 60) lengths.push(diff)
  }
  if (lengths.length === 0) return null

  const avg = Math.round(lengths.reduce((a, b) => a + b) / lengths.length)
  const nextDate = new Date(done[0].start_date)
  nextDate.setDate(nextDate.getDate() + avg)
  return nextDate.toISOString().split('T')[0]
}

export default function Calendar({ year, month, cycles, symptoms, onDayClick, onPrevMonth, onNextMonth }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const days: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (days.length % 7 !== 0) days.push(null)

  const personColors: Record<Person, string> = {
    big: '#f43f5e',
    small: '#8b5cf6',
    mom: '#0d9488',
  }

  const predictions: Record<Person, string | null> = {
    big: predictNext('big', cycles),
    small: predictNext('small', cycles),
    mom: predictNext('mom', cycles),
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button
          onClick={onPrevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-2xl transition-colors"
        >
          ‹
        </button>
        <h2 className="text-lg font-bold text-gray-800">
          {year}년 {MONTH_NAMES[month]}
        </h2>
        <button
          onClick={onNextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-2xl transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 bg-pink-50/60">
        {DAY_NAMES.map((name, i) => (
          <div
            key={name}
            className={`text-center text-xs font-semibold py-2.5 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 border-t border-gray-100">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`e-${idx}`} className="min-h-[64px] bg-gray-50/20 border-b border-r border-gray-100" />
          }

          const date = toDateStr(year, month, day)
          const isToday = date === today
          const dayOfWeek = idx % 7

          const activePersons = [...new Set(cycles.filter(c => isInCycle(date, c)).map(c => c.person))]
          const predictedPersons = (Object.entries(predictions) as [Person, string | null][])
            .filter(([key, pred]) => pred === date && !activePersons.includes(key))
            .map(([key]) => key)
          const hasSymptom = symptoms.some(s => s.date === date)

          return (
            <button
              key={date}
              onClick={() => onDayClick(date)}
              className={`min-h-[64px] p-1.5 flex flex-col items-center gap-1 border-b border-r border-gray-100 hover:bg-pink-50/60 active:bg-pink-100/60 transition-colors ${
                isToday ? 'bg-rose-50/70' : ''
              }`}
            >
              <span
                className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday
                    ? 'bg-rose-400 text-white font-bold'
                    : dayOfWeek === 0
                    ? 'text-red-400'
                    : dayOfWeek === 6
                    ? 'text-blue-400'
                    : 'text-gray-700'
                }`}
              >
                {day}
              </span>

              {/* Cycle dots */}
              {(activePersons.length > 0 || predictedPersons.length > 0) && (
                <div className="flex gap-0.5 flex-wrap justify-center">
                  {activePersons.map(key => (
                    <span
                      key={key}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: personColors[key] }}
                    />
                  ))}
                  {predictedPersons.map(key => (
                    <span
                      key={`p-${key}`}
                      className="w-2 h-2 rounded-full border-2"
                      style={{ borderColor: personColors[key] }}
                    />
                  ))}
                </div>
              )}

              {/* Symptom indicator */}
              {hasSymptom && <span className="text-xs leading-none">💊</span>}
            </button>
          )
        })}
      </div>

      {/* Predictions & legend */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" /> 생리 중
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 inline-block" /> 다음 예상
          </span>
          <span className="flex items-center gap-1">💊 증상 기록</span>
        </div>

        <div className="space-y-0.5">
          {PERSONS.map(p => {
            const pred = predictions[p.key]
            if (!pred) return null
            const [y, m, d] = pred.split('-')
            return (
              <p key={p.key} className="text-xs text-gray-500 flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: personColors[p.key] }}
                />
                <span className="font-medium" style={{ color: personColors[p.key] }}>{p.label}</span>
                <span>다음 예상일:</span>
                <span className="font-medium text-gray-700">{`${y}년 ${parseInt(m)}월 ${parseInt(d)}일`}</span>
              </p>
            )
          })}
        </div>
      </div>
    </div>
  )
}
