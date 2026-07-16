import { useState, useEffect } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import type { CreateRankRequest, UpdateRankRequest } from '@/api/types'

export const COLOR_PALETTE = [
  '#6d28d9', '#2563eb', '#059669', '#dc2626',
  '#d97706', '#db2777', '#0891b2', '#65a30d',
  '#7c3aed', '#475569',
]

/** Formularz tworzenia/edycji rangi w ramach dyscypliny. */
export function RankFormDrawer({
  open,
  onClose,
  onSubmit,
  isLoading,
  title,
  initialData,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateRankRequest | UpdateRankRequest) => void
  isLoading: boolean
  title: string
  initialData?: { name: string; color?: string }
  onDelete?: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialData?.name ?? '')
  const [color, setColor] = useState<string | undefined>(initialData?.color)

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '')
      setColor(initialData?.color)
    }
  }, [open, initialData?.name, initialData?.color])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), color: color ?? undefined })
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="px-4 space-y-4">
          <div className="space-y-2">
            <Label>{t('ranks.nameLabel')}</Label>
            <Input
              placeholder={t('ranks.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>
              {t('common.color')}{' '}
              <span className="text-muted-foreground text-xs">{t('common.optional')}</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(color === c ? undefined : c)}
                  className={`w-9 h-9 rounded-lg border-2 transition-all ${
                    color === c
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
            {color && (
              <button
                type="button"
                onClick={() => setColor(undefined)}
                className="text-xs text-muted-foreground underline"
              >
                {t('ranks.clearColor')}
              </button>
            )}
          </div>
        </form>
        <DrawerFooter>
          <Button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={!name.trim() || isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {initialData ? t('common.save') : t('ranks.createBtn')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.cancel')}
          </Button>
          {onDelete && (
            <Button variant="ghost" onClick={onDelete} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4 mr-2" />{t('ranks.deleteRank')}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
