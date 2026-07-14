import { useState } from 'react'
import { Plus, Pencil, Trash2, Repeat2, CalendarDays, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { useAvailabilitySlots, useDeleteAvailabilitySlot } from './use-availability'
import { AvailabilitySlotForm } from './availability-slot-form'
import type { AvailabilitySlotResponse, DayOfWeekName } from '@/api/types'
import { DAY_ORDER, formatTime } from '@/shared/utils/availability'

interface Props {
  orgId: string
  memberId: string
  canEdit?: boolean
}

const DAY_LABELS_PL: Record<DayOfWeekName, string> = {
  Monday: 'Poniedziałek',
  Tuesday: 'Wtorek',
  Wednesday: 'Środa',
  Thursday: 'Czwartek',
  Friday: 'Piątek',
  Saturday: 'Sobota',
  Sunday: 'Niedziela',
}
const DAY_LABELS_EN: Record<DayOfWeekName, string> = {
  Monday: 'Monday', Tuesday: 'Tuesday', Wednesday: 'Wednesday',
  Thursday: 'Thursday', Friday: 'Friday', Saturday: 'Saturday', Sunday: 'Sunday',
}

export function AvailabilitySlotList({ orgId, memberId, canEdit = false }: Props) {
  const { t, i18n } = useTranslation()
  const { data: slots, isLoading } = useAvailabilitySlots(orgId, memberId)
  const deleteMutation = useDeleteAvailabilitySlot(orgId, memberId)

  const [formOpen, setFormOpen]               = useState(false)
  const [editSlot, setEditSlot]               = useState<AvailabilitySlotResponse | null>(null)
  const [deleteSlot, setDeleteSlot]           = useState<AvailabilitySlotResponse | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const dayLabels = i18n.language === 'en' ? DAY_LABELS_EN : DAY_LABELS_PL

  const slotsByDay = DAY_ORDER.reduce<Record<DayOfWeekName, AvailabilitySlotResponse[]>>(
    (acc, day) => {
      acc[day] = (slots ?? [])
        .filter(s => s.dayOfWeek === day)
        .sort((a, b) => a.timeFrom.localeCompare(b.timeFrom))
      return acc
    },
    {} as Record<DayOfWeekName, AvailabilitySlotResponse[]>,
  )

  const hasAny = (slots?.length ?? 0) > 0

  function handleEdit(slot: AvailabilitySlotResponse) {
    setEditSlot(slot)
    setFormOpen(true)
  }

  function handleDeleteRequest(slot: AvailabilitySlotResponse) {
    setDeleteSlot(slot)
    setConfirmDeleteOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteSlot) return
    try {
      await deleteMutation.mutateAsync(deleteSlot.id)
      toast.success(t('availability.slotDeleted'))
    } catch {
      toast.error(t('availability.deleteFailed'))
    } finally {
      setConfirmDeleteOpen(false)
      setDeleteSlot(null)
    }
  }

  function handleFormClose() {
    setFormOpen(false)
    setEditSlot(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-2 px-4 pt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {t('availability.patterns')}
        </h3>
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            onClick={() => { setEditSlot(null); setFormOpen(true) }}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('availability.addSlot')}
          </Button>
        )}
      </div>

      {!hasAny ? (
        <div className="text-center py-8 text-muted-foreground space-y-1">
          <Clock className="h-8 w-8 mx-auto opacity-30" />
          <p className="text-sm font-medium">{t('availability.noSlots')}</p>
          <p className="text-xs">{t('availability.noSlotsDesc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {DAY_ORDER.map(day => {
            const daySlots = slotsByDay[day]
            if (daySlots.length === 0) return null
            return (
              <div key={day}>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                  {dayLabels[day]}
                </p>
                <div className="space-y-1.5">
                  {daySlots.map(slot => (
                    <SlotRow
                      key={slot.id}
                      slot={slot}
                      canEdit={canEdit}
                      onEdit={handleEdit}
                      onDelete={handleDeleteRequest}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AvailabilitySlotForm
        open={formOpen}
        onClose={handleFormClose}
        orgId={orgId}
        memberId={memberId}
        slot={editSlot}
      />

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('availability.deleteSlot')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('availability.deleteConfirm')}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SlotRow({
  slot,
  canEdit,
  onEdit,
  onDelete,
}: {
  slot: AvailabilitySlotResponse
  canEdit: boolean
  onEdit: (s: AvailabilitySlotResponse) => void
  onDelete: (s: AvailabilitySlotResponse) => void
}) {
  const isSingle    = !!slot.validFrom && slot.validFrom === slot.validTo
  const isRecurring = !isSingle

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 bg-card">
      {/* Ikona typu terminu */}
      <div
        className={
          isRecurring
            ? 'text-primary/70 flex-shrink-0'
            : 'text-amber-500/80 flex-shrink-0'
        }
        title={isRecurring ? 'Cykliczny' : 'Jednorazowy'}
      >
        {isRecurring
          ? <Repeat2 className="h-3.5 w-3.5" />
          : <CalendarDays className="h-3.5 w-3.5" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">
          {formatTime(slot.timeFrom)} – {formatTime(slot.timeTo)}
        </span>
        <p className="text-[10px] text-muted-foreground">
          {isSingle
            ? slot.validFrom                            // "2026-07-21"
            : slot.validFrom || slot.validTo
              ? [
                  slot.validFrom && `od ${slot.validFrom}`,
                  slot.validTo   && `do ${slot.validTo}`,
                ].filter(Boolean).join(' · ')
              : 'co tydzień'
          }
        </p>
      </div>

      {canEdit && (
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onEdit(slot)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(slot)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
