import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
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

interface AssignTrainerDrawerProps {
  open: boolean
  onClose: () => void
  orgId: string
  eventId: string
  assignedTrainerIds: string[]
}

export function AssignTrainerDrawer({ open, onClose, orgId, eventId, assignedTrainerIds }: AssignTrainerDrawerProps) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState('')

  const assignM = useAssignTrainerToEvent(orgId, eventId)
  const { data: trainers } = useTrainers(orgId)

  useEffect(() => {
    if (open) setSelectedId('')
  }, [open])

  const availableTrainers = trainers?.filter(tr => !assignedTrainerIds.includes(tr.id)) ?? []

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
