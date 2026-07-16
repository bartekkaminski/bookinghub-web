import { useEffect, useRef } from 'react'
import { format, parseISO, getHours, getMinutes } from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import { X, Users } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useLocationDaySchedule } from './use-locations'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/utils/cn'
import type { LocationDayEventResponse } from '@/api/types'

const HOUR_HEIGHT = 64   // px per hour
const DEFAULT_START = 7   // first always-visible hour
const DEFAULT_END   = 22  // exclusive upper bound for always-visible range (shows through 21:xx)

interface EventColumn {
  event: LocationDayEventResponse
  col: number
  totalCols: number
  top: number
  height: number
}

/** Oblicza widoczny zakres godzin na podstawie eventów dnia. */
function computeHourRange(events: LocationDayEventResponse[]): { startHour: number; endHour: number } {
  if (events.length === 0) return { startHour: DEFAULT_START, endHour: DEFAULT_END }

  const hasEarly = events.some(e => getHours(parseISO(e.startTime)) < DEFAULT_START)
  const hasLate  = events.some(e => {
    const sh = getHours(parseISO(e.startTime))
    const eh = getHours(parseISO(e.endTime))
    const em = getMinutes(parseISO(e.endTime))
    return sh >= DEFAULT_END - 1 || eh > DEFAULT_END - 1 || (eh === DEFAULT_END - 1 && em > 0)
  })

  return {
    startHour: hasEarly ? 0 : DEFAULT_START,
    endHour:   hasLate  ? 24 : DEFAULT_END,
  }
}

/**
 * Oblicza pozycje i liczbę kolumn dla nakładających się eventów.
 * Każdy event dostaje minimalną wolną kolumnę.
 * `startHour` przesuwa pozycje – godzina startHour:00 trafia na top=0.
 */
function layoutEvents(events: LocationDayEventResponse[], startHour: number): EventColumn[] {
  if (events.length === 0) return []

  const sorted = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  const columns: Array<{ endTime: number }> = []
  const layout: Array<{ event: LocationDayEventResponse; col: number; startMin: number; durationMin: number }> = []

  for (const ev of sorted) {
    const start    = parseISO(ev.startTime)
    const end      = parseISO(ev.endTime)
    const startMin = getHours(start) * 60 + getMinutes(start)
    const endMin   = getHours(end) * 60 + getMinutes(end)

    let col = 0
    while (columns[col] && columns[col].endTime > startMin) col++

    columns[col] = { endTime: endMin }
    layout.push({ event: ev, col, startMin, durationMin: Math.max(endMin - startMin, 15) })
  }

  const maxCol = columns.length
  const offsetMin = startHour * 60

  return layout.map(({ event, col, startMin, durationMin }) => ({
    event,
    col,
    totalCols: maxCol,
    top:    ((startMin - offsetMin) / 60) * HOUR_HEIGHT,
    height: Math.max((durationMin / 60) * HOUR_HEIGHT, 28),
  }))
}

function EventBlock({
  item,
  orgId,
}: {
  item: EventColumn
  orgId: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { event, col, totalCols, top, height } = item
  const cancelled = event.status === 'Cancelled'
  const short = height < 48

  const colWidth = 100 / totalCols
  const totalPeople =
    event.individualCount + event.teams.reduce((s, t) => s + t.memberCount, 0)

  return (
    <button
      type="button"
      onClick={() => navigate({ to: `/org/${orgId}/events/${event.id}` as never })}
      title={event.title}
      className={cn(
        'absolute border px-2 py-1 text-left overflow-hidden',
        'flex flex-col justify-start items-start',
        'text-xs transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        cancelled && 'opacity-50',
      )}
      style={{
        top:    `${top}px`,
        height: `${height}px`,
        left:   `${col * colWidth}%`,
        width:  `${colWidth}%`,
        backgroundColor: event.color ? `${event.color}33` : 'hsl(var(--primary)/0.15)',
        borderColor:     event.color ? `${event.color}66` : 'hsl(var(--primary)/0.4)',
      }}
    >
      <p className={cn('font-semibold leading-tight truncate', cancelled && 'line-through')}>
        {event.title}
      </p>

      {!short && (
        <div className="mt-0.5 space-y-0.5">
          {event.groupName && (
            <p className="truncate text-[10px] text-muted-foreground">
              {t('locations.schedule.day.group')}: {event.groupName}
            </p>
          )}
          {event.teams.map(team => (
            <p key={team.teamId} className="truncate text-[10px] text-muted-foreground">
              {t('locations.schedule.day.team')}: {team.teamName ?? '—'} · {team.memberCount} {t('locations.schedule.day.persons')}
            </p>
          ))}
          {event.individualCount > 0 && (
            <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Users className="h-2.5 w-2.5 flex-shrink-0" />
              {event.individualCount} {t('locations.schedule.day.persons')}
            </p>
          )}
        </div>
      )}

      {short && totalPeople > 0 && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <Users className="h-2.5 w-2.5 flex-shrink-0" />
          {totalPeople}
        </p>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  orgId: string
  locationId: string
  date: Date
  onClose: () => void
}

function useDateLocale() {
  const { i18n } = useTranslation()
  return i18n.language === 'en' ? enUS : pl
}

export function LocationDayView({ orgId, locationId, date, onClose }: Props) {
  const { t } = useTranslation()
  const locale   = useDateLocale()
  const dateStr  = format(date, 'yyyy-MM-dd')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useLocationDaySchedule(orgId, locationId, dateStr)

  const { startHour, endHour } = data
    ? computeHourRange(data.events)
    : { startHour: DEFAULT_START, endHour: DEFAULT_END }

  const hours    = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
  const layouted = data ? layoutEvents(data.events, startHour) : []

  // Auto-scroll to current hour on today's date
  useEffect(() => {
    if (!scrollRef.current) return
    const now = new Date()
    if (format(now, 'yyyy-MM-dd') === dateStr) {
      const currentHour = getHours(now)
      const scrollTo    = Math.max(0, (currentHour - startHour - 1) * HOUR_HEIGHT)
      scrollRef.current.scrollTop = scrollTo
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr, startHour])

  return (
    <div className="flex flex-col border-t border-border mt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div>
          <p className="text-sm font-semibold capitalize">
            {format(date, 'EEEE', { locale })}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(date, 'd MMMM yyyy', { locale })}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">{t('common.close')}</span>
        </Button>
      </div>

      {/* Timeline */}
      <div ref={scrollRef} className="pl-2 pr-4 pt-3">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="relative" style={{ height: `${(endHour - startHour) * HOUR_HEIGHT + 16}px` }}>

            {/* Hour rows */}
            {hours.map(hour => (
              <div
                key={hour}
                className="absolute w-full"
                style={{ top: `${(hour - startHour) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                {/* Full-hour line + label */}
                <div className="flex items-start w-full">
                  <div className="w-10 flex-shrink-0 text-right pr-1">
                    <span className="text-[11px] text-muted-foreground leading-none block -translate-y-1/2">
                      {hour === 24 ? '00:00' : `${String(hour).padStart(2, '0')}:00`}
                    </span>
                  </div>
                  <div className="ml-3 flex-1 border-t border-border/50" />
                </div>

                {/* Half-hour dashed line — only for non-closing hours */}
                {hour < endHour && (
                  <div
                    className="flex items-start w-full absolute"
                    style={{ top: `${HOUR_HEIGHT / 2}px` }}
                  >
                    <div className="w-10 flex-shrink-0" />
                    <div className="ml-3 flex-1 border-t border-dashed border-border/30" />
                  </div>
                )}
              </div>
            ))}

            {/* Event blocks */}
            <div
              className="absolute"
              style={{ left: 'calc(2.5rem + 0.75rem)', right: 0, top: 0, bottom: 0 }}
            >
              {layouted.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    {t('locations.schedule.day.noEvents')}
                  </p>
                </div>
              )}

              {layouted.map((item, idx) => (
                <EventBlock key={`${item.event.id}-${idx}`} item={item} orgId={orgId} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
