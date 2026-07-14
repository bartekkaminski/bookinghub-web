import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAssignTrainerToEvent } from './use-events'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { DrawerSearchSelect } from '@/shared/components/ui/drawer-select'
import { useTrainers } from '@/features/members/use-members'
import { EmptyState } from '@/shared/components/empty-state'
import { Users } from 'lucide-react'
import { availabilityApi } from '@/api/endpoints'
import { cn } from '@/shared/utils/cn'

interface AssignTrainerDrawerProps {
  open: boolean
  onClose: () => void
  orgId: string
  eventId: string
  assignedTrainerIds: string[]
  /** ISO DateTime string np. "2026-07-14T09:00:00Z" — do sprawdzenia dostępności trenera */
  eventStartTime: string
  /** ISO DateTime string np. "2026-07-14T10:00:00Z" */
  eventEndTime: string
}

type AvailabilityStatus = 'available' | 'unavailable' | 'unknown'

function TrainerAvailabilityBadge({ status, isLoading }: { status: AvailabilityStatus; isLoading: boolean }) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
        <span>{t('common.loading', 'Sprawdzanie...')}</span>
      </div>
    )
  }

  const config = {
    available: {
      icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />,
      label: t('availability.trainerAvailable'),
      className: 'text-green-600 dark:text-green-400',
    },
    unavailable: {
      icon: <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />,
      label: t('availability.trainerUnavailable'),
      className: 'text-destructive',
    },
    unknown: {
      icon: <HelpCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
      label: t('availability.trainerNoData'),
      className: 'text-muted-foreground',
    },
  } as const

  const { icon, label, className } = config[status]

  return (
    <div className={cn('flex items-center gap-2 text-xs font-medium px-1', className)}>
      {icon}
      <span>{label}</span>
    </div>
  )
}

export function AssignTrainerDrawer({
  open,
  onClose,
  orgId,
  eventId,
  assignedTrainerIds,
  eventStartTime,
  eventEndTime,
}: AssignTrainerDrawerProps) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState('')

  const assignM = useAssignTrainerToEvent(orgId, eventId)
  const { data: trainers } = useTrainers(orgId)

  useEffect(() => {
    if (open) setSelectedId('')
  }, [open])

  const availableTrainers = trainers?.filter(tr => !assignedTrainerIds.includes(tr.id)) ?? []

  const { data: availCheck, isLoading: availLoading } = useQuery({
    queryKey: ['trainer-availability-check', orgId, selectedId, eventStartTime, eventEndTime],
    queryFn: () => availabilityApi.checkAvailability(orgId, selectedId, eventStartTime, eventEndTime),
    enabled: !!selectedId && !!eventStartTime && !!eventEndTime,
    staleTime: 60 * 1000,
  })

  const availabilityStatus: AvailabilityStatus = (() => {
    if (!availCheck) return 'unknown'
    const memberInfo = availCheck.members.find(m => m.memberId === selectedId)
    if (!memberInfo) return 'unknown'
    return memberInfo.isAvailable ? 'available' : 'unavailable'
  })()

  const handleSubmit = async () => {
    if (!selectedId) return
    try {
      await assignM.mutateAsync({ organizationMemberId: selectedId })
      toast.success(t('events.trainerAssigned'))
      onClose()
    } catch {
      toast.error(t('events.trainerAssignFailed'))
    }
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('events.assignTrainerTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2 space-y-3">
          {availableTrainers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title={t('events.allTrainersAssigned')}
              className="py-6"
            />
          ) : (
            <div className="space-y-2">
              <Label>{t('events.selectTrainer')}</Label>
              <DrawerSearchSelect
                value={selectedId}
                onChange={setSelectedId}
                options={availableTrainers.map(tr => ({ value: tr.id, label: tr.displayName }))}
                title={t('events.selectTrainer')}
                placeholder={t('events.selectTrainerPlaceholder')}
                searchPlaceholder={t('events.searchTrainer')}
              />
              {selectedId && (
                <TrainerAvailabilityBadge
                  status={availabilityStatus}
                  isLoading={availLoading}
                />
              )}
            </div>
          )}
        </div>
        <DrawerFooter>
          {availableTrainers.length > 0 && (
            <Button
              onClick={handleSubmit}
              disabled={!selectedId || assignM.isPending}
              className="w-full"
            >
              {assignM.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('common.add')}
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
