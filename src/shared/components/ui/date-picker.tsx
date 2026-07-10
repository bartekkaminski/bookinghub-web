import { useState, useEffect, useRef } from 'react'
import {
  format, parse, isValid,
  startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, getDay, isSameDay, isSameMonth,
  setYear, getYear,
} from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from './drawer'
import { Button } from './button'

interface DatePickerInputProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

function useDateLocale() {
  const { i18n } = useTranslation()
  return i18n.language === 'en' ? enUS : pl
}

export function DatePickerInput({ value, onChange, placeholder }: DatePickerInputProps) {
  const { t } = useTranslation()
  const locale = useDateLocale()
  const [open, setOpen] = useState(false)

  const parsed = value ? parse(value, 'yyyy-MM-dd', new Date()) : null
  const display = parsed && isValid(parsed) ? format(parsed, 'd MMMM yyyy', { locale }) : null
  const ph = placeholder ?? t('datePicker.placeholder')

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-left transition-colors hover:bg-accent">
        <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className={`flex-1 ${display ? '' : 'text-muted-foreground'}`}>{display ?? ph}</span>
        {value && (
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); onChange('') }} />
        )}
      </button>

      <CalendarDrawer open={open} onClose={() => setOpen(false)}
        selected={parsed && isValid(parsed) ? parsed : null}
        onSelect={(d) => { onChange(format(d, 'yyyy-MM-dd')); setOpen(false) }} />
    </>
  )
}

function CalendarDrawer({ open, onClose, selected, onSelect }: {
  open: boolean; onClose: () => void; selected: Date | null; onSelect: (d: Date) => void
}) {
  const { t } = useTranslation()
  const locale = useDateLocale()
  const today = new Date()
  const [month, setMonth] = useState(selected ?? today)
  const [yearPickerOpen, setYearPickerOpen] = useState(false)

  useEffect(() => {
    if (open) { setMonth(selected ?? today); setYearPickerOpen(false) }
  }, [open])

  const currentYear = getYear(month)
  const minYear = 1920
  const maxYear = getYear(today)
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)

  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const days = eachDayOfInterval({ start, end })
  const startPad = (getDay(start) + 6) % 7
  const WEEKDAYS: string[] = t('datePicker.weekdays', { returnObjects: true }) as string[]

  const selectedYearRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (yearPickerOpen) setTimeout(() => selectedYearRef.current?.scrollIntoView({ block: 'center' }), 50)
  }, [yearPickerOpen])

  return (
    <Drawer open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{t('datePicker.title')}</DrawerTitle></DrawerHeader>
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => setMonth(m => subMonths(m, 1))}
              className="p-2 rounded-lg hover:bg-accent transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => setYearPickerOpen(v => !v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors">
              <span className="text-sm font-semibold capitalize">{format(month, 'LLLL', { locale })}</span>
              <span className="text-sm font-bold text-primary">{currentYear}</span>
              <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${yearPickerOpen ? 'rotate-90' : ''}`} />
            </button>
            <button type="button" onClick={() => setMonth(m => addMonths(m, 1))}
              className="p-2 rounded-lg hover:bg-accent transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {yearPickerOpen && (
            <div className="mb-4 max-h-48 overflow-y-auto rounded-xl border border-border">
              {years.map(year => {
                const isSel = year === currentYear
                return (
                  <button key={year} ref={isSel ? selectedYearRef : undefined} type="button"
                    onClick={() => { setMonth(m => setYear(m, year)); setYearPickerOpen(false) }}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${isSel ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-accent'}`}>
                    {year}
                  </button>
                )
              })}
            </div>
          )}

          {!yearPickerOpen && (
            <>
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map(d => (
                  <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-1">
                {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                {days.map(day => {
                  const isSel = selected ? isSameDay(day, selected) : false
                  const isToday = isSameDay(day, today)
                  const isCurMonth = isSameMonth(day, month)
                  return (
                    <button key={day.toISOString()} type="button" onClick={() => onSelect(day)}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                        ${isSel ? 'bg-primary text-primary-foreground' : ''}
                        ${!isSel && isToday ? 'border border-primary text-primary' : ''}
                        ${!isSel && !isToday && isCurMonth ? 'hover:bg-accent' : ''}
                        ${!isCurMonth ? 'opacity-30' : ''}`}>
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
        <DrawerFooter>
          <Button variant="ghost" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
