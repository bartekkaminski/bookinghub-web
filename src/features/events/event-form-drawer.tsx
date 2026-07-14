import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useCreateEvent, useUpdateEvent } from './use-events'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { DrawerSelect } from '@/shared/components/ui/drawer-select'
import { DatePickerInput } from '@/shared/components/ui/date-picker'
import { TimePickerInput } from '@/shared/components/ui/time-picker-input'
import { ColorPicker } from '@/shared/components/ui/color-picker'
import { useAllGroups } from '@/features/groups/use-groups'
import { useAllLocations } from '@/features/locations/use-locations'
import { useAllEventSeries } from '@/features/event-series/use-event-series'
import type { CreateEventRequest, UpdateEventRequest, EventType, EventDetailResponse } from '@/api/types'

interface EventFormDrawerProps {
  open: boolean
  onClose: () => void
  orgId: string
  eventId?: string
  initialData?: EventDetailResponse
  initialDate?: string
}

interface FormValues {
  title: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  eventType: EventType
  locationId: string
  groupId: string
  seriesId: string
  color: string
  unitCost: string
  currency: string
  useColor: boolean
}

const DEFAULT_EVENT_TYPE: EventType = 'GroupTraining'
const DEFAULT_COLOR = '#6d28d9'

function buildInitialValues(initialData?: EventDetailResponse, initialDate?: string): FormValues {
  if (initialData) {
    const start = parseISO(initialData.startTime)
    const end = parseISO(initialData.endTime)
    return {
      title: initialData.title,
      description: initialData.description ?? '',
      startDate: format(start, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      endDate: format(end, 'yyyy-MM-dd'),
      endTime: format(end, 'HH:mm'),
      eventType: initialData.eventType,
      locationId: initialData.locationId ?? '',
      groupId: initialData.groupId ?? '',
      seriesId: initialData.eventSeriesId ?? '',
      color: initialData.color ?? DEFAULT_COLOR,
      unitCost: initialData.unitCost != null ? String(initialData.unitCost) : '',
      currency: initialData.currency ?? 'PLN',
      useColor: !!initialData.color,
    }
  }
  const today = initialDate ?? format(new Date(), 'yyyy-MM-dd')
  return {
    title: '',
    description: '',
    startDate: today,
    startTime: '09:00',
    endDate: today,
    endTime: '10:00',
    eventType: DEFAULT_EVENT_TYPE,
    locationId: '',
    groupId: '',
    seriesId: '',
    color: DEFAULT_COLOR,
    unitCost: '',
    currency: 'PLN',
    useColor: false,
  }
}

export function EventFormDrawer({ open, onClose, orgId, eventId, initialData, initialDate }: EventFormDrawerProps) {
  const { t } = useTranslation()
  const isEdit = !!eventId && !!initialData

  const [form, setForm] = useState<FormValues>(() => buildInitialValues(initialData, initialDate))
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues | 'time', string>>>({})

  useEffect(() => {
    if (open) {
      setForm(buildInitialValues(initialData, initialDate))
      setErrors({})
    }
  }, [open, initialData, initialDate])

  const createM = useCreateEvent(orgId)
  const updateM = useUpdateEvent(orgId, eventId ?? '')
  const isPending = createM.isPending || updateM.isPending

  const { data: allGroups } = useAllGroups(orgId)
  const { data: allLocations } = useAllLocations(orgId)
  const { data: allSeries } = useAllEventSeries(orgId)

  const set = <K extends keyof FormValues>(key: K, val: FormValues[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const validate = (): boolean => {
    const errs: typeof errors = {}
    if (!form.title.trim()) errs.title = t('events.titleLabel')
    if (!form.startDate || !form.startTime) errs.startDate = t('events.startRequired')
    if (!form.endDate || !form.endTime) errs.endDate = t('events.endRequired')
    if (form.startDate && form.startTime && form.endDate && form.endTime) {
      const start = new Date(`${form.startDate}T${form.startTime}:00`)
      const end = new Date(`${form.endDate}T${form.endTime}:00`)
      if (end <= start) errs.time = t('events.endBeforeStart')
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const startTime = `${form.startDate}T${form.startTime}:00`
    const endTime = `${form.endDate}T${form.endTime}:00`
    const showCost = form.eventType === 'Camp' || form.eventType === 'Other'
    const unitCostVal = showCost && form.unitCost ? parseFloat(form.unitCost) : undefined

    try {
      if (isEdit) {
        const req: UpdateEventRequest = {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          startTime,
          endTime,
          eventType: form.eventType,
          locationId: form.locationId || undefined,
          groupId: form.groupId || undefined,
          color: form.useColor ? form.color : undefined,
          unitCost: unitCostVal,
          currency: unitCostVal ? form.currency : undefined,
        }
        await updateM.mutateAsync(req)
        toast.success(t('events.updated'))
      } else {
        const req: CreateEventRequest = {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          startTime,
          endTime,
          eventType: form.eventType,
          locationId: form.locationId || undefined,
          groupId: form.groupId || undefined,
          eventSeriesId: form.seriesId || undefined,
          color: form.useColor ? form.color : undefined,
          unitCost: unitCostVal,
          currency: unitCostVal ? form.currency : undefined,
        }
        await createM.mutateAsync(req)
        toast.success(t('events.created'))
      }
      onClose()
    } catch {
      toast.error(isEdit ? t('events.updateFailed') : t('events.createFailed'))
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

  const seriesOptions = [
    { value: '', label: t('events.noSeries') },
    ...(allSeries?.filter(s => s.isActive).map(s => ({ value: s.id, label: s.title })) ?? []),
  ]

  const showCostSection = form.eventType === 'Camp' || form.eventType === 'Other'

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEdit ? t('events.editTitle') : t('events.createTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[70vh]">
          <form onSubmit={handleSubmit} className="px-4 space-y-4 pb-4">

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="ev-title">{t('events.titleLabel')}</Label>
              <Input
                id="ev-title"
                placeholder={t('events.titlePlaceholder')}
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                autoFocus
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>{t('events.descLabel')}</Label>
              <Textarea
                placeholder={t('events.descPlaceholder')}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={2}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>{t('events.typeLabel')}</Label>
              <DrawerSelect
                value={form.eventType}
                onChange={(v) => set('eventType', v as EventType)}
                options={typeOptions}
                title={t('events.typeLabel')}
              />
            </div>

            {/* Start */}
            <div className="space-y-2">
              <Label>{t('events.dateFromLabel')}</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <DatePickerInput
                    value={form.startDate}
                    onChange={(v) => {
                      set('startDate', v)
                      if (!form.endDate || form.endDate < v) set('endDate', v)
                    }}
                  />
                </div>
                <div className="w-28">
                  <TimePickerInput
                    value={form.startTime}
                    onChange={(v) => set('startTime', v)}
                  />
                </div>
              </div>
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
            </div>

            {/* End */}
            <div className="space-y-2">
              <Label>{t('events.dateToLabel')}</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <DatePickerInput
                    value={form.endDate}
                    onChange={(v) => set('endDate', v)}
                  />
                </div>
                <div className="w-28">
                  <TimePickerInput
                    value={form.endTime}
                    onChange={(v) => set('endTime', v)}
                  />
                </div>
              </div>
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
              {errors.time && <p className="text-xs text-destructive">{errors.time}</p>}
            </div>

            {/* Group */}
            <div className="space-y-2">
              <Label>{t('events.groupLabel')}</Label>
              <DrawerSelect
                value={form.groupId}
                onChange={(v) => set('groupId', v)}
                options={groupOptions}
                title={t('events.groupLabel')}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>{t('events.locationLabel')}</Label>
              <DrawerSelect
                value={form.locationId}
                onChange={(v) => set('locationId', v)}
                options={locationOptions}
                title={t('events.locationLabel')}
              />
            </div>

            {/* Series (create only) */}
            {!isEdit && (
              <div className="space-y-2">
                <Label>{t('events.seriesLabel')}</Label>
                <DrawerSelect
                  value={form.seriesId}
                  onChange={(v) => set('seriesId', v)}
                  options={seriesOptions}
                  title={t('events.seriesLabel')}
                />
              </div>
            )}

            {/* Color */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('events.colorLabel')}</Label>
                <button
                  type="button"
                  onClick={() => set('useColor', !form.useColor)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {form.useColor ? t('events.inheritedColor') : t('common.add')}
                </button>
              </div>
              {form.useColor && (
                <ColorPicker value={form.color} onChange={(v) => set('color', v)} />
              )}
            </div>

            {/* Unit cost (Camp/Other) */}
            {showCostSection && (
              <div className="space-y-2">
                <Label>{t('events.unitCostLabel')}</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t('events.unitCostPlaceholder')}
                    value={form.unitCost}
                    onChange={(e) => set('unitCost', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    value={form.currency}
                    onChange={(e) => set('currency', e.target.value.toUpperCase().slice(0, 3))}
                    placeholder="PLN"
                    className="w-20"
                    maxLength={3}
                  />
                </div>
              </div>
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
            {isEdit ? t('common.save') : t('events.createBtn')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
