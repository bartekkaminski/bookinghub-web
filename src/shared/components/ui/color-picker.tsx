import { cn } from '@/shared/utils/cn'

const PRESET_COLORS = [
  '#6d28d9', // violet
  '#2563eb', // blue
  '#0891b2', // cyan
  '#059669', // green
  '#65a30d', // lime
  '#d97706', // amber
  '#f97316', // orange
  '#dc2626', // red
  '#db2777', // pink
  '#7c3aed', // purple
  '#475569', // slate
  '#374151', // gray
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          title={c}
          className={cn(
            'w-9 h-9 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
            value === c
              ? 'border-foreground scale-110 shadow-md'
              : 'border-transparent hover:scale-105',
          )}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}
