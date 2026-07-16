import { useState } from 'react'
import { useParams, useNavigate, useRouter } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import { ArrowLeft, Edit, CalendarDays, MapPin, Loader2, Clock, ChevronRight, CalendarRange } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import {
  useEventSeries, useDeleteEventSeries, formatRrule,
} from './use-event-series'
import { useCalendarEvents, getEventColor, getStatusColor } from '@/features/events/use-events'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { DetailSkeleton } from '@/shared/components/loading-skeletons'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { EventSeriesFormDrawer } from './event-series-form-drawer'
import { GenerateEventsDrawer } from './generate-events-drawer'
import { cn } from '@/shared/utils/cn'


function useDateLocale() {
  const { i18n } = useTranslation()
  return i18n.language === 'en' ? enUS : pl
}

export function EventSeriesDetailPage() {
  const { orgId, seriesId } = useParams({ strict: false }) as { orgId: string; seriesId: string }
  const router = useRouter()
  const navigate = useNavigate()
  const { isAdminOrManager, isAdmin } = useAuthStore()
  const { t } = useTranslation()
  const locale = useDateLocale()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)

  const { data: series, isLoading, isError, refetch } = useEventSeries(orgId, seriesId)
  const deleteM = useDeleteEventSeries(orgId)

  // Load upcoming events for this series (next 3 months)
  const now = new Date()
  const eventsParams = {
    from: format(now, "yyyy-MM-dd'T'00:00:00"),
    to: format(new Date(now.getFullYear(), now.getMonth() + 3, 0), "yyyy-MM-dd'T'23:59:59"),
  }
  const { data: calEvents } = useCalendarEvents(orgId, eventsParams)
  const seriesEvents = calEvents?.filter(e => e.eventSeriesId === seriesId) ?? []

  const weekdays: string[] = t('eventSeries.weekdays', { returnObjects: true }) as string[]

  if (isLoading) return <DetailSkeleton />
  if (isError || !series) return <ErrorState onRetry={refetch} />

  const handleDelete = async () => {
    try {
      await deleteM.mutateAsync(seriesId)
      toast.success(t('eventSeries.deleted'))
      router.history.back()
    } catch {
      toast.error(t('eventSeries.deleteFailed'))
    }
  }

  const recurrenceLabel = series.recurrenceRule
    ? t('eventSeries.recurrenceDisplay', { days: formatRrule(series.recurrenceRule, weekdays) })
    : t('eventSeries.noRecurrence')

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={series.title}
          back={
            <Button variant="outline" size="sm" onClick={() => router.history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
          action={
            isAdminOrManager() ? (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
                <Edit className="h-4 w-4" />{t('common.edit')}
              </Button>
            ) : undefined
          }
        />
      </div>

      {/* Status */}
      <div className="px-4 pt-4 flex items-center gap-2">
        <Badge className={cn('text-xs', series.isActive ? 'text-green-600 bg-green-50' : 'bg-secondary')}>
          {series.isActive ? t('common.active') : t('eventSeries.inactiveBadge')}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {t(`events.type${series.defaultEventType}`)}
        </Badge>
      </div>

      {/* Info section */}
      <div className="px-4 mt-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {t('eventSeries.sectionInfo')}
        </h3>
        {series.description && (
          <p className="text-sm text-muted-foreground mb-3">{series.description}</p>
        )}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm">{recurrenceLabel}</span>
          </div>
          {series.defaultGroupName && (
            <div className="flex items-center gap-2.5">
              <span className="h-4 w-4 text-muted-foreground flex-shrink-0 text-xs font-bold">G</span>
              <span className="text-sm">{series.defaultGroupName}</span>
            </div>
          )}
          {series.defaultLocationName && (
            <div className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{series.defaultLocationName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming events */}
      <div className="px-4 mt-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {t('eventSeries.sectionEvents')}
          {seriesEvents.length > 0 && (
            <span className="ml-1 normal-case font-normal">
              ({t('eventSeries.eventsCount', { count: seriesEvents.length })})
            </span>
          )}
        </h3>
        {seriesEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('calendar.noEvents')}</p>
        ) : (
          <div className="space-y-1">
            {seriesEvents.slice(0, 10).map((ev) => (
              <button
                key={ev.id}
                onClick={() => navigate({ to: `/org/${orgId}/events/${ev.id}` })}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent text-left transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getEventColor(ev) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ev.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(parseISO(ev.startTime), 'd MMM, HH:mm', { locale })}
                  </p>
                </div>
                {ev.status !== 'Scheduled' && (
                  <Badge variant="secondary" className={cn('text-[10px] px-1.5', getStatusColor(ev.status))}>
                    {t(`events.status${ev.status}`)}
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Generate events action */}
      {isAdminOrManager() && (
        <div className="px-4 mt-5">
          <Button
            className="w-full gap-2"
            onClick={() => setGenerateOpen(true)}
          >
            <CalendarRange className="h-4 w-4" />
            {t('eventSeries.generateBtn')}
          </Button>
        </div>
      )}

      {/* Edit drawer */}
      {isAdminOrManager() && (
        <EventSeriesFormDrawer
          open={editOpen}
          onClose={() => setEditOpen(false)}
          orgId={orgId}
          seriesId={seriesId}
          initialData={series}
          onDelete={isAdmin() ? () => { setEditOpen(false); setDeleteOpen(true) } : undefined}
        />
      )}

      {/* Generate events drawer */}
      {isAdminOrManager() && (
        <GenerateEventsDrawer
          open={generateOpen}
          onClose={() => setGenerateOpen(false)}
          orgId={orgId}
          series={series}
        />
      )}

      {/* Delete confirm */}
      <DeleteConfirmDrawer
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteM.isPending}
        t={t}
      />
    </div>
  )
}

function DeleteConfirmDrawer({
  open, onClose, onConfirm, isLoading, t,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('eventSeries.deleteBtn')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <p className="text-sm text-muted-foreground">{t('eventSeries.deleteConfirm')}</p>
        </div>
        <DrawerFooter>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('eventSeries.deleteBtn')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
