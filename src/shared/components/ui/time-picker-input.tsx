import { useState, useEffect, useRef } from 'react'
import { Clock } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from './drawer'
import { Button } from './button'
import { cn } from '@/shared/utils/cn'

interface TimePickerInputProps {
  value: string          // "HH:mm"
  onChange: (val: string) => void
  placeholder?: string
  minuteStep?: number    // domyślnie 15
}

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES_15 = ['00', '15', '30', '45']
const MINUTES_5  = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

const ITEM_H = 44 // px — wysokość jednego elementu listy

/** Wycentrowany scroll do wybranego elementu.
 *  Kolumna ma padding góra/dół = clientHeight/2 - ITEM_H/2,
 *  więc środek elementu o indeksie N jest na pozycji:
 *    padding + N*ITEM_H + ITEM_H/2
 *  Żeby był w centrum viewportu (clientHeight/2):
 *    scrollTop = padding + N*ITEM_H + ITEM_H/2 - clientHeight/2
 *              = N * ITEM_H
 */
function scrollToSelected(ref: React.RefObject<HTMLDivElement | null>, index: number) {
  if (!ref.current) return
  ref.current.scrollTo({ top: Math.max(0, index * ITEM_H), behavior: 'smooth' })
}

export function TimePickerInput({
  value,
  onChange,
  placeholder = 'Wybierz godzinę',
  minuteStep = 15,
}: TimePickerInputProps) {
  const [open, setOpen] = useState(false)
  const [selHour, setSelHour]   = useState('09')
  const [selMinute, setSelMinute] = useState('00')

  const hourRef   = useRef<HTMLDivElement>(null)
  const minuteRef = useRef<HTMLDivElement>(null)

  const minutes = minuteStep === 5 ? MINUTES_5 : MINUTES_15

  // Parsuj wartość przy otwarciu
  useEffect(() => {
    if (open) {
      const [h = '09', m = '00'] = (value || '').split(':')
      setSelHour(h.padStart(2, '0'))
      // Snap do najbliższego kroku
      const mNum = parseInt(m, 10)
      const step  = minuteStep
      const snapped = String(Math.round(mNum / step) * step % 60).padStart(2, '0')
      setSelMinute(minutes.includes(snapped) ? snapped : minutes[0])
    }
  }, [open, value, minuteStep, minutes])

  // Scroll do zaznaczonego elementu po otwarciu
  useEffect(() => {
    if (!open) return
    const hIdx = HOURS.indexOf(selHour)
    const mIdx = minutes.indexOf(selMinute)
    setTimeout(() => {
      scrollToSelected(hourRef, hIdx >= 0 ? hIdx : 0)
      scrollToSelected(minuteRef, mIdx >= 0 ? mIdx : 0)
    }, 80)
  }, [open, selHour, selMinute, minutes])

  function handleConfirm() {
    onChange(`${selHour}:${selMinute}`)
    setOpen(false)
  }

  const display = value || null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-left transition-colors hover:bg-accent"
      >
        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className={display ? '' : 'text-muted-foreground'}>
          {display ?? placeholder}
        </span>
      </button>

      <Drawer open={open} onOpenChange={v => !v && setOpen(false)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-center text-2xl font-bold tracking-widest">
              {selHour}:{selMinute}
            </DrawerTitle>
          </DrawerHeader>

          {/* ── Picker ── */}
          <div className="px-4 pb-2">
            <div className="relative flex gap-2 h-[220px]">
              {/* Highlight środkowego elementu */}
              <div className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 h-[44px] rounded-xl bg-muted z-10" />

              {/* Kolumna godzin */}
              <Column
                ref={hourRef}
                items={HOURS}
                selected={selHour}
                onSelect={setSelHour}
                itemHeight={ITEM_H}
              />

              <div className="flex items-center text-xl font-bold text-muted-foreground pb-0.5 z-20 select-none">:</div>

              {/* Kolumna minut */}
              <Column
                ref={minuteRef}
                items={minutes}
                selected={selMinute}
                onSelect={setSelMinute}
                itemHeight={ITEM_H}
              />
            </div>
          </div>

          <DrawerFooter>
            <Button className="w-full" onClick={handleConfirm}>
              Gotowe
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

// ── Column ────────────────────────────────────────────────────────────────────

interface ColumnProps {
  items: string[]
  selected: string
  onSelect: (v: string) => void
  itemHeight: number
}

import { forwardRef } from 'react'

const Column = forwardRef<HTMLDivElement, ColumnProps>(
  function Column({ items, selected, onSelect, itemHeight }, ref) {
    return (
      <div
        ref={ref}
        className="flex-1 overflow-y-auto scrollbar-hide scroll-smooth relative z-20"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {/* Padding góra/dół żeby środkowy element był centralnie */}
        <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }} />

        {items.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            style={{ height: itemHeight, scrollSnapAlign: 'center' }}
            className={cn(
              'w-full flex items-center justify-center text-lg font-medium transition-colors',
              item === selected
                ? 'text-foreground font-bold'
                : 'text-muted-foreground/50 hover:text-muted-foreground',
            )}
          >
            {item}
          </button>
        ))}

        <div style={{ height: `calc(50% - ${itemHeight / 2}px)` }} />
      </div>
    )
  }
)
