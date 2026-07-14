import { useState, useEffect, useMemo } from 'react'
import { Loader2, CalendarRange, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useGenerateEvents, parseRrule, formatRrule } from './use-event-series'
import { useAllGroups } from '@/features/groups/use-groups'
import { useAllLocations } from '@/features/locations/use-locations'
import { TimePickerInput } from '@/shared/components/ui/time-picker-input'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import type { EventSeriesDetailResponse } from '@/api/types'

interface GenerateEventsDrawerProps {
  open: boolean
  onClose: () => void
  orgId: string
  series: EventSeriesDetailResponse
}

function countMatchingDays(
  dateFrom: string,
  dateTo: string,
  rrule: string | undefined,
): number {
  if (!dateFrom || !dateTo || !rrule) return 0
  const from = new Date(dateFrom + 'T00:00:00')
  const to   = new Date(dateTo   + 'T00:00:00')
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) return 0

  const selectedDays = parseRrule(rrule)
  let count = 0
  const cur = new Date(from)

  while (cur <= to) {
    // getDay() returns 0=Sun, 1=Mon, ..., 6=Sat
    // parseRrule returns boolean[7] where index 0=Mon, 6=Sun
    const jsDay = cur.getDay()
    const rruleIdx = jsDay === 0 ? 6 : jsDay - 1
    if (selectedDays[rruleIdx]) count++
    cur.setDate(cur.getDate() + 1)
  }

  return count
}

export function GenerateEventsDrawer({ open, onClose, orgId, series }: GenerateEventsDrawerProps) {
  const { t } = useTranslation()

  const today = new Date().toISOString().slice(0, 10)
  const defaultTo = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 3)
    return d.toISOString().slice(0, 10)
  })()

  const [dateFrom,   setDateFrom]   = useState(today)
  const [dateTo,     setDateTo]     = useState(defaultTo)
  const [startTime,  setStartTime]  = useState('09:00')
  const [endTime,    setEndTime]    = useState('10:00')
  const [overrideGroupId,    setOverrideGroupId]    = useState<string>('')
  const [overrideLocationId, setOverrideLocationId] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const generateM = useGenerateEvents(orgId)
  const { data: allGroups    } = useAllGroups(orgId)
  const { data: allLocations } = useAllLocations(orgId)

  useEffect(() => {
    if (open) {
      setDateFrom(today)
      setDateTo(defaultTo)
      setStartTime('09:00')
      setEndTime('10:00')
      setOverrideGroupId('')
      setOverrideLocationId('')
      setErrors({})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const previewCount = useMemo(
    () => countMatchingDays(dateFrom, dateTo, series.recurrenceRule ?? undefined),
    [dateFrom, dateTo, series.recurrenceRule]
  )

  const dayLabels = t('eventSeries.weekdaysFull', { returnObjects: true }) as string[]
  const rruleLabel = series.recurrenceRule
    ? formatRrule(series.recurrenceRule, dayLabels)
    : null

  const validate = (): boolean => {
    const errs: Record<string, string> = {}

    if (!dateFrom) errs.dateFrom = t('common.required')
    if (!dateTo)   errs.dateTo   = t('common.required')

    if (dateFrom && dateTo) {
      const from = new Date(dateFrom)
      const to   = new Date(dateTo)
      if (from > to)   errs.dateTo = t('eventSeries.generateRangeError')

      const diffDays = Math.round((to.getTime() - from.getTime()) / 86400000)
      if (diffDays > 365) errs.dateTo = t('eventSeries.generateRangeLimit')
    }

    if (!startTime) errs.startTime = t('common.required')
    if (!endTime)   errs.endTime   = t('common.required')

    if (startTime && endTime && startTime >= endTime)
      errs.endTime = t('eventSeries.generateTimeError')

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      const result = await generateM.mutateAsync({
        seriesId: series.id,
        data: {
          dateFrom,
          dateTo,
          startTime,
          endTime,
          overrideGroupId:    overrideGroupId    || undefined,
          overrideLocationId: overrideLocationId || undefined,
        },
      })

      if (result.skippedCount > 0) {
        toast.success(
          t('eventSeries.generateSuccessSkipped', {
            count:   result.generatedCount,
            skipped: result.skippedCount,
          })
        )
      } else {
        toast.success(t('eventSeries.generateSuccess', { count: result.generatedCount }))
      }

      onClose()
    } catch {
      toast.error(t('eventSeries.generateFailed'))
    }
  }

  const hasNoRule = !series.recurrenceRule

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-primary" />
            {t('eventSeries.generateTitle')}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-5 overflow-y-auto max-h-[70vh]">

          {/* Informacja o serii */}
          <div className="rounded-xl bg-muted/50 p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {series.title}
            </p>
            {rruleLabel ? (
              <p className="text-sm font-medium">
                {t('eventSeries.recurrenceDisplay', { days: rruleLabel })}
              </p>
            ) : (
              <p className="text-sm text-destructive font-medium">
                {t('eventSeries.generateNoRule')}
              </p>
            )}
          </div>

          {hasNoRule && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 flex gap-2">
              <Info className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{t('eventSeries.generateNoRule')}</p>
            </div>
          )}

          {!hasNoRule && (
            <>
              {/* Zakres dat */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('eventSeries.generateDateFrom')}</Label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                  />
                  {errors.dateFrom && <p className="text-xs text-destructive">{errors.dateFrom}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('eventSeries.generateDateTo')}</Label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    min={dateFrom}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                  />
                  {errors.dateTo && <p className="text-xs text-destructive">{errors.dateTo}</p>}
                </div>
              </div>

              {/* Godziny */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('eventSeries.generateStartTime')}</Label>
                  <TimePickerInput value={startTime} onChange={setStartTime} />
                  {errors.startTime && <p className="text-xs text-destructive">{errors.startTime}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('eventSeries.generateEndTime')}</Label>
                  <TimePickerInput value={endTime} onChange={setEndTime} />
                  {errors.endTime && <p className="text-xs text-destructive">{errors.endTime}</p>}
                </div>
              </div>

              {/* Podgląd */}
              {previewCount > 0 && (
                <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 flex items-center gap-3">
                  <CalendarRange className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {t('eventSeries.generatePreviewDays', { count: previewCount })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {startTime} – {endTime}
                    </p>
                  </div>
                </div>
              )}

              {/* Nadpisanie grupy */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('eventSeries.generateOverrideGroup')}</Label>
                <select
                  value={overrideGroupId}
                  onChange={(e) => setOverrideGroupId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                >
                  <option value="">{t('eventSeries.generateUseDefault')}{series.defaultGroupName ? ` (${series.defaultGroupName})` : ''}</option>
                  {allGroups?.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* Nadpisanie lokalizacji */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('eventSeries.generateOverrideLocation')}</Label>
                <select
                  value={overrideLocationId}
                  onChange={(e) => setOverrideLocationId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                >
                  <option value="">{t('eventSeries.generateUseDefault')}{series.defaultLocationName ? ` (${series.defaultLocationName})` : ''}</option>
                  {allLocations?.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              {/* Opis */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('eventSeries.generateDesc')}
              </p>
            </>
          )}
        </div>

        <DrawerFooter>
          {!hasNoRule && (
            <Button
              onClick={handleSubmit}
              disabled={generateM.isPending || previewCount === 0}
              className="w-full"
            >
              {generateM.isPending
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <CalendarRange className="h-4 w-4 mr-2" />
              }
              {previewCount > 0
                ? t('eventSeries.generateSubmit') + ` (${previewCount})`
                : t('eventSeries.generateSubmit')
              }
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
