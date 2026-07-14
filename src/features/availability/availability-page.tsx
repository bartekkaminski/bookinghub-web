import { useRef, useState, useEffect } from 'react'
import { useParams, useRouter } from '@tanstack/react-router'
import { ArrowLeft, CalendarDays, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useMember } from '@/features/members/use-members'
import { Button } from '@/shared/components/ui/button'
import { PageHeader } from '@/shared/components/page-header'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { AvailabilityMonthCalendar } from './availability-month-calendar'
import { AvailabilityDayView } from './availability-day-view'
import { AvailabilitySlotForm } from './availability-slot-form'

export function AvailabilityPage() {
  const params = useParams({ strict: false }) as { orgId: string; memberId?: string }
  const orgId  = params.orgId
  const router = useRouter()
  const { t }  = useTranslation()
  const auth   = useAuthStore()

  const membership = auth.getCurrentMembership()
  const ownMemberId = membership?.memberId ?? ''

  // Jeśli w URL jest memberId (trasa /members/:memberId/availability) → cudzy grafik
  const targetMemberId = params.memberId ?? ownMemberId
  const isOwnSchedule  = targetMemberId === ownMemberId

  // Dane cudzego członka (potrzebne tylko gdy oglądamy czyjś grafik)
  const { data: targetMember, isLoading: memberLoading } = useMember(
    orgId,
    !isOwnSchedule ? targetMemberId : '',
  )

  const ownDisplayName = auth.user?.fullName ?? auth.user?.firstName ?? t('availability.mySchedule')
  const displayName    = isOwnSchedule
    ? ownDisplayName
    : (targetMember?.displayName ?? targetMember?.firstName ?? '...')

  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date())
  const [addOpen, setAddOpen]           = useState(false)
  const dayViewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      dayViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  // Admin/Manager może edytować każdego. Trainer tylko własny grafik.
  const canEdit = auth.isAdminOrManager() || (auth.isTrainer() && isOwnSchedule)

  function handleDaySelect(date: Date) {
    setSelectedDate(date)
    setTimeout(() => {
      dayViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  if (!ownMemberId) return null

  return (
    <div className="pb-8">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={isOwnSchedule ? t('availability.title') : t('availability.memberSchedule')}
          back={
            <Button variant="outline" size="sm" onClick={() => router.history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
      </div>

      {/* Avatar / imię / CTA */}
      <div className="px-4">
        <div className="flex flex-col items-center gap-3 pt-4 pb-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <CalendarDays className="h-8 w-8" />
          </div>
          {memberLoading && !isOwnSchedule ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <h2 className="text-xl font-semibold text-center">{displayName}</h2>
          )}
          {canEdit && (
            <Button size="sm" className="gap-2 px-5" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Dodaj dostępność
            </Button>
          )}
        </div>
      </div>

      {/* Monthly calendar */}
      <div className="border-t border-border px-4 pt-4">
        <AvailabilityMonthCalendar
          orgId={orgId}
          memberId={targetMemberId}
          selectedDate={selectedDate}
          onDaySelect={handleDaySelect}
        />
      </div>

      {/* Day view */}
      {selectedDate && (
        <div ref={dayViewRef} className="border-t border-border mt-4 flex flex-col" style={{ minHeight: 260 }}>
          <AvailabilityDayView
            orgId={orgId}
            memberId={targetMemberId}
            date={selectedDate}
            canEdit={canEdit}
          />
        </div>
      )}

      {/* Formularz dodawania */}
      <AvailabilitySlotForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        orgId={orgId}
        memberId={targetMemberId}
        preselectedDate={selectedDate}
      />
    </div>
  )
}
