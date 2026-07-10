import { useState } from 'react'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { useReviewCancellationRequest } from './use-cancellation-requests'
import type { CancellationRequestSummaryResponse } from '@/api/types'

interface ReviewCancellationDrawerProps {
  open: boolean
  onClose: () => void
  orgId: string
  request: CancellationRequestSummaryResponse | null
}

export function ReviewCancellationDrawer({ open, onClose, orgId, request }: ReviewCancellationDrawerProps) {
  const { t } = useTranslation()
  const [reviewNote, setReviewNote] = useState('')

  const reviewM = useReviewCancellationRequest(orgId)

  const handleDecision = async (decision: 'Approved' | 'Rejected') => {
    if (!request) return
    try {
      await reviewM.mutateAsync({
        requestId: request.id,
        data: {
          decision,
          reviewNote: reviewNote.trim() || undefined,
        },
      })
      toast.success(
        decision === 'Approved'
          ? t('cancellations.approveSuccess')
          : t('cancellations.rejectSuccess')
      )
      setReviewNote('')
      onClose()
    } catch {
      toast.error(t('cancellations.reviewFailed'))
    }
  }

  const handleClose = () => {
    setReviewNote('')
    onClose()
  }

  if (!request) return null

  return (
    <Drawer open={open} onOpenChange={(v) => !v && handleClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('cancellations.reviewTitle')}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-4">
          {/* Event info */}
          <div className="rounded-xl bg-muted/40 px-4 py-3 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">{t('pendingRequests.event')}</p>
              <p className="text-sm font-medium">{request.eventTitle}</p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(request.eventStartTime), 'dd.MM.yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('cancellations.requestedBy')}</p>
              <p className="text-sm font-medium">{request.requestedByName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('cancellations.reason')}</p>
              <p className="text-sm">
                {request.reason || <span className="text-muted-foreground">{t('cancellations.noReason')}</span>}
              </p>
            </div>
          </div>

          {/* Review note */}
          <div className="space-y-2">
            <Label htmlFor="review-note">{t('cancellations.reviewNoteLabel')}</Label>
            <Textarea
              id="review-note"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder={t('cancellations.reviewNotePlaceholder')}
              rows={3}
            />
          </div>
        </div>

        <DrawerFooter>
          <Button
            onClick={() => handleDecision('Approved')}
            disabled={reviewM.isPending}
            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            {reviewM.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <CheckCircle2 className="h-4 w-4" />}
            {t('cancellations.approveBtn')}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleDecision('Rejected')}
            disabled={reviewM.isPending}
            className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <XCircle className="h-4 w-4" />
            {t('cancellations.rejectBtn')}
          </Button>
          <Button variant="outline" onClick={handleClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
