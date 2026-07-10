import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import { ArrowLeft, ClipboardList, ClipboardCheck, ClipboardX, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { usePendingCancellationRequests } from './use-cancellation-requests'
import { usePendingEnrollmentRequests, useApproveEnrollmentRequest, useRejectEnrollmentRequest } from './use-enrollments'
import { ReviewCancellationDrawer } from './review-cancellation-drawer'
import { PageHeader } from '@/shared/components/page-header'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { EmptyState } from '@/shared/components/empty-state'
import { ErrorState } from '@/shared/components/error-state'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { getInitials } from '@/shared/utils/format'
import type { CancellationRequestSummaryResponse, EnrollmentRequestSummaryResponse } from '@/api/types'

function useDateLocale() {
  const { i18n } = useTranslation()
  return i18n.language === 'en' ? enUS : pl
}

export function PendingRequestsPage() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const navigate = useNavigate()
  const { t } = useTranslation()
  const locale = useDateLocale()

  const [selectedCancellation, setSelectedCancellation] = useState<CancellationRequestSummaryResponse | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)

  const { data: cancellationRequests, isLoading: cancLoading, isError: cancError, refetch: cancRefetch } =
    usePendingCancellationRequests(orgId)

  const { data: enrollmentRequests, isLoading: enrollLoading, isError: enrollError, refetch: enrollRefetch } =
    usePendingEnrollmentRequests(orgId)

  const handleReview = (request: CancellationRequestSummaryResponse) => {
    setSelectedCancellation(request)
    setReviewOpen(true)
  }

  const handleReviewClose = () => {
    setReviewOpen(false)
    setTimeout(() => setSelectedCancellation(null), 300)
  }

  const isLoading = cancLoading || enrollLoading
  const isError = cancError || enrollError

  const hasCancellations = (cancellationRequests?.length ?? 0) > 0
  const hasEnrollments = (enrollmentRequests?.length ?? 0) > 0
  const isEmpty = !hasCancellations && !hasEnrollments

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={t('pendingRequests.pageTitle')}
          back={
            <Button variant="outline" size="sm" onClick={() => navigate({ to: `/app/org/${orgId}/dashboard` })}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
      </div>

      <div className="px-4 mt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => { cancRefetch(); enrollRefetch() }} />
        ) : isEmpty ? (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title={t('pendingRequests.emptyTitle')}
            description={t('pendingRequests.emptyDesc')}
            className="mt-12"
          />
        ) : (
          <div className="space-y-6">
            {/* Wnioski o zapis */}
            {hasEnrollments && (
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {t('pendingRequests.enrollmentSectionTitle')}
                </h2>
                <div className="space-y-3">
                  {enrollmentRequests!.map((req) => (
                    <EnrollmentRequestCard
                      key={req.id}
                      request={req}
                      locale={locale}
                      orgId={orgId}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Wnioski o odwołanie */}
            {hasCancellations && (
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {t('pendingRequests.cancellationSectionTitle')}
                </h2>
                <div className="space-y-3">
                  {cancellationRequests!.map((req) => (
                    <CancellationRequestCard
                      key={req.id}
                      request={req}
                      locale={locale}
                      onReview={() => handleReview(req)}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ReviewCancellationDrawer
        open={reviewOpen}
        onClose={handleReviewClose}
        orgId={orgId}
        request={selectedCancellation}
      />
    </div>
  )
}

function EnrollmentRequestCard({
  request, locale, orgId, t,
}: {
  request: EnrollmentRequestSummaryResponse
  locale: ReturnType<typeof useDateLocale>
  orgId: string
  t: ReturnType<typeof useTranslation>['t']
}) {
  const eventDate = format(parseISO(request.eventStartTime), 'EEE d MMM, HH:mm', { locale })
  const requestedDate = format(parseISO(request.requestedAt), 'dd.MM.yyyy HH:mm', { locale })

  const approveM = useApproveEnrollmentRequest(orgId, request.eventId)
  const rejectM = useRejectEnrollmentRequest(orgId, request.eventId)

  const handleApprove = async () => {
    try {
      await approveM.mutateAsync({ enrollmentId: request.id, data: { approved: true } })
      toast.success(t('pendingRequests.approveEnrollSuccess'))
    } catch {
      toast.error(t('pendingRequests.approveEnrollFailed'))
    }
  }

  const handleReject = async () => {
    try {
      await rejectM.mutateAsync({ enrollmentId: request.id, data: { approved: false } })
      toast.success(t('pendingRequests.rejectEnrollSuccess'))
    } catch {
      toast.error(t('pendingRequests.rejectEnrollFailed'))
    }
  }

  const isLoading = approveM.isPending || rejectM.isPending

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10 p-4 space-y-3">
      {/* Event info */}
      <div>
        <p className="text-sm font-semibold leading-snug">{request.eventTitle}</p>
        <p className="text-xs text-muted-foreground">{eventDate}</p>
      </div>

      {/* Member */}
      <div className="flex items-center gap-2.5">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs">
            {getInitials(request.memberDisplayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{request.memberDisplayName}</p>
          <p className="text-xs text-muted-foreground">{requestedDate}</p>
        </div>
      </div>

      {/* Reason preview */}
      {request.reason && (
        <p className="text-xs text-muted-foreground italic line-clamp-2">"{request.reason}"</p>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
          onClick={handleApprove}
          disabled={isLoading}
        >
          {approveM.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <ClipboardCheck className="h-4 w-4" />}
          {t('pendingRequests.approveEnrollBtn')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={handleReject}
          disabled={isLoading}
        >
          {rejectM.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <ClipboardX className="h-4 w-4" />}
          {t('pendingRequests.rejectEnrollBtn')}
        </Button>
      </div>
    </div>
  )
}

function CancellationRequestCard({
  request, locale, onReview, t,
}: {
  request: CancellationRequestSummaryResponse
  locale: ReturnType<typeof useDateLocale>
  onReview: () => void
  t: ReturnType<typeof useTranslation>['t']
}) {
  const eventDate = format(parseISO(request.eventStartTime), 'EEE d MMM, HH:mm', { locale })
  const requestedDate = format(parseISO(request.requestedAt), 'dd.MM.yyyy HH:mm', { locale })

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Event info */}
      <div>
        <p className="text-sm font-semibold leading-snug">{request.eventTitle}</p>
        <p className="text-xs text-muted-foreground">{eventDate}</p>
      </div>

      {/* Member */}
      <div className="flex items-center gap-2.5">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(request.requestedByName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{request.requestedByName}</p>
          <p className="text-xs text-muted-foreground">{requestedDate}</p>
        </div>
      </div>

      {/* Reason preview */}
      {request.reason && (
        <p className="text-xs text-muted-foreground italic line-clamp-2">"{request.reason}"</p>
      )}

      <Button
        size="sm"
        className="w-full"
        onClick={onReview}
      >
        {t('pendingRequests.reviewBtn')}
      </Button>
    </div>
  )
}
