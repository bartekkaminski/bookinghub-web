import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { CalendarRange, ChevronRight, Search, Plus, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useEventSeriesList } from './use-event-series'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { ListSkeleton } from '@/shared/components/loading-skeletons'
import { EmptyState } from '@/shared/components/empty-state'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { EventSeriesFormDrawer } from './event-series-form-drawer'
import { formatRrule } from './use-event-series'

export function EventSeriesListPage() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const navigate = useNavigate()
  const { isAdminOrManager } = useAuthStore()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError, refetch } = useEventSeriesList(orgId, {
    search: debouncedSearch || undefined,
    pageSize: 50,
  })

  const weekdays: string[] = t('eventSeries.weekdays', { returnObjects: true }) as string[]

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={t('eventSeries.title')}
          back={
            <Button variant="outline" size="sm" onClick={() => navigate({ to: `/app/org/${orgId}/calendar` })}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
          action={
            isAdminOrManager() ? (
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />{t('common.add')}
              </Button>
            ) : undefined
          }
        />
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('eventSeries.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : data?.items.length === 0 ? (
        <EmptyState
          icon={<CalendarRange className="h-8 w-8" />}
          title={t('eventSeries.noSeries')}
          description={t('eventSeries.noSeriesDesc')}
          action={
            isAdminOrManager() ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>{t('eventSeries.createSeries')}</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {data?.items.map((series) => {
            const recurrenceLabel = series.recurrenceRule
              ? formatRrule(series.recurrenceRule, weekdays)
              : null

            return (
              <button
                key={series.id}
                onClick={() => navigate({ to: `/app/org/${orgId}/event-series/${series.id}` })}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
              >
                <div
                  className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: series.defaultColor ?? '#6d28d9' }}
                >
                  {series.title.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{series.title}</span>
                    {!series.isActive && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {t('eventSeries.inactiveBadge')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {recurrenceLabel
                      ? t('eventSeries.recurrenceDisplay', { days: recurrenceLabel })
                      : t('eventSeries.noRecurrence')}
                    {series.defaultGroupName ? ` · ${series.defaultGroupName}` : ''}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            )
          })}
        </div>
      )}

      {isAdminOrManager() && (
        <EventSeriesFormDrawer
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          orgId={orgId}
        />
      )}
    </div>
  )
}
