import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Users, Grid3X3, UsersRound, MapPin, CalendarDays, ChevronRight, Loader2, ClipboardList, Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useOrganization } from './use-organizations'
import { usePendingCancellationRequests } from '@/features/enrollments/use-cancellation-requests'
import { usePendingEnrollmentRequests } from '@/features/enrollments/use-enrollments'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { ErrorState } from '@/shared/components/error-state'
import type { UpdateOrganizationRequest } from '@/api/types'

export function DashboardPage() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const navigate = useNavigate()
  const { user, isAdminOrManager, isTrainer, isAdmin } = useAuthStore()
  const { t } = useTranslation()

  const canSeeOrgLists = isAdminOrManager() || isTrainer()
  const isParticipantOnly = !canSeeOrgLists

  useEffect(() => {
    if (isParticipantOnly) {
      navigate({ to: `/org/${orgId}/calendar`, replace: true })
    }
  }, [isParticipantOnly, orgId, navigate])

  const { data: org, isLoading, isError, refetch } = useOrganization(orgId)
  const { data: pendingCancellations } = usePendingCancellationRequests(canSeeOrgLists ? orgId : '')
  const { data: pendingEnrollments } = usePendingEnrollmentRequests(canSeeOrgLists ? orgId : '')

  const pendingCount = (pendingCancellations?.length ?? 0) + (pendingEnrollments?.length ?? 0)

  if (isParticipantOnly) return null

  if (isLoading) {
    return (
      <div className="px-4 pt-10 pb-6 flex flex-col items-center">
        <Skeleton className="h-20 w-20 rounded-2xl" />
        <Skeleton className="h-7 w-48 mt-5 mb-7" />
        <div className="w-full space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (isError) return <ErrorState onRetry={refetch} />

  const currentMembership = user?.memberships.find(m => m.organizationId === orgId)

  const quickLinks = [
    { label: t('dashboard.calendar'), icon: <CalendarDays className="h-5 w-5" />, href: `/org/${orgId}/calendar` },
    ...(canSeeOrgLists ? [
      { label: t('dashboard.users'), icon: <Users className="h-5 w-5" />, href: `/org/${orgId}/members` },
      { label: t('dashboard.groups'), icon: <Grid3X3 className="h-5 w-5" />, href: `/org/${orgId}/groups` },
      { label: t('dashboard.teams'), icon: <UsersRound className="h-5 w-5" />, href: `/org/${orgId}/teams` },
      { label: t('dashboard.pendingRequests'), icon: <ClipboardList className="h-5 w-5" />, href: `/org/${orgId}/pending-requests` },
    ] : []),
    { label: t('dashboard.locations'), icon: <MapPin className="h-5 w-5" />, href: `/org/${orgId}/locations` },
    ...(isAdmin() ? [
      { label: t('dashboard.disciplines'), icon: <Layers className="h-5 w-5" />, href: `/org/${orgId}/disciplines` },
    ] : []),
  ]

  return (
    <div className="px-4 pt-10 pb-6 flex flex-col items-center">
      {/* Logo */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
        <span className="text-3xl font-black text-white">BH</span>
      </div>

      {/* Nazwa organizacji */}
      <h1 className="text-2xl font-bold text-center mt-5 mb-7">{org?.name}</h1>

      {/* Baner oczekujących wniosków */}
      {canSeeOrgLists && pendingCount > 0 && (
        <button
          onClick={() => navigate({ to: `/org/${orgId}/pending-requests` })}
          className="w-full rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 px-4 py-3.5 flex items-center gap-3 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors text-left mb-2"
        >
          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center relative">
            <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
              {t('pendingRequests.bannerTitle')}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              {t('pendingRequests.bannerDesc_other', { count: pendingCount })}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-orange-400 flex-shrink-0" />
        </button>
      )}

      {/* Szybkie linki */}
      <div className="w-full space-y-2">
        {quickLinks.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate({ to: item.href })}
            className="w-full rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:bg-accent transition-colors text-left"
          >
            <span className="text-muted-foreground flex-shrink-0">{item.icon}</span>
            <span className="text-sm font-medium flex-1">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Ramka użytkownika — klikalny skrót do profilu */}
      {user && (
        <button
          type="button"
          onClick={() => navigate({ to: `/org/${orgId}/profile` })}
          className="w-full mt-5 rounded-xl border border-border px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left"
        >
          <div className="flex flex-col flex-1 items-center gap-0.5">
            <p className="text-xs text-muted-foreground">{t('nav.profile')}</p>
            <p className="text-sm font-medium">{user.fullName ?? user.email}</p>
            {currentMembership && (
              <p className="text-xs text-muted-foreground">
                {currentMembership.roles.map(r => t(`members.role${r}`)).join(', ')}
              </p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </button>
      )}
    </div>
  )
}

export function EditOrgDrawer({
  open, onClose, onSubmit, isLoading, initialData,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: UpdateOrganizationRequest) => void
  isLoading: boolean
  initialData: { name: string; description?: string }
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialData.name)
  const [description, setDescription] = useState(initialData.description ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: description.trim() || undefined })
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{t('orgs.editOrg')}</DrawerTitle></DrawerHeader>
        <form onSubmit={handleSubmit} className="px-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-org-name">{t('orgs.editOrgName')}</Label>
            <Input id="edit-org-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-org-desc">{t('common.description')}</Label>
            <Textarea id="edit-org-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </form>
        <DrawerFooter>
          <Button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={!name.trim() || isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('common.saveChanges')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
