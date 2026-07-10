import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { pl } from 'date-fns/locale'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'd MMM yyyy', { locale: pl })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'd MMM yyyy, HH:mm', { locale: pl })
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return `dziś ${format(d, 'HH:mm')}`
  if (isYesterday(d)) return `wczoraj ${format(d, 'HH:mm')}`
  return formatDistanceToNow(d, { addSuffix: true, locale: pl })
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'HH:mm')
}

export function getInitials(name?: string | null, fallback = '?'): string {
  if (!name) return fallback
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('')
}
