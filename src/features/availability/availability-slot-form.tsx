import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/shared/components/ui/drawer'
import { DrawerSelect } from '@/shared/components/ui/drawer-select'
import { DatePickerInput } from '@/shared/components/ui/date-picker'
import { TimePickerInput } from '@/shared/components/ui/time-picker-input'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { cn } from '@/shared/utils/cn'
import {
  useAddAvailabilitySlot,
  useUpdateAvailabilitySlot,
} from './use-availability'
import type {
  AvailabilitySlotResponse,
  DayOfWeekName,
  AddAvailabilitySlotRequest,
} from '@/api/types'
import { DAY_ORDER } from '@/shared/utils/availability'

interface Props {
  open: boolean
  onClose: () => void
  orgId: string
  memberId: string
  slot?: AvailabilitySlotResponse | null
  preselectedDate?: Date | null
}

const DAY_LABELS_PL: Record<DayOfWeekName, string> = {
  Monday: 'Poniedziałek', Tuesday: 'Wtorek', Wednesday: 'Środa',
  Thursday: 'Czwartek', Friday: 'Piątek', Saturday: 'Sobota', Sunday: 'Niedziela',
}
const DAY_LABELS_EN: Record<DayOfWeekName, string> = {
  Monday: 'Monday', Tuesday: 'Tuesday', Wednesday: 'Wednesday',
  Thursday: 'Thursday', Friday: 'Friday', Saturday: 'Saturday', Sunday: 'Sunday',
}

function dateToDayName(date: Date): DayOfWeekName {
  return DAY_ORDER[(date.getDay() + 6) % 7]
}

/** "HH:mm:ss" → "HH:mm" */
function toTimeInput(t: string): string { return t.slice(0, 5) }

/** "HH:mm" → "HH:mm:ss" */
function toApiTime(t: string): string { return t.length === 5 ? `${t}:00` : t }

type SlotMode = 'recurring' | 'single'

export function AvailabilitySlotForm({ open, onClose, orgId, memberId, slot, preselectedDate }: Props) {
  const { t, i18n } = useTranslation()
  const isEdit = !!slot

  const [mode, setMode]           = useState<SlotMode>('recurring')
  const [timeFrom, setTimeFrom]   = useState('09:00')
  const [timeTo, setTimeTo]       = useState('11:00')
  const [day, setDay]             = useState<DayOfWeekName>('Monday')
  const [rangeFrom, setRangeFrom] = useState('')
  const [rangeTo, setRangeTo]     = useState('')
  const [limitRange, setLimitRange] = useState(false)
  const [singleDate, setSingleDate] = useState('')
  const [errors, setErrors]         = useState<Record<string, string>>({})

  const addMutation    = useAddAvailabilitySlot(orgId, memberId)
  const updateMutation = useUpdateAvailabilitySlot(orgId, memberId, slot?.id ?? '')
  const isPending      = addMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) return
    setErrors({})

    if (slot) {
      const isSingle = !!slot.validFrom && slot.validFrom === slot.validTo
      setMode(isSingle ? 'single' : 'recurring')
      setDay(slot.dayOfWeek)
      setTimeFrom(toTimeInput(slot.timeFrom))
      setTimeTo(toTimeInput(slot.timeTo))
      if (isSingle) {
        setSingleDate(slot.validFrom!)
        setLimitRange(false); setRangeFrom(''); setRangeTo('')
      } else {
        const hasRange = !!slot.validFrom || !!slot.validTo
        setLimitRange(hasRange)
        setRangeFrom(slot.validFrom ?? '')
        setRangeTo(slot.validTo ?? '')
        setSingleDate('')
      }
    } else if (preselectedDate) {
      setMode('single')
      setSingleDate(format(preselectedDate, 'yyyy-MM-dd'))
      setDay(dateToDayName(preselectedDate))
      setTimeFrom('09:00'); setTimeTo('11:00')
      setLimitRange(false); setRangeFrom(''); setRangeTo('')
    } else {
      setMode('recurring')
      setDay('Monday')
      setTimeFrom('09:00'); setTimeTo('11:00')
      setLimitRange(false); setRangeFrom(''); setRangeTo(''); setSingleDate('')
    }
  }, [open, slot, preselectedDate])

  // Automatyczny DayOfWeek z daty jednorazowej
  useEffect(() => {
    if (mode === 'single' && singleDate) {
      try { setDay(dateToDayName(new Date(singleDate + 'T00:00:00'))) } catch { /* ignore */ }
    }
  }, [singleDate, mode])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!timeFrom || !timeTo) { e.time = 'Podaj godziny' }
    else if (timeFrom >= timeTo) { e.time = 'Godzina od musi być wcześniejsza niż do' }
    if (mode === 'single' && !singleDate) { e.date = 'Wybierz datę' }
    if (mode === 'recurring' && limitRange && rangeFrom && rangeTo && rangeFrom > rangeTo)
      e.range = 'Data od musi być wcześniejsza niż do'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return

    const data: AddAvailabilitySlotRequest = mode === 'single'
      ? { dayOfWeek: day, timeFrom: toApiTime(timeFrom), timeTo: toApiTime(timeTo), validFrom: singleDate, validTo: singleDate }
      : { dayOfWeek: day, timeFrom: toApiTime(timeFrom), timeTo: toApiTime(timeTo),
          validFrom: limitRange && rangeFrom ? rangeFrom : null,
          validTo:   limitRange && rangeTo   ? rangeTo   : null }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data)
        toast.success(t('availability.slotUpdated'))
      } else {
        await addMutation.mutateAsync(data)
        toast.success(t('availability.slotAdded'))
      }
      onClose()
    } catch {
      toast.error(t('availability.slotFailed'))
    }
  }

  const dayLabels  = i18n.language === 'en' ? DAY_LABELS_EN : DAY_LABELS_PL
  const dayOptions = DAY_ORDER.map(d => ({ value: d, label: dayLabels[d] }))
  const isEn       = i18n.language === 'en'

  return (
    <Drawer open={open} onOpenChange={v => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {isEdit ? t('availability.editSlot') : t('availability.addSlot')}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 space-y-5">

          {/* ── Przełącznik trybu ── */}
          {!isEdit && (
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              {(['recurring', 'single'] as SlotMode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    'rounded-md py-1.5 text-sm font-medium transition-colors',
                    mode === m
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m === 'recurring'
                    ? (isEn ? 'Recurring'    : 'Cykliczny')
                    : (isEn ? 'Single date'  : 'Jednorazowy')}
                </button>
              ))}
            </div>
          )}

          {/* ── Jednorazowy: DatePicker ── */}
          {mode === 'single' && (
            <div className="space-y-1.5">
              <Label>{isEn ? 'Date' : 'Data'}</Label>
              <DatePickerInput
                value={singleDate}
                onChange={setSingleDate}
                placeholder={isEn ? 'Select date' : 'Wybierz datę'}
              />
              {singleDate && (
                <p className="text-xs text-muted-foreground pl-1">{dayLabels[day]}</p>
              )}
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date}</p>
              )}
            </div>
          )}

          {/* ── Cykliczny: DrawerSelect dnia tygodnia ── */}
          {mode === 'recurring' && (
            <div className="space-y-1.5">
              <Label>{t('availability.dayOfWeek')}</Label>
              <DrawerSelect
                value={day}
                onChange={v => setDay(v as DayOfWeekName)}
                options={dayOptions}
                placeholder={t('common.select')}
                title={t('availability.dayOfWeek')}
              />
            </div>
          )}

          {/* ── Godziny: TimePicker ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('availability.timeFrom')}</Label>
              <TimePickerInput
                value={timeFrom}
                onChange={setTimeFrom}
                placeholder="Od"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('availability.timeTo')}</Label>
              <TimePickerInput
                value={timeTo}
                onChange={setTimeTo}
                placeholder="Do"
              />
            </div>
          </div>
          {errors.time && (
            <p className="text-xs text-destructive">{errors.time}</p>
          )}

          {/* ── Cykliczny: opcjonalny zakres ważności ── */}
          {mode === 'recurring' && (
            <>
              <div className="flex items-center justify-between py-1">
                <Label htmlFor="limitRange" className="cursor-pointer text-sm">
                  {t('availability.limitPeriod')}
                </Label>
                <button
                  id="limitRange"
                  type="button"
                  role="switch"
                  aria-checked={limitRange}
                  onClick={() => setLimitRange(v => !v)}
                  className={cn(
                    'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    limitRange ? 'bg-primary' : 'bg-input',
                  )}
                >
                  <span className={cn(
                    'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200',
                    limitRange ? 'translate-x-4' : 'translate-x-0',
                  )} />
                </button>
              </div>

              {limitRange && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>{t('availability.validFrom')}</Label>
                    <DatePickerInput
                      value={rangeFrom}
                      onChange={setRangeFrom}
                      placeholder={isEn ? 'From date (optional)' : 'Od daty (opcjonalnie)'}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('availability.validTo')}</Label>
                    <DatePickerInput
                      value={rangeTo}
                      onChange={setRangeTo}
                      placeholder={isEn ? 'Until date (optional)' : 'Do daty (opcjonalnie)'}
                    />
                  </div>
                  {errors.range && (
                    <p className="text-xs text-destructive">{errors.range}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending ? t('common.loading') : t('common.save')}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
