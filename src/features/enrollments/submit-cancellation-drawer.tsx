import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { useSubmitCancellationRequest } from './use-cancellation-requests'

interface SubmitCancellationDrawerProps {
  open: boolean
  onClose: () => void
  orgId: string
  enrollmentId: string
  eventTitle: string
}

export function SubmitCancellationDrawer({
  open, onClose, orgId, enrollmentId, eventTitle,
}: SubmitCancellationDrawerProps) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')

  const submitM = useSubmitCancellationRequest(orgId)

  const handleSubmit = async () => {
    try {
      await submitM.mutateAsync({
        enrollmentId,
        data: { reason: reason.trim() || undefined },
      })
      toast.success(t('cancellations.submitSuccess'))
      setReason('')
      onClose()
    } catch {
      toast.error(t('cancellations.submitFailed'))
    }
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && handleClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('cancellations.submitTitle')}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-4">
          <div className="rounded-xl bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">{t('pendingRequests.event')}</p>
            <p className="text-sm font-medium">{eventTitle}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancel-reason">{t('cancellations.reasonOptional')}</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('cancellations.reasonPlaceholder')}
              rows={4}
            />
          </div>
        </div>

        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={submitM.isPending}
            className="w-full"
          >
            {submitM.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('cancellations.submitBtn')}
          </Button>
          <Button variant="outline" onClick={handleClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
