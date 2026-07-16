import { useState } from 'react'
import { useParams, useRouter } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import {
  ArrowLeft, Edit, XCircle, CheckCircle2, Trash2,
  MapPin, Users, UsersRound, CalendarDays, Clock,
  Plus, Loader2, UserMinus, ChevronRight, ClipboardCheck, ClipboardX,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import {
  useEvent, useCompleteEvent, useDeleteEvent,
  useRemoveTrainerFromEvent, getEventColor, getStatusColor,
} from './use-events'
import {
  useUnenroll, useUnenrollTeam, useSetEnrollmentStatus,
  useRequestEnrollment, useApproveEnrollmentRequest, useRejectEnrollmentRequest,
} from '@/features/enrollments/use-enrollments'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { DetailSkeleton } from '@/shared/components/loading-skeletons'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { cn } from '@/shared/utils/cn'
import { getInitials } from '@/shared/utils/format'
import type { EventEnrollmentStatus, EventEnrollmentInfo, EventTeamEnrollmentInfo } from '@/api/types'
import { EventFormDrawer } from './event-form-drawer'
import { CancelEventDrawer } from './cancel-event-drawer'
import { AssignTrainerDrawer } from './assign-trainer-drawer'
import { EnrollMemberDrawer } from '@/features/enrollments/enroll-member-drawer'
import { EnrollTeamDrawer } from '@/features/enrollments/enroll-team-drawer'
import { SubmitCancellationDrawer } from '@/features/enrollments/submit-cancellation-drawer'

function useDateLocale() {
  const { i18n } = useTranslation()
  return i18n.language === 'en' ? enUS : pl
}

export function EventDetailPage() {
  const { orgId, eventId } = useParams({ strict: false }) as { orgId: string; eventId: string }
  const router = useRouter()
  const { isAdminOrManager, isTrainer, isParticipant, user } = useAuthStore()
  const { t } = useTranslation()
  const locale = useDateLocale()

  const canManage = isAdminOrManager() || isTrainer()
  const canEdit = canManage
  const canDelete = isAdminOrManager()
  const isParticipantOnly = isParticipant() && !canManage

  const myMemberId = user?.memberships.find(m => m.organizationId === orgId)?.memberId

  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [trainerOpen, setTrainerOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [enrollMemberOpen, setEnrollMemberOpen] = useState(false)
  const [enrollTeamOpen, setEnrollTeamOpen] = useState(false)
  const [cancelRequestOpen, setCancelRequestOpen] = useState(false)
  const [requestEnrollOpen, setRequestEnrollOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [enrollmentActionTarget, setEnrollmentActionTarget] = useState<{
    enrollmentId: string
    displayName: string
    currentStatus: EventEnrollmentStatus
    isTeam?: boolean
  } | null>(null)

  const { data: event, isLoading, isError, refetch } = useEvent(orgId, eventId)
  const completeM = useCompleteEvent(orgId, eventId)
  const deleteM = useDeleteEvent(orgId)
  const removeTrainerM = useRemoveTrainerFromEvent(orgId, eventId)
  const unenrollM = useUnenroll(orgId, eventId)
  const unenrollTeamM = useUnenrollTeam(orgId, eventId)
  const setStatusM = useSetEnrollmentStatus(orgId, eventId)
  const requestEnrollM = useRequestEnrollment(orgId, eventId)
  const approveEnrollM = useApproveEnrollmentRequest(orgId, eventId)
  const rejectEnrollM = useRejectEnrollmentRequest(orgId, eventId)

  if (isLoading) return <DetailSkeleton />
  if (isError || !event) return <ErrorState onRetry={refetch} />

  const isScheduled = event.status === 'Scheduled'
  const color = getEventColor(event)

  // My enrollment state
  const myEnrollment = myMemberId
    ? event.enrollments.find(e => e.memberId === myMemberId)
    : undefined

  const handleComplete = async () => {
    try {
      await completeM.mutateAsync()
      toast.success(t('events.completed'))
    } catch {
      toast.error(t('events.completeFailed'))
    }
  }

  const handleDelete = async () => {
    try {
      await deleteM.mutateAsync(eventId)
      toast.success(t('events.deleted'))
      router.history.back()
    } catch {
      toast.error(t('events.deleteFailed'))
    }
  }

  const handleRemoveTrainer = async (memberId: string) => {
    try {
      await removeTrainerM.mutateAsync(memberId)
      toast.success(t('events.trainerRemoved'))
    } catch {
      toast.error(t('events.trainerRemoveFailed'))
    }
  }

  const startDate = parseISO(event.startTime)
  const endDate = parseISO(event.endTime)
  const dateLabel = format(startDate, 'EEEE, d MMMM yyyy', { locale })
  const timeLabel = `${format(startDate, 'HH:mm')} – ${format(endDate, 'HH:mm')}`

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={event.title}
          back={
            <Button variant="outline" size="sm" onClick={() => router.history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
          action={
            canEdit && isScheduled ? (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
                <Edit className="h-4 w-4" />{t('common.edit')}
              </Button>
            ) : undefined
          }
        />
      </div>

      {/* Status + type */}
      <div className="px-4 pt-4 flex items-center gap-2 flex-wrap">
        {color && (
          <span className="inline-block h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        )}
        <Badge className={cn('text-xs', getStatusColor(event.status))}>
          {t(`events.status${event.status}`)}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {t(`events.type${event.eventType}`)}
        </Badge>
        {event.groupName && (
          <Badge variant="outline" className="text-xs">
            {event.groupName}
          </Badge>
        )}
      </div>

      {/* Date & time */}
      <Section title={t('events.sectionDateTime')}>
        <InfoRow icon={<CalendarDays className="h-4 w-4" />} label={dateLabel} />
        <InfoRow icon={<Clock className="h-4 w-4" />} label={timeLabel} />
      </Section>

      {/* Location */}
      <Section title={t('events.sectionLocation')}>
        <InfoRow
          icon={<MapPin className="h-4 w-4" />}
          label={event.locationName ?? t('events.noLocation')}
          muted={!event.locationName}
        />
      </Section>

      {/* Series */}
      {event.eventSeriesId && (
        <Section title={t('events.sectionSeries')}>
          <InfoRow
            icon={<CalendarDays className="h-4 w-4" />}
            label={event.eventSeriesTitle ?? t('events.noSeries')}
          />
        </Section>
      )}

      {/* Unit cost */}
      {event.unitCost != null && (
        <Section title={t('events.sectionCost')}>
          <InfoRow
            icon={<span className="h-4 w-4 text-xs font-bold">$</span>}
            label={t('events.unitCostDisplay', { amount: event.unitCost.toFixed(2), currency: event.currency ?? '' })}
          />
        </Section>
      )}

      {/* Trainers */}
      <Section title={t('events.sectionTrainers')}>
        {canManage && isScheduled && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mb-2 gap-2"
            onClick={() => setTrainerOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t('events.addTrainer')}
          </Button>
        )}
        {event.trainers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('events.noTrainers')}</p>
        ) : (
          <div className="space-y-1">
            {event.trainers.map((tr) => (
              <TrainerRow
                key={tr.memberId}
                trainer={tr}
                canRemove={canManage && isScheduled}
                isRemoving={removeTrainerM.isPending}
                onRemove={handleRemoveTrainer}
              />
            ))}
          </div>
        )}
      </Section>

      {/* ── My enrollment (Participant view) ── */}
      {isParticipantOnly && isScheduled && (
        <MyEnrollmentSection
          enrollment={myEnrollment}
          onRequestEnroll={() => setRequestEnrollOpen(true)}
          onCancelRequest={() => setCancelRequestOpen(true)}
          t={t}
        />
      )}

      {/* ── Enrollments (Manager/Admin/Trainer view) ── */}
      {canManage && (
        <Section title={t('events.sectionEnrollments')}>
          <Tabs defaultValue="members">
            <TabsList className="w-full">
              <TabsTrigger value="members" className="flex-1 gap-1.5">
                <Users className="h-4 w-4" />
                {t('events.tabMembers', { count: event.enrollments.length })}
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex-1 gap-1.5">
                <UsersRound className="h-4 w-4" />
                {t('events.tabTeams', { count: event.teamEnrollments.length })}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="members">
              {isScheduled && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 gap-2"
                  onClick={() => setEnrollMemberOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  {t('events.enrollBtn')}
                </Button>
              )}
              {event.enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t('events.noEnrollments')}</p>
              ) : (
                <div className="mt-2 space-y-1">
                  {event.enrollments.map((en) => (
                    <EnrollmentRow
                      key={en.enrollmentId}
                      enrollment={en}
                      canManage={canManage && isScheduled}
                      onRowClick={() => setEnrollmentActionTarget({
                        enrollmentId: en.enrollmentId,
                        displayName: en.displayName,
                        currentStatus: en.status,
                      })}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="teams">
              {isScheduled && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 gap-2"
                  onClick={() => setEnrollTeamOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  {t('events.enrollTeamBtn')}
                </Button>
              )}
              {event.teamEnrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t('events.noTeamEnrollments')}</p>
              ) : (
                <div className="mt-2 space-y-1">
                  {event.teamEnrollments.map((te) => (
                    <TeamEnrollmentRow
                      key={te.enrollmentId}
                      enrollment={te}
                      canManage={canManage && isScheduled}
                      onRowClick={() => setEnrollmentActionTarget({
                        enrollmentId: te.enrollmentId,
                        displayName: te.teamName ?? t('members.teamWithoutName'),
                        currentStatus: te.status,
                        isTeam: true,
                      })}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Section>
      )}

      {/* Actions — jeden przycisk otwiera drawer */}
      {canManage && isScheduled && (
        <div className="px-4 mt-4">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setActionsOpen(true)}
          >
            {t('common.actions')}
          </Button>
        </div>
      )}

      {/* Drawers */}
      {canEdit && isScheduled && (
        <EventFormDrawer
          open={editOpen}
          onClose={() => setEditOpen(false)}
          orgId={orgId}
          eventId={eventId}
          initialData={event}
        />
      )}
      <CancelEventDrawer
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        orgId={orgId}
        eventId={eventId}
      />
      <AssignTrainerDrawer
        open={trainerOpen}
        onClose={() => setTrainerOpen(false)}
        orgId={orgId}
        eventId={eventId}
        assignedTrainerIds={event.trainers.map((tr) => tr.memberId)}
        eventStartTime={event.startTime}
        eventEndTime={event.endTime}
      />
      {canManage && (
        <>
          <EnrollMemberDrawer
            open={enrollMemberOpen}
            onClose={() => setEnrollMemberOpen(false)}
            orgId={orgId}
            eventId={eventId}
            enrolledMemberIds={event.enrollments.map(e => e.memberId)}
          />
          <EnrollTeamDrawer
            open={enrollTeamOpen}
            onClose={() => setEnrollTeamOpen(false)}
            orgId={orgId}
            eventId={eventId}
            enrolledTeamIds={event.teamEnrollments.map(e => e.teamId)}
          />
        </>
      )}
      {isParticipantOnly && myEnrollment && myEnrollment.status === 'Enrolled' && (
        <SubmitCancellationDrawer
          open={cancelRequestOpen}
          onClose={() => setCancelRequestOpen(false)}
          orgId={orgId}
          enrollmentId={myEnrollment.enrollmentId}
          eventTitle={event.title}
        />
      )}
      {isParticipantOnly && isScheduled && (
        <RequestEnrollmentDrawer
          open={requestEnrollOpen}
          onClose={() => setRequestEnrollOpen(false)}
          eventTitle={event.title}
          onSubmit={async (reason) => {
            await requestEnrollM.mutateAsync({ reason })
          }}
          isLoading={requestEnrollM.isPending}
          t={t}
        />
      )}
      <EnrollmentActionsDrawer
        open={enrollmentActionTarget !== null}
        onClose={() => setEnrollmentActionTarget(null)}
        target={enrollmentActionTarget}
        onChangeStatus={async (status) => {
          if (!enrollmentActionTarget) return
          try {
            await setStatusM.mutateAsync({ enrollmentId: enrollmentActionTarget.enrollmentId, data: { status } })
            toast.success(t('events.enrollmentStatusChanged'))
            setEnrollmentActionTarget(null)
          } catch {
            toast.error(t('events.enrollmentStatusFailed'))
          }
        }}
        onApproveRequest={async () => {
          if (!enrollmentActionTarget) return
          try {
            await approveEnrollM.mutateAsync({ enrollmentId: enrollmentActionTarget.enrollmentId, data: { approved: true } })
            toast.success(t('events.approveSuccess'))
            setEnrollmentActionTarget(null)
          } catch {
            toast.error(t('events.approveFailed'))
          }
        }}
        onRejectRequest={async () => {
          if (!enrollmentActionTarget) return
          try {
            await rejectEnrollM.mutateAsync({ enrollmentId: enrollmentActionTarget.enrollmentId, data: { approved: false } })
            toast.success(t('events.rejectSuccess'))
            setEnrollmentActionTarget(null)
          } catch {
            toast.error(t('events.rejectFailed'))
          }
        }}
        onUnenroll={async () => {
          if (!enrollmentActionTarget) return
          try {
            if (enrollmentActionTarget.isTeam) {
              await unenrollTeamM.mutateAsync(enrollmentActionTarget.enrollmentId)
            } else {
              await unenrollM.mutateAsync(enrollmentActionTarget.enrollmentId)
            }
            toast.success(t('events.unenrollSuccess'))
            setEnrollmentActionTarget(null)
          } catch {
            toast.error(t('events.unenrollFailed'))
          }
        }}
        isStatusLoading={setStatusM.isPending}
        isApproveLoading={approveEnrollM.isPending}
        isRejectLoading={rejectEnrollM.isPending}
        isUnenrollLoading={unenrollM.isPending || unenrollTeamM.isPending}
        t={t}
      />
      <ActionsDrawer
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        canDelete={canDelete}
        onComplete={() => { setActionsOpen(false); handleComplete() }}
        onCancel={() => { setActionsOpen(false); setCancelOpen(true) }}
        onDelete={() => { setActionsOpen(false); setDeleteConfirmOpen(true) }}
        isCompleting={completeM.isPending}
        t={t}
      />
      <DeleteConfirmDrawer
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteM.isPending}
        t={t}
      />
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({
  title, children, action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="px-4 mt-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ icon, label, muted }: { icon: React.ReactNode; label: string; muted?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5 py-1', muted && 'text-muted-foreground')}>
      <span className="text-muted-foreground flex-shrink-0">{icon}</span>
      <span className="text-sm">{label}</span>
    </div>
  )
}

function TrainerRow({
  trainer, canRemove, isRemoving, onRemove,
}: {
  trainer: { memberId: string; displayName: string; photoUrl?: string }
  canRemove: boolean
  isRemoving: boolean
  onRemove: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <Avatar className="h-8 w-8">
        <AvatarImage src={trainer.photoUrl} />
        <AvatarFallback className="bg-primary/20 text-primary text-xs">
          {getInitials(trainer.displayName)}
        </AvatarFallback>
      </Avatar>
      <span className="flex-1 text-sm font-medium">{trainer.displayName}</span>
      {canRemove && (
        <button
          onClick={() => onRemove(trainer.memberId)}
          disabled={isRemoving}
          className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          aria-label="Usuń trenera"
        >
          {isRemoving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  )
}

const enrollmentStatusColors: Record<EventEnrollmentStatus, string> = {
  PendingApproval: 'text-amber-600',
  Enrolled: 'text-blue-600',
  Attended: 'text-green-600',
  Cancelled: 'text-red-500',
  Absent: 'text-orange-500',
}

function EnrollmentRow({
  enrollment, canManage, onRowClick, t,
}: {
  enrollment: EventEnrollmentInfo
  canManage: boolean
  onRowClick: () => void
  t: ReturnType<typeof useTranslation>['t']
}) {
  const Wrapper = canManage ? 'button' : 'div'
  return (
    <Wrapper
      {...(canManage ? { onClick: onRowClick } : {})}
      className={cn(
        'w-full flex items-center gap-2.5 py-2 px-2 rounded-xl transition-colors text-left',
        canManage && 'hover:bg-accent active:bg-accent/70 cursor-pointer',
      )}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={enrollment.photoUrl} />
        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
          {getInitials(enrollment.displayName)}
        </AvatarFallback>
      </Avatar>
      <span className="flex-1 text-sm">{enrollment.displayName}</span>
      <span className={cn('text-xs font-medium', enrollmentStatusColors[enrollment.status])}>
        {t(`events.enrollmentStatus${enrollment.status}`)}
      </span>
      {canManage && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
    </Wrapper>
  )
}

function TeamEnrollmentRow({
  enrollment, canManage, onRowClick, t,
}: {
  enrollment: EventTeamEnrollmentInfo
  canManage: boolean
  onRowClick: () => void
  t: ReturnType<typeof useTranslation>['t']
}) {
  const Wrapper = canManage ? 'button' : 'div'
  return (
    <Wrapper
      {...(canManage ? { onClick: onRowClick } : {})}
      className={cn(
        'w-full flex items-center gap-2.5 py-2 px-2 rounded-xl transition-colors text-left',
        canManage && 'hover:bg-accent active:bg-accent/70 cursor-pointer',
      )}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
          <UsersRound className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <span className="flex-1 text-sm">
        {enrollment.teamName}
        {enrollment.memberNames.length > 0 && (
          <span className="text-xs text-muted-foreground ml-1">({enrollment.memberNames.length})</span>
        )}
      </span>
      <span className={cn('text-xs font-medium', enrollmentStatusColors[enrollment.status])}>
        {t(`events.enrollmentStatus${enrollment.status}`)}
      </span>
      {canManage && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
    </Wrapper>
  )
}

function MyEnrollmentSection({
  enrollment, onRequestEnroll, onCancelRequest, t,
}: {
  enrollment: EventEnrollmentInfo | undefined
  onRequestEnroll: () => void
  onCancelRequest: () => void
  t: ReturnType<typeof useTranslation>['t']
}) {
  const isPending = enrollment?.status === 'PendingApproval'
  const isEnrolled = enrollment?.status === 'Enrolled'
  const isNoEnrollment = !enrollment || enrollment.status === 'Cancelled'

  return (
    <Section title={t('events.enrollSectionTitle')}>
      {isNoEnrollment ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-dashed border-border px-4 py-4 text-center">
            <p className="text-sm text-muted-foreground">{t('events.notEnrolledBadge')}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={onRequestEnroll}
          >
            <Plus className="h-4 w-4" />
            {t('events.requestEnrollBtn')}
          </Button>
        </div>
      ) : isPending ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{t('events.enrollmentPendingBadge')}</p>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-500">{t('events.enrollmentPendingDesc')}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t('events.enrolledBadge')}</p>
            <Badge className={cn('text-xs', enrollmentStatusColors[enrollment.status])}>
              {t(`events.enrollmentStatus${enrollment.status}`)}
            </Badge>
          </div>
          {isEnrolled && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950"
              onClick={onCancelRequest}
            >
              <XCircle className="h-4 w-4" />
              {t('events.cancelRequestBtn')}
            </Button>
          )}
        </div>
      )}
    </Section>
  )
}

function EnrollmentActionsDrawer({
  open, onClose, target, onChangeStatus, onApproveRequest, onRejectRequest, onUnenroll,
  isStatusLoading, isApproveLoading, isRejectLoading, isUnenrollLoading, t,
}: {
  open: boolean
  onClose: () => void
  target: { enrollmentId: string; displayName: string; currentStatus: EventEnrollmentStatus; isTeam?: boolean } | null
  onChangeStatus: (status: EventEnrollmentStatus) => Promise<void>
  onApproveRequest: () => Promise<void>
  onRejectRequest: () => Promise<void>
  onUnenroll: () => Promise<void>
  isStatusLoading: boolean
  isApproveLoading: boolean
  isRejectLoading: boolean
  isUnenrollLoading: boolean
  t: ReturnType<typeof useTranslation>['t']
}) {
  const ALL_STATUSES: { value: EventEnrollmentStatus; labelKey: string; color: string; bg: string }[] = [
    { value: 'Enrolled',  labelKey: 'events.enrollmentStatusEnrolled',  color: 'text-blue-600',   bg: 'hover:bg-blue-50 dark:hover:bg-blue-950/40' },
    { value: 'Attended',  labelKey: 'events.enrollmentStatusAttended',  color: 'text-green-600',  bg: 'hover:bg-green-50 dark:hover:bg-green-950/40' },
    { value: 'Absent',    labelKey: 'events.enrollmentStatusAbsent',    color: 'text-orange-500', bg: 'hover:bg-orange-50 dark:hover:bg-orange-950/40' },
    { value: 'Cancelled', labelKey: 'events.enrollmentStatusCancelled', color: 'text-red-500',    bg: 'hover:bg-red-50 dark:hover:bg-red-950/40' },
  ]

  if (!target) return null

  const isPendingApproval = target.currentStatus === 'PendingApproval'

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            {target.isTeam
              ? <UsersRound className="h-4 w-4 text-muted-foreground" />
              : <Users className="h-4 w-4 text-muted-foreground" />}
            {target.displayName}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-1">
          {isPendingApproval ? (
            <>
              {/* PendingApproval — akcje zatwierdzenia/odrzucenia */}
              <p className="text-xs text-muted-foreground px-1 pb-1">
                {t('events.enrollmentStatusPendingApproval')}
              </p>
              <button
                onClick={onApproveRequest}
                disabled={isApproveLoading || isRejectLoading}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-green-50 dark:hover:bg-green-950/40 disabled:opacity-50"
              >
                {isApproveLoading
                  ? <Loader2 className="h-5 w-5 text-green-600 animate-spin flex-shrink-0" />
                  : <ClipboardCheck className="h-5 w-5 text-green-600 flex-shrink-0" />}
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  {t('events.approveRequestBtn')}
                </span>
              </button>
              <div className="h-px bg-border" />
              <button
                onClick={onRejectRequest}
                disabled={isApproveLoading || isRejectLoading}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                {isRejectLoading
                  ? <Loader2 className="h-5 w-5 text-destructive animate-spin flex-shrink-0" />
                  : <ClipboardX className="h-5 w-5 text-destructive flex-shrink-0" />}
                <span className="text-sm font-medium text-destructive">
                  {t('events.rejectRequestBtn')}
                </span>
              </button>
            </>
          ) : (
            <>
              {/* Normalny status — change status options */}
              <p className="text-xs text-muted-foreground px-1 pb-1">{t('events.changeStatusTitle')}</p>
              {ALL_STATUSES.map(({ value, labelKey, color, bg }) => {
                const isCurrent = value === target.currentStatus
                return (
                  <button
                    key={value}
                    onClick={() => onChangeStatus(value)}
                    disabled={isStatusLoading || isCurrent}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
                      isCurrent ? 'bg-muted/50 cursor-default' : bg,
                    )}
                  >
                    <span className={cn('flex-1 text-sm font-medium', color)}>{t(labelKey)}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('common.current')}
                      </span>
                    )}
                    {isStatusLoading && !isCurrent && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </button>
                )
              })}
            </>
          )}

          {/* Divider + unenroll */}
          <div className="h-px bg-border my-1" />
          <button
            onClick={onUnenroll}
            disabled={isUnenrollLoading}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-destructive/10"
          >
            {isUnenrollLoading
              ? <Loader2 className="h-4 w-4 animate-spin text-destructive flex-shrink-0" />
              : <UserMinus className="h-4 w-4 text-destructive flex-shrink-0" />}
            <span className="text-sm font-medium text-destructive">{t('events.unenrollBtn')}</span>
          </button>
        </div>

        <DrawerFooter>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function ActionsDrawer({
  open, onClose, canDelete, onComplete, onCancel, onDelete, isCompleting, t,
}: {
  open: boolean
  onClose: () => void
  canDelete: boolean
  onComplete: () => void
  onCancel: () => void
  onDelete: () => void
  isCompleting: boolean
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('common.actions')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2 space-y-2">
          <button
            onClick={onComplete}
            disabled={isCompleting}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-green-50 dark:hover:bg-green-950/40 disabled:opacity-50"
          >
            {isCompleting
              ? <Loader2 className="h-5 w-5 text-green-600 animate-spin flex-shrink-0" />
              : <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
            <span className="text-sm font-medium text-green-700 dark:text-green-400">{t('events.completeBtn')}</span>
          </button>
          <div className="h-px bg-border" />
          <button
            onClick={onCancel}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-orange-50 dark:hover:bg-orange-950/40"
          >
            <XCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">{t('events.cancelBtn')}</span>
          </button>
          {canDelete && (
            <>
              <div className="h-px bg-border" />
              <button
                onClick={onDelete}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-5 w-5 text-destructive flex-shrink-0" />
                <span className="text-sm font-medium text-destructive">{t('events.deleteBtn')}</span>
              </button>
            </>
          )}
        </div>
        <DrawerFooter>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function RequestEnrollmentDrawer({
  open, onClose, eventTitle, onSubmit, isLoading, t,
}: {
  open: boolean
  onClose: () => void
  eventTitle: string
  onSubmit: (reason?: string) => Promise<void>
  isLoading: boolean
  t: ReturnType<typeof useTranslation>['t']
}) {
  const [reason, setReason] = useState('')

  const handleSubmit = async () => {
    try {
      await onSubmit(reason.trim() || undefined)
      toast.success(t('events.requestEnrollSuccess'))
      setReason('')
      onClose()
    } catch {
      toast.error(t('events.requestEnrollFailed'))
    }
  }

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) { setReason(''); onClose() } }}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('events.requestEnrollTitle')}</DrawerTitle>
          <p className="text-sm text-muted-foreground mt-1">{eventTitle}</p>
        </DrawerHeader>
        <div className="px-4 pb-2 space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('events.requestEnrollReasonLabel')}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('events.requestEnrollReasonPlaceholder')}
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('events.requestEnrollSubmit')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function DeleteConfirmDrawer({
  open, onClose, onConfirm, isLoading, t,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('events.deleteBtn')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <p className="text-sm text-muted-foreground">{t('events.deleteConfirm')}</p>
        </div>
        <DrawerFooter>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('events.deleteBtn')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
