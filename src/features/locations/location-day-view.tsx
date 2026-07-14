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
const HOURS = Array.from({ length: 25 }, (_, i) => i)  // 0–24 (24 = zamknięcie dnia o północy)

interface EventColumn {
  event: LocationDayEventResponse
  col: number
  totalCols: number
  top: number
  height: number
}

/**
 * Oblicza pozycje i liczbę kolumn dla nakładających się eventów.
 * Każdy event dostaje minimalną wolną kolumnę.
 */
function layoutEvents(events: LocationDayEventResponse[]): EventColumn[] {
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

  return layout.map(({ event, col, startMin, durationMin }) => ({
    event,
    col,
    totalCols: maxCol,
    top:    (startMin / 60) * HOUR_HEIGHT,
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
      onClick={() => navigate({ to: `/app/org/${orgId}/events/${event.id}` as never })}
      title={event.title}
      className={cn(
        'absolute rounded-md border-l-4 px-2 py-1 text-left overflow-hidden',
        'text-xs transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        cancelled && 'opacity-50',
      )}
      style={{
        top:    `${top}px`,
        height: `${height}px`,
        left:   `${col * colWidth}%`,
        width:  `calc(${colWidth}% - 2px)`,
        backgroundColor: `${event.color}22`,
        borderLeftColor: event.color,
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

  const layouted = data ? layoutEvents(data.events) : []

  // Auto-scroll to current hour on today's date
  useEffect(() => {
    if (!scrollRef.current) return
    const now = new Date()
    if (format(now, 'yyyy-MM-dd') === dateStr) {
      const currentHour = getHours(now)
      const scrollTo    = Math.max(0, (currentHour - 1) * HOUR_HEIGHT)
      scrollRef.current.scrollTop = scrollTo
    } else {
      scrollRef.current.scrollTop = 6 * HOUR_HEIGHT  // Default: 06:00
    }
  }, [dateStr])

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
          <div className="relative" style={{ height: `${24 * HOUR_HEIGHT + 16}px` }}>

            {/* Hour rows */}
            {HOURS.map(hour => (
              <div
                key={hour}
                className="absolute w-full"
                style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                {/* Full-hour line + label */}
                <div className="flex items-start w-full">
                  <div className="w-10 flex-shrink-0 text-right pr-1">
                    <span className="text-[11px] text-muted-foreground leading-none block -translate-y-1/2">
                      {hour === 24 ? '00:00' : `${String(hour).padStart(2, '0')}:00`}
                    </span>
                  </div>
                  <div className="flex-1 border-t border-border/50" />
                </div>

                {/* Half-hour dashed line — only for hours 0–23 */}
                {hour < 24 && (
                  <div
                    className="flex items-start w-full absolute"
                    style={{ top: `${HOUR_HEIGHT / 2}px` }}
                  >
                    <div className="w-10 flex-shrink-0 text-right pr-1">
                      <span className="text-[10px] text-muted-foreground/40 leading-none block -translate-y-1/2">
                        {String(hour).padStart(2, '0')}:30
                      </span>
                    </div>
                    <div className="flex-1 border-t border-dashed border-border/30" />
                  </div>
                )}
              </div>
            ))}

            {/* Event blocks */}
            <div
              className="absolute"
              style={{ left: '2.5rem', right: '0.5rem', top: 0, bottom: 0 }}
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
