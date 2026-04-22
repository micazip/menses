export type Person = 'big' | 'small' | 'mom'

export interface PersonConfig {
  key: Person
  label: string
  color: string
  bgClass: string
  lightClass: string
  activeTabClass: string
  buttonClass: string
}

export const PERSONS: PersonConfig[] = [
  {
    key: 'big',
    label: '큰딸',
    color: '#f43f5e',
    bgClass: 'bg-rose-500',
    lightClass: 'bg-rose-50',
    activeTabClass: 'bg-rose-400 text-white',
    buttonClass: 'bg-rose-400 hover:bg-rose-500 text-white',
  },
  {
    key: 'small',
    label: '작은딸',
    color: '#8b5cf6',
    bgClass: 'bg-violet-500',
    lightClass: 'bg-violet-50',
    activeTabClass: 'bg-violet-400 text-white',
    buttonClass: 'bg-violet-400 hover:bg-violet-500 text-white',
  },
  {
    key: 'mom',
    label: '엄마',
    color: '#0d9488',
    bgClass: 'bg-teal-600',
    lightClass: 'bg-teal-50',
    activeTabClass: 'bg-teal-500 text-white',
    buttonClass: 'bg-teal-500 hover:bg-teal-600 text-white',
  },
]

export interface Cycle {
  id: string
  person: Person
  start_date: string
  end_date: string | null
  created_at: string
}

export interface Symptom {
  id: string
  person: Person
  date: string
  pain_level: number // 0: 없음, 1: 하, 2: 중, 3: 상
  headache: boolean
  notes: string | null
  created_at: string
}

export const PAIN_LEVELS = [
  { value: 0, label: '없음' },
  { value: 1, label: '하' },
  { value: 2, label: '중' },
  { value: 3, label: '상' },
]
