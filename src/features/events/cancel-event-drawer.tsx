import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useCancelEvent } from './use-events'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'

interface CancelEventDrawerProps {
  open: boolean
  onClose: () => void
  orgId: string
  eventId: string
}

export function CancelEventDrawer({ open, onClose, orgId, eventId }: CancelEventDrawerProps) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [notify, setNotify] = useState(true)

  const cancelM = useCancelEvent(orgId, eventId)

  useEffect(() => {
    if (open) {
      setReason('')
      setNotify(true)
    }
  }, [open])

  const handleSubmit = async () => {
    try {
      await cancelM.mutateAsync({
        reason: reason.trim() || undefined,
        notifyEnrolled: notify,
      })
      toast.success(t('events.cancelled'))
      onClose()
    } catch {
      toast.error(t('events.cancelFailed'))
    }
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('events.cancelTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2 space-y-4">
          <div className="space-y-2">
            <Label>{t('events.cancelReasonLabel')}</Label>
            <Textarea
              placeholder={t('events.cancelReasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              autoFocus
            />
          </div>

          <button
            type="button"
            onClick={() => setNotify((v) => !v)}
            className="flex items-center gap-3 w-full text-left"
          >
            <div
              className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                notify
                  ? 'bg-primary border-primary'
                  : 'border-input bg-background'
              }`}
            >
              {notify && (
                <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm">{t('events.cancelNotifyLabel')}</span>
          </button>
        </div>
        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={cancelM.isPending}
            variant="destructive"
            className="w-full"
          >
            {cancelM.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('events.cancelBtn')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
