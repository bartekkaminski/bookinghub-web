import { useState, useEffect, useMemo } from 'react'
import { format, parseISO, addMonths } from 'date-fns'
import { Loader2, CalendarRange, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  useCreateEvent,
  useCreateRecurringEvents,
  useUpdateEvent,
  countMatchingDays,
  selectedDaysToDotNet,
} from './use-events'
import {
  SelectEventMembersDrawer,
  SelectEventTeamsDrawer,
  SelectedMembersSummary,
  SelectedTeamsSummary,
} from './select-event-participants-drawer'
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
import type { CreateEventRequest, CreateRecurringEventsRequest, UpdateEventRequest, EventType, EventDetailResponse } from '@/api/types'
import { cn } from '@/shared/utils/cn'
import { useAuthStore } from '@/features/auth/auth-store'

interface EventFormDrawerProps {
  open: boolean
  onClose: () => void
  orgId: string
  eventId?: string
  initialData?: EventDetailResponse
  initialDate?: string
}

type EventMode = 'single' | 'recurring'

interface FormValues {
  mode: EventMode
  title: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  eventType: EventType
  locationId: string
  groupId: string
  color: string
  recurrenceDays: boolean[]
  rangeFrom: string
  rangeTo: string
  memberIds: string[]
  teamIds: string[]
}

const DEFAULT_EVENT_TYPE: EventType = 'GroupTraining'
const DEFAULT_COLOR = '#6d28d9'

function defaultRangeTo(): string {
  return format(addMonths(new Date(), 3), 'yyyy-MM-dd')
}

function buildInitialValues(initialData?: EventDetailResponse, initialDate?: string): FormValues {
  if (initialData) {
    const start = parseISO(initialData.startTime)
    const end = parseISO(initialData.endTime)
    return {
      mode: 'single',
      title: initialData.title,
      description: initialData.description ?? '',
      startDate: format(start, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      endDate: format(end, 'yyyy-MM-dd'),
      endTime: format(end, 'HH:mm'),
      eventType: initialData.eventType,
      locationId: initialData.locationId ?? '',
      groupId: initialData.groupId ?? '',
      color: initialData.color ?? DEFAULT_COLOR,
      recurrenceDays: Array(7).fill(false) as boolean[],
      rangeFrom: format(new Date(), 'yyyy-MM-dd'),
      rangeTo: defaultRangeTo(),
      memberIds: [],
      teamIds: [],
    }
  }
  const today = initialDate ?? format(new Date(), 'yyyy-MM-dd')
  return {
    mode: 'single',
    title: '',
    description: '',
    startDate: today,
    startTime: '09:00',
    endDate: today,
    endTime: '10:00',
    eventType: DEFAULT_EVENT_TYPE,
    locationId: '',
    groupId: '',
    color: DEFAULT_COLOR,
    recurrenceDays: Array(7).fill(false) as boolean[],
    rangeFrom: today,
    rangeTo: defaultRangeTo(),
    memberIds: [],
    teamIds: [],
  }
}

export function EventFormDrawer({ open, onClose, orgId, eventId, initialData, initialDate }: EventFormDrawerProps) {
  const { t } = useTranslation()
  const { isAdminOrManager } = useAuthStore()
  const isEdit = !!eventId && !!initialData
  const canCreateRecurring = isAdminOrManager()

  const [form, setForm] = useState<FormValues>(() => buildInitialValues(initialData, initialDate))
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false)
  const [teamsDrawerOpen, setTeamsDrawerOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(buildInitialValues(initialData, initialDate))
      setErrors({})
      setMembersDrawerOpen(false)
      setTeamsDrawerOpen(false)
    }
  }, [open, initialData, initialDate])

  const createM = useCreateEvent(orgId)
  const createRecurringM = useCreateRecurringEvents(orgId)
  const updateM = useUpdateEvent(orgId, eventId ?? '')
  const isPending = createM.isPending || createRecurringM.isPending || updateM.isPending

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

  const weekdays: string[] = t('events.weekdays', { returnObjects: true }) as string[]

  const previewCount = useMemo(
    () =>
      form.mode === 'recurring'
        ? countMatchingDays(form.rangeFrom, form.rangeTo, form.recurrenceDays)
        : 0,
    [form.mode, form.rangeFrom, form.rangeTo, form.recurrenceDays],
  )

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = t('events.titleLabel')

    if (form.mode === 'single' || isEdit) {
      if (!form.startDate || !form.startTime) errs.startDate = t('events.startRequired')
      if (!form.endDate || !form.endTime) errs.endDate = t('events.endRequired')
      if (form.startDate && form.startTime && form.endDate && form.endTime) {
        const start = new Date(`${form.startDate}T${form.startTime}:00`)
        const end = new Date(`${form.endDate}T${form.endTime}:00`)
        if (end <= start) errs.time = t('events.endBeforeStart')
      }
    } else {
      if (!form.rangeFrom) errs.rangeFrom = t('common.required')
      if (!form.rangeTo) errs.rangeTo = t('common.required')
      if (form.rangeFrom && form.rangeTo && form.rangeFrom > form.rangeTo) {
        errs.rangeTo = t('events.recurringRangeError')
      }
      if (form.rangeFrom && form.rangeTo) {
        const from = new Date(form.rangeFrom)
        const to = new Date(form.rangeTo)
        const diffDays = Math.round((to.getTime() - from.getTime()) / 86400000)
        if (diffDays > 365) errs.rangeTo = t('events.recurringRangeLimit')
      }
      if (!form.startTime) errs.startTime = t('common.required')
      if (!form.endTime) errs.endTime = t('common.required')
      if (form.startTime && form.endTime && form.startTime >= form.endTime) {
        errs.endTime = t('events.endBeforeStart')
      }
      if (!form.recurrenceDays.some(Boolean)) {
        errs.recurrenceDays = t('events.recurringDaysRequired')
      }
      if (previewCount === 0 && form.recurrenceDays.some(Boolean)) {
        errs.rangeTo = t('events.recurringNoMatches')
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const groupId = isEdit
      ? (initialData?.groupId || undefined)
      : form.eventType !== 'IndividualSession'
        ? (form.groupId || undefined)
        : undefined
    const showEnrollments = form.eventType !== 'GroupTraining'
    const memberIds = showEnrollments && form.memberIds.length > 0 ? form.memberIds : undefined
    const teamIds = showEnrollments && form.teamIds.length > 0 ? form.teamIds : undefined

    try {
      if (isEdit) {
        const req: UpdateEventRequest = {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          startTime: `${form.startDate}T${form.startTime}:00`,
          endTime: `${form.endDate}T${form.endTime}:00`,
          eventType: form.eventType,
          locationId: form.locationId || undefined,
          groupId,
          color: form.color,
          // Koszt nie jest edytowany w tym formularzu — zachowaj istniejący.
          unitCost: initialData?.unitCost,
          currency: initialData?.currency,
        }
        await updateM.mutateAsync(req)
        toast.success(t('events.updated'))
      } else if (form.mode === 'recurring') {
        const req: CreateRecurringEventsRequest = {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          eventType: form.eventType,
          locationId: form.locationId || undefined,
          groupId,
          color: form.color,
          memberIds,
          teamIds,
          dateFrom: form.rangeFrom,
          dateTo: form.rangeTo,
          startTime: form.startTime,
          endTime: form.endTime,
          daysOfWeek: selectedDaysToDotNet(form.recurrenceDays),
        }
        const result = await createRecurringM.mutateAsync(req)
        toast.success(t('events.recurringCreated', { count: result.generatedCount }))
      } else {
        const req: CreateEventRequest = {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          startTime: `${form.startDate}T${form.startTime}:00`,
          endTime: `${form.endDate}T${form.endTime}:00`,
          eventType: form.eventType,
          locationId: form.locationId || undefined,
          groupId,
          color: form.color,
          memberIds,
          teamIds,
        }
        await createM.mutateAsync(req)
        toast.success(t('events.created'))
      }
      onClose()
    } catch {
      toast.error(
        isEdit
          ? t('events.updateFailed')
          : form.mode === 'recurring'
            ? t('events.recurringCreateFailed')
            : t('events.createFailed'),
      )
    }
  }

  const hasLockedGroup = isEdit && !!initialData?.groupId

  const typeOptions = [
    { value: 'GroupTraining', label: t('events.typeGroupTraining') },
    // Przy przypisanej grupie nie wolno przełączyć na indywidualne
    ...(!hasLockedGroup
      ? [{ value: 'IndividualSession', label: t('events.typeIndividualSession') }]
      : []),
    { value: 'Camp', label: t('events.typeCamp') },
    { value: 'Other', label: t('events.typeOther') },
  ]

  const groupOptions = [
    { value: '', label: t('events.noGroup') },
    ...(allGroups?.filter(g => g.isActive).map(g => ({ value: g.id, label: g.name })) ?? []),
  ]

  const lockedGroupName =
    allGroups?.find((g) => g.id === initialData?.groupId)?.name
    ?? initialData?.groupName
    ?? t('events.noGroup')

  const locationOptions = [
    { value: '', label: t('events.noLocation') },
    ...(allLocations?.filter(l => l.isActive).map(l => ({ value: l.id, label: l.name })) ?? []),
  ]

  const isRecurringCreate = !isEdit && form.mode === 'recurring'
  const showParticipants = !isEdit && form.eventType !== 'GroupTraining'

  const submitLabel = isEdit
    ? t('common.save')
    : isRecurringCreate && previewCount > 0
      ? `${t('events.createBtn')} (${previewCount})`
      : t('events.createBtn')

  return (
    <>
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEdit ? t('events.editTitle') : t('events.createTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[70vh]">
          <form onSubmit={handleSubmit} className="px-4 space-y-4 pb-4">

            {/* Mode toggle — create only, Admin/Manager */}
            {!isEdit && canCreateRecurring && (
              <div className="flex rounded-xl border border-border overflow-hidden bg-muted/40 p-0.5 gap-0.5">
                {(['single', 'recurring'] as EventMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set('mode', m)}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                      form.mode === m
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/60',
                    )}
                  >
                    {m === 'single' ? t('events.modeSingle') : t('events.modeRecurring')}
                  </button>
                ))}
              </div>
            )}

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
                onChange={(v) => {
                  const next = v as EventType
                  setForm((f) => ({
                    ...f,
                    eventType: next,
                    groupId: next === 'IndividualSession' ? '' : f.groupId,
                    // Na froncie ukrywamy zapisy dla treningu grupowego — czyścimy wybór lokalnie.
                    memberIds: next === 'GroupTraining' ? [] : f.memberIds,
                    teamIds: next === 'GroupTraining' ? [] : f.teamIds,
                  }))
                }}
                options={typeOptions}
                title={t('events.typeLabel')}
              />
            </div>

            {/* Group — ukryte dla indywidualnych; w edycji nieedytowalne */}
            {(form.eventType !== 'IndividualSession' || hasLockedGroup) && (
              <div className="space-y-2">
                <Label>{t('events.groupLabel')}</Label>
                {isEdit ? (
                  <>
                    <div className="rounded-xl border border-input bg-muted/40 px-3 py-2.5 text-sm">
                      {lockedGroupName}
                    </div>
                    <p className="text-xs text-muted-foreground">{t('events.groupLockedHint')}</p>
                  </>
                ) : (
                  <>
                    <DrawerSelect
                      value={form.groupId}
                      onChange={(v) => set('groupId', v)}
                      options={groupOptions}
                      title={t('events.groupLabel')}
                    />
                    {form.groupId && (
                      <p className="text-xs text-muted-foreground">
                        {t('events.groupAutoEnrollHint')}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Single: date+time range */}
            {(isEdit || form.mode === 'single') && (
              <>
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
              </>
            )}

            {/* Recurring: days + date range + times */}
            {isRecurringCreate && (
              <>
                <div className="space-y-2">
                  <Label>{t('events.recurrenceLabel')}</Label>
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
                            : 'border-border bg-background hover:bg-accent',
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {errors.recurrenceDays && (
                    <p className="text-xs text-destructive">{errors.recurrenceDays}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('events.recurringDateFrom')}</Label>
                    <DatePickerInput
                      value={form.rangeFrom}
                      onChange={(v) => set('rangeFrom', v)}
                    />
                    {errors.rangeFrom && <p className="text-xs text-destructive">{errors.rangeFrom}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('events.recurringDateTo')}</Label>
                    <DatePickerInput
                      value={form.rangeTo}
                      onChange={(v) => set('rangeTo', v)}
                    />
                    {errors.rangeTo && <p className="text-xs text-destructive">{errors.rangeTo}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('events.recurringStartTime')}</Label>
                    <TimePickerInput value={form.startTime} onChange={(v) => set('startTime', v)} />
                    {errors.startTime && <p className="text-xs text-destructive">{errors.startTime}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('events.recurringEndTime')}</Label>
                    <TimePickerInput value={form.endTime} onChange={(v) => set('endTime', v)} />
                    {errors.endTime && <p className="text-xs text-destructive">{errors.endTime}</p>}
                  </div>
                </div>

                {previewCount > 0 && (
                  <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 flex items-center gap-3">
                    <CalendarRange className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {t('events.recurringPreview', { count: previewCount })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {form.startTime} – {form.endTime}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

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

            {/* Color */}
            <div className="space-y-2">
              <Label>{t('events.colorLabel')}</Label>
              <ColorPicker value={form.color} onChange={(v) => set('color', v)} />
            </div>

            {/* Uczestnicy + zespoły — create only: osobne sekcje i drawery */}
            {showParticipants && (
              <>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label>{t('events.participantsLabel')}</Label>
                    {form.memberIds.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {t('events.participantsSelected', { count: form.memberIds.length })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('events.participantsHint')}</p>
                  <SelectedMembersSummary
                    orgId={orgId}
                    memberIds={form.memberIds}
                    onRemove={(id) => set('memberIds', form.memberIds.filter((x) => x !== id))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setMembersDrawerOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('events.selectMembersBtn')}
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label>{t('events.teamsLabel')}</Label>
                    {form.teamIds.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {t('events.teamsSelected', { count: form.teamIds.length })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('events.teamsHint')}</p>
                  <SelectedTeamsSummary
                    orgId={orgId}
                    teamIds={form.teamIds}
                    onRemove={(id) => set('teamIds', form.teamIds.filter((x) => x !== id))}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setTeamsDrawerOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('events.selectTeamsBtn')}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
        <DrawerFooter>
          <Button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={!form.title.trim() || isPending || (isRecurringCreate && previewCount === 0)}
            className="w-full"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {submitLabel}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    {showParticipants && (
      <>
        <SelectEventMembersDrawer
          open={membersDrawerOpen}
          onClose={() => setMembersDrawerOpen(false)}
          orgId={orgId}
          selectedIds={form.memberIds}
          onConfirm={(memberIds) => setForm((f) => ({ ...f, memberIds }))}
        />
        <SelectEventTeamsDrawer
          open={teamsDrawerOpen}
          onClose={() => setTeamsDrawerOpen(false)}
          orgId={orgId}
          selectedIds={form.teamIds}
          onConfirm={(teamIds) => setForm((f) => ({ ...f, teamIds }))}
        />
      </>
    )}
    </>
  )
}
