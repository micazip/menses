/** 로컬 시간 기준 YYYY-MM-DD 반환 (toISOString은 UTC라 한국 오전 9시 전에 날짜 오류 발생) */
export function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
