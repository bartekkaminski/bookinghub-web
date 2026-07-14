import { useMemo, useState } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, getDay, isToday, isSameMonth,
} from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAvailabilitySlots } from './use-availability'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/utils/cn'
import type { DayOfWeekName } from '@/api/types'
import { DAY_ORDER } from '@/shared/utils/availability'

interface Props {
  orgId: string
  memberId: string
  onDaySelect: (date: Date) => void
  selectedDate: Date | null
}

function useDateLocale() {
  const { i18n } = useTranslation()
  return i18n.language === 'en' ? enUS : pl
}

const WEEKDAYS_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
const WEEKDAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

/** Mapowanie JS getDay() → DayOfWeekName (0=Sun, 1=Mon ...) */
function jsDayToDayOfWeekName(jsDay: number): DayOfWeekName {
  return DAY_ORDER[(jsDay + 6) % 7]
}

export function AvailabilityMonthCalendar({
  orgId, memberId, onDaySelect, selectedDate,
}: Props) {
  const { t, i18n } = useTranslation()
  const locale = useDateLocale()

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const { data: slots, isLoading } = useAvailabilitySlots(orgId, memberId)

  /**
   * Zwraca true jeśli dla danej daty istnieje przynajmniej 1 aktywny slot.
   * Sprawdza dayOfWeek ORAZ zakres ValidFrom/ValidTo.
   */
  const isDayActive = useMemo(() => {
    const list = slots ?? []
    return (date: Date): boolean => {
      const dayName  = jsDayToDayOfWeekName(date.getDay())
      const dateStr  = format(date, 'yyyy-MM-dd')
      return list.some(s =>
        s.dayOfWeek === dayName &&
        (s.validFrom == null || s.validFrom <= dateStr) &&
        (s.validTo   == null || s.validTo   >= dateStr)
      )
    }
  }, [slots])

  const calendarDays = useMemo(() => {
    const start  = startOfMonth(currentMonth)
    const end    = endOfMonth(currentMonth)
    const days   = eachDayOfInterval({ start, end })
    const offset = (getDay(start) + 6) % 7
    return { days, startOffset: offset }
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
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          aria-label="Poprzedni miesiąc"
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
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          aria-label="Następny miesiąc"
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
          {Array.from({ length: calendarDays.startOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {calendarDays.days.map(day => {
            const key       = format(day, 'yyyy-MM-dd')
            const today     = isToday(day)
            const sameMonth = isSameMonth(day, currentMonth)
            const active    = selectedDate ? format(selectedDate, 'yyyy-MM-dd') === key : false
            const hasSlots  = isDayActive(day)

            return (
              <button
                key={key}
                type="button"
                onClick={() => onDaySelect(day)}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-lg border py-1.5 min-h-[40px] transition-all',
                  'text-sm font-medium hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  !sameMonth && 'opacity-30',
                  active
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : hasSlots
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-800'
                      : 'border-transparent',
                  today && !active && 'font-bold underline underline-offset-2',
                )}
              >
                <span className="leading-none">{format(day, 'd')}</span>
                {hasSlots && !active && (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-green-500" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded border border-transparent bg-card" />
          {t('availability.legend.unavailable')}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded bg-green-50 border border-green-200 dark:bg-green-950/40 dark:border-green-800" />
          {t('availability.legend.available')}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded bg-primary/5 border border-primary" />
          Wybrany
        </span>
      </div>
    </div>
  )
}
