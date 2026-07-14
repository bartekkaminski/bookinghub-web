import type { DayOfWeekName } from '@/api/types'

/** Kolejność dni tygodnia Pn–Nd (europejska) */
export const DAY_ORDER: DayOfWeekName[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
]

/** "Monday" → indeks kolumny w siatce tygodniowej (0=Pn, 6=Nd) */
export function dayToColumnIndex(day: DayOfWeekName): number {
  return DAY_ORDER.indexOf(day)
}

/** "HH:mm:ss" → minuty od północy */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** "HH:mm:ss" → "HH:mm" (skrócony format wyświetlania) */
export function formatTime(t: string): string {
  return t.slice(0, 5)
}

/** Date → DayOfWeekName ('Monday' | ...) — Monday=0 w DAY_ORDER */
export function dateToDayName(date: Date): DayOfWeekName {
  // getDay(): 0=Sun, 1=Mon ... 6=Sat → mapowanie na Mon=0..Sun=6
  return DAY_ORDER[(date.getDay() + 6) % 7]
}

/** "yyyy-MM-dd" → string (identyczność, pomocnicze do porównań leksykograficznych) */
export function dateToIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
