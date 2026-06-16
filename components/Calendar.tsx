'use client'

import { Cycle, Symptom, PERSONS, Person } from '@/types'
import { getHoliday } from '@/lib/holidays'
import { todayStr } from '@/lib/utils'

interface Props {
  year: number
  month: number
  cycles: Cycle[]
  symptoms: Symptom[]
  cycleSettings: Record<Person, number>
  onDayClick: (date: string, person?: Person) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const DAY_NAMES = ['일','월','화','수','목','금','토']

function pad(n: number) { return String(n).padStart(2, '0') }
function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function isInCycle(date: string, cycle: Cycle): boolean {
  if (date < cycle.start_date) return false
  if (!cycle.end_date) return date === cycle.start_date
  return date <= cycle.end_date
}

function predictNextMultiple(person: Person, cycles: Cycle[], fixedLength?: number, count = 12): string[] {
  // end_date 유무 관계없이 모든 사이클 사용 (start_date 기준으로만 예측)
  const all = cycles
    .filter(c => c.person === person)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
  if (all.length === 0) return []

  let avg: number
  if (fixedLength) {
    avg = fixedLength
  } else {
    if (all.length < 2) return []
    const lengths: number[] = []
    for (let i = 0; i < Math.min(all.length - 1, 4); i++) {
      const diff = Math.round(
        (new Date(all[i].start_date).getTime() - new Date(all[i + 1].start_date).getTime()) / 86400000
      )
      if (diff > 15 && diff < 60) lengths.push(diff)
    }
    if (lengths.length === 0) return []
    avg = Math.round(lengths.reduce((a, b) => a + b) / lengths.length)
  }

  const results: string[] = []
  let base = new Date(all[0].start_date)
  const today = new Date(); today.setHours(0,0,0,0)

  for (let i = 0; i < 50 && results.length < count; i++) {
    const next = new Date(base)
    next.setDate(next.getDate() + avg)
    base = next
    if (next >= today) results.push(next.toISOString().split('T')[0])
  }
  return results
}

export default function Calendar({ year, month, cycles, symptoms, cycleSettings, onDayClick, onPrevMonth, onNextMonth }: Props) {
  const today = todayStr()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const days: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (days.length % 7 !== 0) days.push(null)

  const personColors: Record<Person, string> = {
    big: '#f43f5e',
    small: '#eab308',
    mom: '#0d9488',
  }

  const predictions: Record<Person, string[]> = {
    big: predictNextMultiple('big', cycles, cycleSettings.big),
    small: predictNextMultiple('small', cycles, cycleSettings.small),
    mom: predictNextMultiple('mom', cycles, cycleSettings.mom),
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button onClick={onPrevMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-2xl transition-colors">‹</button>
        <h2 className="text-lg font-bold text-gray-800">{year}년 {MONTH_NAMES[month]}</h2>
        <button onClick={onNextMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-2xl transition-colors">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 bg-pink-50/60">
        {DAY_NAMES.map((name, i) => (
          <div key={name} className={`text-center text-xs font-semibold py-2.5 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
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
          const holiday = getHoliday(date)

          const predictedPersonsWithIdx = (Object.entries(predictions) as [Person, string[]][])
            .filter(([, preds]) => preds.includes(date))
            .map(([key, preds]) => ({ key: key as Person, idx: preds.indexOf(date) }))
          // const hasSymptom = symptoms.some(s => s.date === date)

          // 각 사람의 사이클 바 정보
          const cycleBars = PERSONS.map(p => {
            const cycle = cycles.find(c => c.person === p.key && isInCycle(date, c))
            if (!cycle) return null

            const isStart = date === cycle.start_date || dayOfWeek === 0
            const isEnd = (!!cycle.end_date && date === cycle.end_date) || dayOfWeek === 6

            return { key: p.key, color: personColors[p.key], isStart, isEnd }
          }).filter(Boolean) as { key: Person; color: string; isStart: boolean; isEnd: boolean }[]

          const hasCycle = cycleBars.length > 0

          return (
            <button
              key={date}
              onClick={() => onDayClick(date)}
              className={`min-h-[64px] flex flex-col items-center border-b border-r border-gray-100 hover:bg-pink-50/60 active:bg-pink-100/60 transition-colors overflow-hidden ${isToday ? 'bg-rose-50/70' : ''}`}
            >
              {/* 날짜 숫자 */}
              <div className="pt-1.5 pb-0.5">
                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-rose-400 text-white font-bold'
                  : dayOfWeek === 0 || holiday ? 'text-red-400'
                  : dayOfWeek === 6 ? 'text-blue-400'
                  : 'text-gray-700'
                }`}>
                  {day}
                </span>
              </div>
              {/* 공휴일 이름 */}
              {holiday && (
                <div className="text-red-400 leading-none mb-0.5" style={{ fontSize: '8px' }}>
                  {holiday}
                </div>
              )}

              {/* 점 표시 */}
              <div className="flex gap-0.5 flex-wrap justify-center">
                {cycleBars.map(bar => (
                  <span
                    key={bar.key}
                    onClick={e => { e.stopPropagation(); onDayClick(date, bar.key) }}
                    className="w-3 h-3 rounded-full cursor-pointer hover:scale-125 transition-transform"
                    style={{ backgroundColor: bar.color }}
                  />
                ))}
                {predictedPersonsWithIdx
                  .filter(({ key }) => !cycleBars.find(b => b.key === key))
                  .map(({ key, idx }) => (
                    <span
                      key={`p-${key}`}
                      onClick={e => { e.stopPropagation(); onDayClick(date, key) }}
                      className="w-3 h-3 rounded-full border-2 cursor-pointer hover:scale-125 transition-transform"
                      style={{ borderColor: personColors[key], opacity: idx === 0 ? 1 : 0.5 }}
                    />
                  ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" /> 생리 중
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 inline-block" /> 다음 예상
          </span>
        </div>

        <div className="space-y-0.5">
          {PERSONS.map(p => {
            const pred = predictions[p.key][0]
            if (!pred) return null
            const [y, m, d] = pred.split('-')
            return (
              <p key={p.key} className="text-xs text-gray-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: personColors[p.key] }} />
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
