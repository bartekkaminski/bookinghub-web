import { cn } from '@/shared/utils/cn'

interface TimePickerProps {
  value: string
  onChange: (val: string) => void
  className?: string
  disabled?: boolean
}

/**
 * Mobile-friendly time picker using native input[type=time].
 * value / onChange use "HH:MM" format (24h).
 */
export function TimePicker({ value, onChange, className, disabled }: TimePickerProps) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      step={900}
      className={cn(
        'w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none',
        'focus:border-primary transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        '[&::-webkit-calendar-picker-indicator]:opacity-60',
        className
      )}
    />
  )
}
