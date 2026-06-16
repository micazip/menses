'use client'

import { useState } from 'react'
import { Person, PersonConfig } from '@/types'
import { savePersonSetting } from '@/app/actions'

interface Props {
  person: PersonConfig
  currentLength: number
  onClose: () => void
  onSaved: (newLength: number) => void
}

const CYCLE_LENGTHS = [27, 28, 29, 30, 31]

export default function PersonSettingsModal({ person, currentLength, onClose, onSaved }: Props) {
  const [selected, setSelected] = useState(currentLength)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const result = await savePersonSetting(person.key, selected)
    setSaving(false)
    if (!result.success) {
      alert('저장 실패: ' + result.error)
      return
    }
    onSaved(selected)
  }

  const accentBtn =
    person.key === 'big'
      ? 'bg-rose-400 hover:bg-rose-500'
      : person.key === 'small'
      ? 'bg-yellow-400 hover:bg-yellow-500'
      : 'bg-teal-500 hover:bg-teal-600'

  const accentBg =
    person.key === 'big' ? 'bg-rose-50' : person.key === 'small' ? 'bg-yellow-50' : 'bg-teal-50'

  const accentText =
    person.key === 'big'
      ? 'text-rose-500'
      : person.key === 'small'
      ? 'text-yellow-500'
      : 'text-teal-600'

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: person.color }}
            />
            <h2 className={`font-bold text-base ${accentText}`}>{person.label} 주기 설정</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">생리 주기(일수)를 선택해주세요</p>

        <div className={`rounded-2xl p-4 ${accentBg} mb-5`}>
          <div className="flex gap-2 justify-between">
            {CYCLE_LENGTHS.map(len => (
              <button
                key={len}
                onClick={() => setSelected(len)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  selected === len
                    ? `${accentBtn} text-white scale-105 shadow-sm`
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {len}일
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded-xl text-white font-medium transition-colors disabled:opacity-50 ${accentBtn}`}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
