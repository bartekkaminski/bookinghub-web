import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap gap-2">
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
                : 'border-transparent hover:scale-105'
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-9 w-9 rounded-lg border border-border flex-shrink-0"
          style={{ backgroundColor: value || '#6d28d9' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v)
          }}
          maxLength={7}
          placeholder="#000000"
          className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono outline-none focus:border-primary transition-colors"
          aria-label={t('common.color')}
        />
      </div>
    </div>
  )
}
