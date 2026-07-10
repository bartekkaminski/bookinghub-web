import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Users, Grid3X3, UsersRound, MapPin, ChevronRight, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useOrganization } from './use-organizations'
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
  const { user } = useAuthStore()
  const { t } = useTranslation()

  const { data: org, isLoading, isError, refetch } = useOrganization(orgId)

  if (isLoading) {
    return (
      <div>
        <div className="h-14 bg-background border-b border-border" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-20 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (isError) return <ErrorState onRetry={refetch} />

  const currentMembership = user?.memberships.find(m => m.organizationId === orgId)

  const quickLinks = [
    { label: t('dashboard.users'), icon: <Users className="h-4 w-4" />, href: `/app/org/${orgId}/members` },
    { label: t('dashboard.groups'), icon: <Grid3X3 className="h-4 w-4" />, href: `/app/org/${orgId}/groups` },
    { label: t('dashboard.teams'), icon: <UsersRound className="h-4 w-4" />, href: `/app/org/${orgId}/teams` },
    { label: t('dashboard.locations'), icon: <MapPin className="h-4 w-4" />, href: `/app/org/${orgId}/locations` },
  ]

  return (
    <div>
      <div className="flex flex-col items-center gap-1 pt-8 pb-4 px-4">
        {user?.fullName && (
          <p className="text-lg text-muted-foreground font-medium">
            {t('dashboard.welcome', { name: user.fullName.split(' ')[0] })}
          </p>
        )}
        <h1 className="text-3xl font-bold text-center">{org?.name}</h1>
      </div>

      <div className="px-4 space-y-2 pt-2">
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

      {currentMembership && (
        <p className="text-xs text-muted-foreground text-center px-4 pt-4">
          {t('dashboard.accountType', { roles: currentMembership.roles.join(', ') })}
        </p>
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
