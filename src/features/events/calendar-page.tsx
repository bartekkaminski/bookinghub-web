import { useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useRouter } from '@tanstack/react-router'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, getDay, isSameDay, isSameMonth, isToday,
  parseISO, startOfDay,
} from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Plus, Filter, CalendarDays, Clock, MapPin, X, LayoutList, Grid3X3, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/features/auth/auth-store'
import { useCalendarEvents, getEventColor, getStatusColor } from './use-events'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { cn } from '@/shared/utils/cn'
import type { EventCalendarResponse, EventType, EventStatus } from '@/api/types'
import { EventFormDrawer } from './event-form-drawer'
import { DrawerSelect } from '@/shared/components/ui/drawer-select'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'

type ViewMode = 'grid' | 'list'

function useDateLocale() {
  const { i18n } = useTranslation()
  return i18n.language === 'en' ? enUS : pl
}

export function CalendarPage() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const navigate = useNavigate()
  const router = useRouter()
  const { isAdminOrManager, isTrainer, isParticipant } = useAuthStore()
  const { t } = useTranslation()
  const locale = useDateLocale()

  const canManageEvents = isAdminOrManager() || isTrainer()
  const useMyCalendar = isParticipant() && !isAdminOrManager() && !isTrainer()

  const [view, setView] = useState<ViewMode>('grid')
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())
  const [createOpen, setCreateOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterType, setFilterType] = useState<EventType | ''>('')
  const [filterStatus, setFilterStatus] = useState<EventStatus | ''>('')

  // List view range state
  const [listMonthsBack, setListMonthsBack] = useState(0)
  const [listMonthsAhead, setListMonthsAhead] = useState(2)

  const calendarParams = useMemo(() => {
    if (view === 'list') {
      const today = new Date()
      const from = listMonthsBack > 0
        ? format(startOfMonth(subMonths(today, listMonthsBack)), "yyyy-MM-dd'T'00:00:00")
        : format(startOfDay(today), "yyyy-MM-dd'T'00:00:00")
      const to = format(endOfMonth(addMonths(today, listMonthsAhead)), "yyyy-MM-dd'T'23:59:59")
      return {
        from,
        to,
        ...(filterType ? { eventType: filterType } : {}),
        ...(filterStatus ? { status: filterStatus } : {}),
      }
    }
    return {
      from: format(startOfMonth(currentMonth), "yyyy-MM-dd'T'00:00:00"),
      to: format(endOfMonth(currentMonth), "yyyy-MM-dd'T'23:59:59"),
      ...(filterType ? { eventType: filterType } : {}),
      ...(filterStatus ? { status: filterStatus } : {}),
    }
  }, [view, currentMonth, filterType, filterStatus, listMonthsBack, listMonthsAhead])

  const { data: events, isLoading, isError, refetch } = useCalendarEvents(orgId, calendarParams, useMyCalendar)

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventCalendarResponse[]>()
    events?.forEach((ev) => {
      const key = format(parseISO(ev.startTime), 'yyyy-MM-dd')
      const existing = map.get(key) ?? []
      map.set(key, [...existing, ev])
    })
    return map
  }, [events])

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return []
    const key = format(selectedDay, 'yyyy-MM-dd')
    return eventsByDay.get(key) ?? []
  }, [selectedDay, eventsByDay])

  const goToPrevMonth = useCallback(() => setCurrentMonth(m => subMonths(m, 1)), [])
  const goToNextMonth = useCallback(() => setCurrentMonth(m => addMonths(m, 1)), [])
  const goToToday = useCallback(() => {
    const today = new Date()
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDay(today)
    setListMonthsBack(0)
    setListMonthsAhead(2)
  }, [])

  const months: string[] = t('calendar.months', { returnObjects: true }) as string[]
  const weekdays: string[] = t('calendar.weekdays', { returnObjects: true }) as string[]

  const monthLabel = `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  // Mon=0 ... Sun=6 (Polish standard)
  const startPad = (getDay(monthStart) + 6) % 7

  const hasActiveFilters = !!filterType || !!filterStatus

  const typeOptions = [
    { value: '', label: t('calendar.allTypes') },
    { value: 'GroupTraining', label: t('events.typeGroupTraining') },
    { value: 'IndividualSession', label: t('events.typeIndividualSession') },
    { value: 'Camp', label: t('events.typeCamp') },
    { value: 'Other', label: t('events.typeOther') },
  ]

  const statusOptions = [
    { value: '', label: t('calendar.allStatuses') },
    { value: 'Scheduled', label: t('events.statusScheduled') },
    { value: 'Cancelled', label: t('events.statusCancelled') },
    { value: 'Completed', label: t('events.statusCompleted') },
  ]

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur">
        <PageHeader
          title={useMyCalendar ? t('calendar.myCalendarTitle') : t('calendar.title')}
          back={
            <Button variant="outline" size="sm" onClick={() => router.history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
          action={
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs px-2">
                {t('calendar.today')}
              </Button>
              <Button
                variant={hasActiveFilters ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFiltersOpen(true)}
                className={cn('gap-1', hasActiveFilters && 'bg-primary text-primary-foreground')}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          }
        />
        <div className="border-b border-border" />

        {/* View toggle — centered below title */}
        <div className="pt-3 pb-3 px-4">
          <div className="flex w-full rounded-xl border border-border overflow-hidden bg-muted/40 p-0.5 gap-0.5">
            <button
              onClick={() => setView('grid')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-all',
                view === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
              )}
            >
              <Grid3X3 className="h-4 w-4" />
              {t('calendar.viewGrid')}
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium transition-all',
                view === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
              )}
            >
              <LayoutList className="h-4 w-4" />
              {t('calendar.viewList')}
            </button>
          </div>
        </div>

        {/* Month navigation — only in grid view */}
        {view === 'grid' && (
          <>
            <div className="flex items-center justify-between px-4 pb-3">
              <button
                onClick={goToPrevMonth}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                aria-label="Poprzedni miesiąc"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold capitalize">{monthLabel}</span>
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                aria-label="Następny miesiąc"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 px-2 pb-1">
              {weekdays.map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">
                  {d}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── GRID VIEW ── */}
      {view === 'grid' && (
        <>
          <div className="px-2 pt-1">
            {isLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-4">
                <ErrorState onRetry={refetch} />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {Array.from({ length: startPad }).map((_, i) => (
                  <div key={`pad-${i}`} className="aspect-square" />
                ))}
                {days.map((day) => {
                  const key = format(day, 'yyyy-MM-dd')
                  const dayEvents = eventsByDay.get(key) ?? []
                  const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
                  const todayDay = isToday(day)
                  const inMonth = isSameMonth(day, currentMonth)

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        'aspect-square flex flex-col items-center justify-start pt-1 rounded-xl transition-colors relative',
                        isSelected && 'bg-primary/15',
                        !isSelected && 'hover:bg-accent'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                          todayDay && !isSelected && 'border border-primary text-primary',
                          todayDay && isSelected && 'bg-primary text-primary-foreground',
                          isSelected && !todayDay && 'bg-primary/20 text-primary font-semibold',
                          !inMonth && 'opacity-30'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-full px-0.5">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <span
                              key={ev.id}
                              className={cn(
                                'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                ev.status === 'Cancelled' && 'opacity-40'
                              )}
                              style={{ backgroundColor: getEventColor(ev) }}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] text-muted-foreground leading-none mt-0.5">
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Selected day events — grid view */}
          <div className="flex-1 mt-2">
            <div className="border-t border-border" />
            {selectedDay ? (
              <>
                <div className="px-4 py-2 flex items-center justify-between">
                  <p className="text-sm font-medium capitalize">
                    {format(selectedDay, 'EEEE, d MMMM', { locale })}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {selectedDayEvents.length > 0 ? `${selectedDayEvents.length} zajęć` : ''}
                  </span>
                </div>
                {selectedDayEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                    <CalendarDays className="h-8 w-8 opacity-40" />
                    <p className="text-sm">{t('calendar.noEventsForDay')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {selectedDayEvents.map((ev) => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        onClick={() => navigate({ to: `/org/${orgId}/events/${ev.id}` })}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                <CalendarDays className="h-8 w-8 opacity-40" />
                <p className="text-sm">{t('calendar.selectDay')}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── LIST / AGENDA VIEW ── */}
      {view === 'list' && (
        <AgendaView
          events={events ?? []}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          orgId={orgId}
          navigate={navigate}
          locale={locale}
          t={t}
          listMonthsBack={listMonthsBack}
          listMonthsAhead={listMonthsAhead}
          onShowPast={() => setListMonthsBack(b => b + 1)}
          onLoadMore={() => setListMonthsAhead(a => a + 1)}
        />
      )}

      {/* FAB - create event */}
      {canManageEvents && (
        <button
          onClick={() => setCreateOpen(true)}
          className="fixed bottom-24 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-30 active:scale-95 transition-transform hover:bg-primary/90"
          style={{ right: 'max(1rem, calc((100vw - 48rem) / 2 + 1rem))' }}
          aria-label={t('calendar.newEvent')}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Create event drawer */}
      {canManageEvents && (
        <EventFormDrawer
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          orgId={orgId}
          initialDate={selectedDay ? format(selectedDay, 'yyyy-MM-dd') : undefined}
        />
      )}

      {/* Filters drawer */}
      <FiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filterType={filterType}
        filterStatus={filterStatus}
        onTypeChange={(v) => setFilterType(v as EventType | '')}
        onStatusChange={(v) => setFilterStatus(v as EventStatus | '')}
        onReset={() => { setFilterType(''); setFilterStatus('') }}
        typeOptions={typeOptions}
        statusOptions={statusOptions}
        t={t}
      />
    </div>
  )
}

function EventCard({ event, onClick }: { event: EventCalendarResponse; onClick: () => void }) {
  const { t } = useTranslation()
  const color = getEventColor(event)
  const isCancelled = event.status === 'Cancelled'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
    >
      <div
        className={cn('w-1 self-stretch rounded-full flex-shrink-0 min-h-8', isCancelled && 'opacity-40')}
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn('text-sm font-medium truncate', isCancelled && 'line-through text-muted-foreground')}>
            {event.title}
          </span>
          {event.status !== 'Scheduled' && (
            <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 flex-shrink-0', getStatusColor(event.status))}>
              {t(`events.status${event.status}`)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(parseISO(event.startTime), 'HH:mm')}–{format(parseISO(event.endTime), 'HH:mm')}
          </span>
          {event.locationName && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{event.locationName}</span>
            </span>
          )}
        </div>
        {event.trainerNames.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {t('calendar.trainers', { names: event.trainerNames.join(', ') })}
          </p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
    </button>
  )
}

function FiltersDrawer({
  open, onClose, filterType, filterStatus,
  onTypeChange, onStatusChange, onReset,
  typeOptions, statusOptions, t,
}: {
  open: boolean; onClose: () => void
  filterType: string; filterStatus: string
  onTypeChange: (v: string) => void; onStatusChange: (v: string) => void
  onReset: () => void
  typeOptions: { value: string; label: string }[]
  statusOptions: { value: string; label: string }[]
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            {t('calendar.filters')}
            {(filterType || filterStatus) && (
              <button
                onClick={() => { onReset(); onClose() }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('calendar.filterType')}</label>
            <DrawerSelect
              value={filterType}
              onChange={onTypeChange}
              options={typeOptions}
              title={t('calendar.filterType')}
              placeholder={t('calendar.allTypes')}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('calendar.filterStatus')}</label>
            <DrawerSelect
              value={filterStatus}
              onChange={onStatusChange}
              options={statusOptions}
              title={t('calendar.filterStatus')}
              placeholder={t('calendar.allStatuses')}
            />
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={onClose} className="w-full">{t('common.confirm')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

// ── Agenda / List View ────────────────────────────────────────────────────────

interface AgendaViewProps {
  events: EventCalendarResponse[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  orgId: string
  navigate: ReturnType<typeof useNavigate>
  locale: typeof pl | typeof enUS
  t: ReturnType<typeof useTranslation>['t']
  listMonthsBack: number
  listMonthsAhead: number
  onShowPast: () => void
  onLoadMore: () => void
}

function AgendaView({
  events, isLoading, isError, onRetry,
  orgId, navigate, locale, t,
  listMonthsBack, onShowPast, onLoadMore,
}: AgendaViewProps) {
  const today = startOfDay(new Date())
  const todayKey = format(today, 'yyyy-MM-dd')

  const grouped = useMemo(() => {
    const map = new Map<string, EventCalendarResponse[]>()
    for (const ev of events) {
      const key = format(parseISO(ev.startTime), 'yyyy-MM-dd')
      map.set(key, [...(map.get(key) ?? []), ev])
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [events])

  const pastGroups   = grouped.filter(([k]) => k <  todayKey)
  const todayGroup   = grouped.find (([k]) => k === todayKey)
  const futureGroups = grouped.filter(([k]) => k >  todayKey)

  if (isLoading) {
    return (
      <div className="px-4 pt-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return <div className="p-4"><ErrorState onRetry={onRetry} /></div>
  }

  const renderDayEvents = (dayEvents: EventCalendarResponse[]) =>
    dayEvents
      .slice()
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((ev) => (
        <EventCard
          key={ev.id}
          event={ev}
          onClick={() => navigate({ to: `/org/${orgId}/events/${ev.id}` })}
        />
      ))

  return (
    <div className="flex-1 pb-24">

      {/* ── "Pokaż wcześniejsze" ── */}
      <div className="px-4 pt-3 pb-2">
        <button
          onClick={onShowPast}
          className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border hover:border-primary/40 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('calendar.showPast')}
          {listMonthsBack > 0 && (
            <span className="ml-1 bg-primary/10 text-primary text-[10px] px-1.5 rounded-full">
              -{listMonthsBack}m
            </span>
          )}
        </button>
      </div>

      {/* ── PRZESZŁE DNI (opcjonalne, przygaszone) ── */}
      {pastGroups.length > 0 && (
        <div className="opacity-55">
          {pastGroups.map(([dateKey, dayEvents]) => {
            const date = new Date(dateKey + 'T00:00:00')
            return (
              <div key={dateKey}>
                <AgendaDayLabel date={date} locale={locale} isPast />
                <div className="divide-y divide-border">{renderDayEvents(dayEvents)}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── DZISIAJ — wyróżniony baner ── */}
      {todayGroup ? (
        <div className="mx-4 my-3 rounded-2xl overflow-hidden border border-primary/30 bg-primary/8 shadow-sm">
          {/* Baner nagłówkowy */}
          <div className="px-4 py-3 bg-primary/15 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
              {format(today, 'd')}
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-primary leading-tight">
                {t('calendar.todaySection')}
              </p>
              <p className="text-xs text-primary/70 capitalize leading-tight">
                {format(today, 'EEEE, d MMMM yyyy', { locale })}
              </p>
            </div>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
              {todayGroup[1].length}
            </span>
          </div>
          {/* Zajęcia dzisiaj */}
          <div className="divide-y divide-primary/10">
            {renderDayEvents(todayGroup[1])}
          </div>
        </div>
      ) : (
        /* Brak zajęć dzisiaj — placeholder */
        <div className="mx-4 my-3 rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-4 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
            {format(today, 'd')}
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">{t('calendar.todaySection')}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {format(today, 'EEEE, d MMMM yyyy', { locale })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('calendar.noEventsForDay')}</p>
          </div>
        </div>
      )}

      {/* ── PRZYSZŁE DNI — subtelne separatory ── */}
      {futureGroups.length === 0 && pastGroups.length === 0 && !todayGroup && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 px-4">
          <CalendarDays className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">{t('calendar.noUpcoming')}</p>
          <p className="text-xs text-center">{t('calendar.noUpcomingDesc')}</p>
        </div>
      )}

      {futureGroups.map(([dateKey, dayEvents]) => {
        const date = new Date(dateKey + 'T00:00:00')
        return (
          <div key={dateKey}>
            <AgendaDayLabel date={date} locale={locale} />
            <div className="divide-y divide-border">{renderDayEvents(dayEvents)}</div>
          </div>
        )
      })}

      {/* ── "Załaduj więcej" ── */}
      {futureGroups.length > 0 && (
        <div className="px-4 pt-3 pb-2">
          <button
            onClick={onLoadMore}
            className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border hover:border-primary/40 transition-colors"
          >
            {t('calendar.loadMore')}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

/** Subtelny separator z datą dla przyszłych/przeszłych dni */
function AgendaDayLabel({
  date, locale, isPast = false,
}: {
  date: Date
  locale: typeof pl | typeof enUS
  isPast?: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 mt-1">
      <p className={cn(
        'text-xs font-semibold capitalize',
        isPast ? 'text-muted-foreground' : 'text-foreground/70'
      )}>
        {format(date, 'EEEE, d MMMM', { locale })}
      </p>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
