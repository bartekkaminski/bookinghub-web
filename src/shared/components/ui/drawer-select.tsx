import { useState, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from './drawer'
import { Button } from './button'

export interface DrawerSelectOption {
  value: string
  label: string
}

interface DrawerSelectProps {
  value: string
  onChange: (value: string) => void
  options: DrawerSelectOption[]
  placeholder?: string
  title?: string
}

export function DrawerSelect({
  value,
  onChange,
  options,
  placeholder = 'Wybierz...',
  title = 'Wybierz opcję',
}: DrawerSelectProps) {
  const [open, setOpen] = useState(false)

  const selected = options.find(o => o.value === value)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-left transition-colors hover:bg-accent"
      >
        <span className={`flex-1 ${selected ? '' : 'text-muted-foreground'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </button>

      <Drawer open={open} onOpenChange={v => { if (!v) setOpen(false) }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2 space-y-2">
            {options.map(opt => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:bg-accent'
                  }`}
                >
                  <span className="text-sm font-medium flex-1">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
          <DrawerFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="w-full">Anuluj</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

// Multi-item searchable select (for picking a person from a list)
interface DrawerSearchSelectProps {
  value: string
  onChange: (value: string) => void
  options: DrawerSelectOption[]
  placeholder?: string
  title?: string
  searchPlaceholder?: string
}

export function DrawerSearchSelect({
  value,
  onChange,
  options,
  placeholder = 'Wybierz...',
  title = 'Wybierz',
  searchPlaceholder = 'Szukaj...',
}: DrawerSearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const selected = options.find(o => o.value === value)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-left transition-colors hover:bg-accent"
      >
        <span className={`flex-1 ${selected ? '' : 'text-muted-foreground'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </button>

      <Drawer open={open} onOpenChange={v => { if (!v) setOpen(false) }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2 space-y-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              autoFocus
            />
            <div className="space-y-2">
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Brak wyników</p>
              )}
              {filtered.map(opt => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:bg-accent'
                    }`}
                  >
                    <span className="text-sm font-medium flex-1">{opt.label}</span>
                    {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
          <DrawerFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="w-full">Anuluj</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
