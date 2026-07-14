import { useMemo, useState } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, getDay, isToday, isSameMonth,
} from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocationMonthSchedule } from './use-locations'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/utils/cn'
import type { LocationDaySummary, LocationOccupancy } from '@/api/types'

interface Props {
  orgId: string
  locationId: string
  onDaySelect: (date: Date) => void
  selectedDate: Date | null
}

function useDateLocale() {
  const { i18n } = useTranslation()
  return i18n.language === 'en' ? enUS : pl
}

function occupancyClasses(occupancy: LocationOccupancy): string {
  switch (occupancy) {
    case 'Full':    return 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800'
    case 'Partial': return 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
    default:        return 'border-transparent'
  }
}

function occupancyDotClass(occupancy: LocationOccupancy): string {
  switch (occupancy) {
    case 'Full':    return 'bg-red-500'
    case 'Partial': return 'bg-amber-400'
    default:        return 'bg-transparent'
  }
}

const WEEKDAYS_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
const WEEKDAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function LocationMonthCalendar({ orgId, locationId, onDaySelect, selectedDate }: Props) {
  const { t, i18n } = useTranslation()
  const locale = useDateLocale()

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year  = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1

  const { data, isLoading } = useLocationMonthSchedule(orgId, locationId, year, month)

  const dayMap = useMemo(() => {
    const map = new Map<string, LocationDaySummary>()
    data?.days.forEach(d => map.set(d.date, d))
    return map
  }, [data])

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end   = endOfMonth(currentMonth)
    const days  = eachDayOfInterval({ start, end })

    // Offset Monday=0 → move Sunday (0) to position 6
    const startOffset = (getDay(start) + 6) % 7

    return { days, startOffset }
  }, [currentMonth])

  const weekdays = i18n.language === 'en' ? WEEKDAYS_EN : WEEKDAYS_PL

  return (
    <div className="select-none">
      {/* ── Month navigation ── */}
      <div className="flex items-center justify-between mb-3 px-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label={t('locations.schedule.month.prev')}
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm font-semibold capitalize">
          {format(currentMonth, 'LLLL yyyy', { locale })}
        </span>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          aria-label={t('locations.schedule.month.next')}
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Weekday headers ── */}
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map(wd => (
          <div key={wd} className="text-center text-[11px] font-medium text-muted-foreground py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* ── Day grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: calendarDays.startOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {calendarDays.days.map(day => {
            const key     = format(day, 'yyyy-MM-dd')
            const summary = dayMap.get(key)
            const today   = isToday(day)
            const same    = isSameMonth(day, currentMonth)
            const active  = selectedDate ? format(selectedDate, 'yyyy-MM-dd') === key : false
            const occ     = summary?.occupancy ?? 'None'

            return (
              <button
                key={key}
                type="button"
                onClick={() => onDaySelect(day)}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-lg border py-1.5 min-h-[40px] transition-all',
                  'text-sm font-medium hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  !same && 'opacity-30',
                  active
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : occupancyClasses(occ),
                  today && !active && 'font-bold underline underline-offset-2',
                )}
                aria-label={`${key}${summary ? `, ${summary.eventCount} zajęć` : ''}`}
              >
                <span className="leading-none">{format(day, 'd')}</span>

                {summary && summary.eventCount > 0 && (
                  <span className="mt-0.5 flex items-center gap-0.5">
                    <span className={cn('h-1.5 w-1.5 rounded-full', occupancyDotClass(occ))} />
                    <span className="text-[10px] leading-none text-muted-foreground">
                      {summary.eventCount}
                    </span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded border border-border" />
          {t('locations.schedule.legend.none')}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800" />
          {t('locations.schedule.legend.partial')}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-800" />
          {t('locations.schedule.legend.full')}
        </span>
      </div>
    </div>
  )
}
