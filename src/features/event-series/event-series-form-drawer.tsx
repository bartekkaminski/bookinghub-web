import { useState, useEffect } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  useCreateEventSeries, useUpdateEventSeries,
  parseRrule, buildRrule,
} from './use-event-series'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { DrawerSelect } from '@/shared/components/ui/drawer-select'
import { ColorPicker } from '@/shared/components/ui/color-picker'
import { useAllGroups } from '@/features/groups/use-groups'
import { useAllLocations } from '@/features/locations/use-locations'
import type { EventType, EventSeriesDetailResponse } from '@/api/types'
import { cn } from '@/shared/utils/cn'

interface EventSeriesFormDrawerProps {
  open: boolean
  onClose: () => void
  orgId: string
  seriesId?: string
  initialData?: EventSeriesDetailResponse
  onDelete?: () => void
}

interface FormValues {
  title: string
  description: string
  recurrenceDays: boolean[]
  defaultGroupId: string
  defaultLocationId: string
  defaultEventType: EventType
  defaultColor: string
  useColor: boolean
  isActive: boolean
}

const DEFAULT_COLOR = '#6d28d9'

function buildInitialValues(initialData?: EventSeriesDetailResponse): FormValues {
  if (initialData) {
    return {
      title: initialData.title,
      description: initialData.description ?? '',
      recurrenceDays: parseRrule(initialData.recurrenceRule),
      defaultGroupId: initialData.defaultGroupId ?? '',
      defaultLocationId: initialData.defaultLocationId ?? '',
      defaultEventType: initialData.defaultEventType,
      defaultColor: initialData.defaultColor ?? DEFAULT_COLOR,
      useColor: !!initialData.defaultColor,
      isActive: initialData.isActive,
    }
  }
  return {
    title: '',
    description: '',
    recurrenceDays: Array(7).fill(false) as boolean[],
    defaultGroupId: '',
    defaultLocationId: '',
    defaultEventType: 'GroupTraining',
    defaultColor: DEFAULT_COLOR,
    useColor: false,
    isActive: true,
  }
}

export function EventSeriesFormDrawer({
  open, onClose, orgId, seriesId, initialData, onDelete,
}: EventSeriesFormDrawerProps) {
  const { t } = useTranslation()
  const isEdit = !!seriesId && !!initialData

  const [form, setForm] = useState<FormValues>(() => buildInitialValues(initialData))

  useEffect(() => {
    if (open) setForm(buildInitialValues(initialData))
  }, [open, initialData])

  const createM = useCreateEventSeries(orgId)
  const updateM = useUpdateEventSeries(orgId, seriesId ?? '')
  const isPending = createM.isPending || updateM.isPending

  const { data: allGroups } = useAllGroups(orgId)
  const { data: allLocations } = useAllLocations(orgId)

  const set = <K extends keyof FormValues>(key: K, val: FormValues[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const toggleDay = (idx: number) =>
    setForm((f) => {
      const days = [...f.recurrenceDays]
      days[idx] = !days[idx]
      return { ...f, recurrenceDays: days }
    })

  const weekdays: string[] = t('eventSeries.weekdays', { returnObjects: true }) as string[]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const recurrenceRule = buildRrule(form.recurrenceDays)

    try {
      if (isEdit) {
        await updateM.mutateAsync({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          recurrenceRule,
          defaultGroupId: form.defaultGroupId || undefined,
          defaultLocationId: form.defaultLocationId || undefined,
          defaultColor: form.useColor ? form.defaultColor : undefined,
          defaultEventType: form.defaultEventType,
          isActive: form.isActive,
        })
        toast.success(t('eventSeries.updated'))
      } else {
        await createM.mutateAsync({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          recurrenceRule,
          defaultGroupId: form.defaultGroupId || undefined,
          defaultLocationId: form.defaultLocationId || undefined,
          defaultColor: form.useColor ? form.defaultColor : undefined,
          defaultEventType: form.defaultEventType,
        })
        toast.success(t('eventSeries.created'))
      }
      onClose()
    } catch {
      toast.error(isEdit ? t('eventSeries.updateFailed') : t('eventSeries.createFailed'))
    }
  }

  const typeOptions = [
    { value: 'GroupTraining', label: t('events.typeGroupTraining') },
    { value: 'IndividualSession', label: t('events.typeIndividualSession') },
    { value: 'Camp', label: t('events.typeCamp') },
    { value: 'Other', label: t('events.typeOther') },
  ]

  const groupOptions = [
    { value: '', label: t('events.noGroup') },
    ...(allGroups?.filter(g => g.isActive).map(g => ({ value: g.id, label: g.name })) ?? []),
  ]

  const locationOptions = [
    { value: '', label: t('events.noLocation') },
    ...(allLocations?.filter(l => l.isActive).map(l => ({ value: l.id, label: l.name })) ?? []),
  ]

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEdit ? t('eventSeries.editTitle') : t('eventSeries.createTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[70vh]">
          <form onSubmit={handleSubmit} className="px-4 space-y-4 pb-4">

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="series-title">{t('eventSeries.titleLabel')}</Label>
              <Input
                id="series-title"
                placeholder={t('eventSeries.titlePlaceholder')}
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>{t('eventSeries.descLabel')}</Label>
              <Textarea
                placeholder={t('eventSeries.descPlaceholder')}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={2}
              />
            </div>

            {/* Recurrence */}
            <div className="space-y-2">
              <Label>{t('eventSeries.recurrenceLabel')}</Label>
              <div className="flex gap-1.5 flex-wrap">
                {weekdays.map((day, idx) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={cn(
                      'h-9 w-9 rounded-lg text-xs font-medium border-2 transition-all',
                      form.recurrenceDays[idx]
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-background hover:bg-accent'
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Default type */}
            <div className="space-y-2">
              <Label>{t('eventSeries.defaultTypeLabel')}</Label>
              <DrawerSelect
                value={form.defaultEventType}
                onChange={(v) => set('defaultEventType', v as EventType)}
                options={typeOptions}
                title={t('eventSeries.defaultTypeLabel')}
              />
            </div>

            {/* Default group */}
            <div className="space-y-2">
              <Label>{t('eventSeries.defaultGroupLabel')}</Label>
              <DrawerSelect
                value={form.defaultGroupId}
                onChange={(v) => set('defaultGroupId', v)}
                options={groupOptions}
                title={t('eventSeries.defaultGroupLabel')}
              />
            </div>

            {/* Default location */}
            <div className="space-y-2">
              <Label>{t('eventSeries.defaultLocationLabel')}</Label>
              <DrawerSelect
                value={form.defaultLocationId}
                onChange={(v) => set('defaultLocationId', v)}
                options={locationOptions}
                title={t('eventSeries.defaultLocationLabel')}
              />
            </div>

            {/* Default color */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('eventSeries.defaultColorLabel')}</Label>
                <button
                  type="button"
                  onClick={() => set('useColor', !form.useColor)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {form.useColor ? t('events.inheritedColor') : t('common.add')}
                </button>
              </div>
              {form.useColor && (
                <ColorPicker value={form.defaultColor} onChange={(v) => set('defaultColor', v)} />
              )}
            </div>

            {/* Active toggle (edit only) */}
            {isEdit && (
              <button
                type="button"
                onClick={() => set('isActive', !form.isActive)}
                className="flex items-center gap-3 w-full text-left"
              >
                <div
                  className={cn(
                    'h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    form.isActive ? 'bg-primary border-primary' : 'border-input bg-background'
                  )}
                >
                  {form.isActive && (
                    <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{t('eventSeries.activeLabel')}</span>
              </button>
            )}
          </form>
        </div>
        <DrawerFooter>
          <Button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={!form.title.trim() || isPending}
            className="w-full"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEdit ? t('common.save') : t('eventSeries.createBtn')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.cancel')}
          </Button>
          {onDelete && (
            <Button variant="ghost" onClick={onDelete} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4 mr-2" />{t('eventSeries.deleteBtn')}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
