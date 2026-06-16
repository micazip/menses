'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Cycle, Symptom, PERSONS, Person, PAIN_LEVELS } from '@/types'
import { todayStr } from '@/lib/utils'

interface Props {
  date: string
  cycles: Cycle[]
  symptoms: Symptom[]
  initialPerson?: Person
  onClose: () => void
}

type SymptomForm = {
  pain_level: number
  headache: boolean
  notes: string
}

const DEFAULT_FORM: SymptomForm = { pain_level: 0, headache: false, notes: '' }

function formatKorDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${y}년 ${parseInt(m)}월 ${parseInt(day)}일`
}

function isInCycle(date: string, c: Cycle): boolean {
  if (date < c.start_date) return false
  if (!c.end_date) return date === c.start_date
  return date <= c.end_date
}

export default function DayModal({ date, cycles: initCycles, symptoms: initSymptoms, initialPerson, onClose }: Props) {
  const getInitialTab = (): Person => {
    if (initialPerson) return initialPerson
    const p = PERSONS.find(p => initCycles.some(c => c.person === p.key && isInCycle(date, c)))
    return p?.key ?? 'big'
  }
  const [tab, setTab] = useState<Person>(getInitialTab)
  const [saving, setSaving] = useState(false)
  const [periodDays, setPeriodDays] = useState(6)
  const [editPeriodDays, setEditPeriodDays] = useState(6)
  const [editingPeriod, setEditingPeriod] = useState(false)
  // cycleStarted[person] = true means user clicked "생리 시작일" but not yet saved
  const [cycleStarted, setCycleStarted] = useState<Partial<Record<Person, boolean>>>({})
  const [localCycles, setLocalCycles] = useState<Cycle[]>(initCycles)
  const [localSymptoms, setLocalSymptoms] = useState<Symptom[]>(initSymptoms)
  const [forms, setForms] = useState<Record<Person, SymptomForm>>({
    big: { ...DEFAULT_FORM },
    small: { ...DEFAULT_FORM },
    mom: { ...DEFAULT_FORM },
  })

  const today = todayStr()
  const isFuture = date > today

  useEffect(() => {
    const next: Record<Person, SymptomForm> = {
      big: { ...DEFAULT_FORM },
      small: { ...DEFAULT_FORM },
      mom: { ...DEFAULT_FORM },
    }
    PERSONS.forEach(p => {
      const s = initSymptoms.find(x => x.person === p.key && x.date === date)
      if (s) next[p.key] = { pain_level: s.pain_level, headache: s.headache, notes: s.notes ?? '' }
    })
    setForms(next)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const getCycle = (person: Person) => localCycles.find(c => c.person === person && isInCycle(date, c)) ?? null

  const getCycleDay = (person: Person): number | null => {
    const c = getCycle(person)
    if (!c) return null
    return Math.floor((new Date(date).getTime() - new Date(c.start_date).getTime()) / 86400000) + 1
  }

  // "저장" 버튼: 생리 시작(선택된 경우) + 증상을 한번에 저장
  const handleSave = async (person: Person) => {
    setSaving(true)
    const form = forms[person]
    try {
      // 생리 시작일이 선택된 경우 저장
      if (cycleStarted[person]) {
        const endDate = new Date(date)
        endDate.setDate(endDate.getDate() + periodDays - 1)
        const endDateStr = endDate.toISOString().split('T')[0]

        // 새 사이클과 겹치는 기존 사이클 삭제 (중복 방지)
        const overlapping = localCycles.filter(c =>
          c.person === person &&
          c.start_date <= endDateStr &&
          (!c.end_date || c.end_date >= date)
        )
        for (const c of overlapping) {
          await supabase.from('cycles').delete().eq('id', c.id)
        }

        await supabase.from('cycles').insert({ person, start_date: date, end_date: endDateStr })
      }

      // 증상 저장
      const existing = localSymptoms.find(s => s.person === person && s.date === date)
      if (existing) {
        await supabase.from('symptoms').update({
          pain_level: form.pain_level,
          headache: form.headache,
          notes: form.notes.trim() || null,
        }).eq('id', existing.id)
      } else if (cycleStarted[person] || form.pain_level > 0 || form.headache || form.notes.trim()) {
        // 증상이 있거나 생리 시작일 기록할 때만 증상 저장
        await supabase.from('symptoms').insert({
          person, date,
          pain_level: form.pain_level,
          headache: form.headache,
          notes: form.notes.trim() || null,
        })
      }

      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePeriod = async (person: Person) => {
    const c = getCycle(person)
    if (!c) return
    setSaving(true)
    try {
      const endDate = new Date(c.start_date)
      endDate.setDate(endDate.getDate() + editPeriodDays - 1)
      const endDateStr = endDate.toISOString().split('T')[0]
      await supabase.from('cycles').update({ end_date: endDateStr }).eq('id', c.id)
      setLocalCycles(prev => prev.map(x => x.id === c.id ? { ...x, end_date: endDateStr } : x))
      setEditingPeriod(false)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleEndCycle = async (person: Person) => {
    setSaving(true)
    try {
      const c = getCycle(person)
      if (c) {
        await supabase.from('cycles').update({ end_date: date }).eq('id', c.id)
        setLocalCycles(prev => prev.map(x => x.id === c.id ? { ...x, end_date: date } : x))
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCycle = async (person: Person) => {
    setSaving(true)
    try {
      const c = getCycle(person)
      if (c) {
        await supabase.from('cycles').delete().eq('id', c.id)
        setLocalCycles(prev => prev.filter(x => x.id !== c.id))
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSymptom = async (person: Person) => {
    setSaving(true)
    try {
      const existing = localSymptoms.find(s => s.person === person && s.date === date)
      if (existing) {
        await supabase.from('symptoms').delete().eq('id', existing.id)
        setLocalSymptoms(prev => prev.filter(s => s.id !== existing.id))
      }
      setForms(prev => ({ ...prev, [person]: { ...DEFAULT_FORM } }))
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const setForm = (person: Person, key: keyof SymptomForm, value: unknown) => {
    setForms(prev => ({ ...prev, [person]: { ...prev[person], [key]: value } }))
  }

  const person = PERSONS.find(p => p.key === tab)!
  const cycle = getCycle(tab)
  const cycleDay = getCycleDay(tab)
  const form = forms[tab]
  const existingSymptom = localSymptoms.find(s => s.person === tab && s.date === date)
  const isCycleStarted = !!cycleStarted[tab]

  const accentBg = tab === 'big' ? 'bg-rose-50' : tab === 'small' ? 'bg-yellow-50' : 'bg-teal-50'
  const accentText = tab === 'big' ? 'text-rose-500' : tab === 'small' ? 'text-yellow-500' : 'text-teal-600'
  const accentBtn = tab === 'big'
    ? 'bg-rose-400 hover:bg-rose-500'
    : tab === 'small'
    ? 'bg-yellow-400 hover:bg-yellow-500'
    : 'bg-teal-500 hover:bg-teal-600'
  const accentBorder = tab === 'big' ? 'border-rose-300' : tab === 'small' ? 'border-yellow-300' : 'border-teal-300'

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl sm:rounded-t-3xl border-b border-gray-100 px-5 py-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 text-base">{formatKorDate(date)}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Person tabs */}
          <div className="flex gap-2">
            {PERSONS.map(p => {
              const day = getCycleDay(p.key)
              const isActive = tab === p.key
              return (
                <button
                  key={p.key}
                  onClick={() => setTab(p.key)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? person.activeTabClass : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {p.label}
                  {day !== null && (
                    <span className={`text-xs ml-1 ${isActive ? 'opacity-80' : 'text-gray-400'}`}>
                      D+{day}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Cycle section */}
          <div className={`rounded-2xl p-4 ${accentBg}`}>
            <h3 className={`font-semibold text-sm mb-3 ${accentText}`}>🩸 생리 주기</h3>

            {cycle ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  시작일: <span className="font-medium text-gray-800">{formatKorDate(cycle.start_date)}</span>
                  {cycleDay && <span className={`ml-2 text-xs font-semibold ${accentText}`}>{cycleDay}일째</span>}
                </p>
                {cycle.end_date && (
                  <p className="text-sm text-gray-600">
                    종료일: <span className="font-medium text-gray-800">{formatKorDate(cycle.end_date)}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      ({Math.round((new Date(cycle.end_date).getTime() - new Date(cycle.start_date).getTime()) / 86400000) + 1}일)
                    </span>
                  </p>
                )}

                {/* 기간 수정 */}
                {editingPeriod ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">기간 수정</p>
                    <div className="flex gap-1.5">
                      {[4, 5, 6, 7, 8, 9, 10].map(d => (
                        <button
                          key={d}
                          onClick={() => setEditPeriodDays(d)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            editPeriodDays === d
                              ? `${accentBtn} text-white scale-105 shadow-sm`
                              : 'bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {d}일
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdatePeriod(tab)}
                        disabled={saving}
                        className={`flex-1 py-2 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50 ${accentBtn}`}
                      >
                        수정 완료
                      </button>
                      <button
                        onClick={() => setEditingPeriod(false)}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-500 text-sm font-medium"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {!isFuture && (
                      <button
                        onClick={() => {
                          const days = cycle.end_date
                            ? Math.round((new Date(cycle.end_date).getTime() - new Date(cycle.start_date).getTime()) / 86400000) + 1
                            : 6
                          setEditPeriodDays(Math.min(10, Math.max(4, days)))
                          setEditingPeriod(true)
                        }}
                        disabled={saving}
                        className="flex-1 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        기간 수정
                      </button>
                    )}
                    {!cycle.end_date && !isFuture && (
                      <button
                        onClick={() => handleEndCycle(tab)}
                        disabled={saving}
                        className="flex-1 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        종료로 기록
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCycle(tab)}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-white border border-red-200 hover:bg-red-50 text-red-400 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ) : !isFuture ? (
              <div className="space-y-3">
                {/* 기간 선택 */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">생리 기간</p>
                  <div className="flex gap-1.5">
                    {[4, 5, 6, 7, 8, 9, 10].map(d => (
                      <button
                        key={d}
                        onClick={() => setPeriodDays(d)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          periodDays === d
                            ? `${accentBtn} text-white scale-105 shadow-sm`
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {d}일
                      </button>
                    ))}
                  </div>
                </div>

                {/* 생리 시작일 버튼 or 선택됨 표시 */}
                {isCycleStarted ? (
                  <div className={`flex items-center justify-between bg-white border-2 ${accentBorder} rounded-xl px-4 py-2.5`}>
                    <span className={`text-sm font-semibold ${accentText}`}>
                      ✓ 생리 시작일 ({periodDays}일)
                    </span>
                    <button
                      onClick={() => setCycleStarted(prev => ({ ...prev, [tab]: false }))}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setCycleStarted(prev => ({ ...prev, [tab]: true }))}
                    className={`w-full py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${accentBtn}`}
                  >
                    생리 시작일
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">미래 날짜에는 기록할 수 없어요</p>
            )}
          </div>

          {/* Symptoms section */}
          {!isFuture && (
            <div>
              <h3 className={`font-semibold text-sm mb-3 ${accentText}`}>💊 증상 기록</h3>

              {/* Pain level */}
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">복통</label>
                <div className="flex gap-2">
                  {PAIN_LEVELS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setForm(tab, 'pain_level', value)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        form.pain_level === value
                          ? `${accentBtn} text-white`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Headache */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer py-1">
                  <div
                    onClick={() => setForm(tab, 'headache', !form.headache)}
                    className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors cursor-pointer ${
                      form.headache
                        ? `${accentBtn} border-transparent`
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {form.headache && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-sm text-gray-700">두통 있음</span>
                </label>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">
                  기타 증상
                  <span className="text-xs text-gray-400 ml-2">{form.notes.length}/80자</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => {
                    if (e.target.value.length <= 80) setForm(tab, 'notes', e.target.value)
                  }}
                  placeholder="오늘 몸 상태를 간단히 적어보세요"
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-rose-300 transition-colors"
                  rows={3}
                  maxLength={80}
                />
              </div>

              {/* Save / Delete buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSave(tab)}
                  disabled={saving}
                  className={`flex-1 py-3 rounded-xl text-white font-medium transition-colors disabled:opacity-50 ${accentBtn}`}
                >
                  {saving ? '저장 중...' : existingSymptom ? '수정' : '저장'}
                </button>
                {existingSymptom && (
                  <button
                    onClick={() => handleDeleteSymptom(tab)}
                    disabled={saving}
                    className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 font-medium transition-colors disabled:opacity-50"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
