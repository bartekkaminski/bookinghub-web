import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Building2, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { authApi } from '@/api/endpoints'
import { useOrganizations, useCreateOrganization, useOrganizationCreationLimits } from './use-organizations'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter,
} from '@/shared/components/ui/drawer'
import { ApiError } from '@/api/errors'
import type { CreateOrganizationRequest } from '@/api/types'

export function OrgSelectPage() {
  const navigate = useNavigate()
  const { user, setCurrentOrg, setUser } = useAuthStore()
  const { t } = useTranslation()
  const [createOpen, setCreateOpen] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const { data, isLoading } = useOrganizations({ pageSize: 50 })
  const { data: limits } = useOrganizationCreationLimits()
  const createMutation = useCreateOrganization()

  const canCreate = limits?.canCreate ?? true
  const hasOrgs = (data?.items.length ?? 0) > 0

  const handleSelectOrg = async (orgId: string) => {
    setCurrentOrg(orgId)
    try {
      const freshUser = await authApi.getMe()
      setUser(freshUser)
    } catch { /* ignoruj */ }
    navigate({ to: `/org/${orgId}/dashboard` })
  }

  const handleCreate = async (formData: CreateOrganizationRequest) => {
    try {
      const org = await createMutation.mutateAsync(formData)
      setCreateOpen(false)
      setIsRedirecting(true)
      toast.success(t('orgs.created', { name: org.name }))
      try {
        const freshUser = await authApi.me()
        setUser(freshUser)
      } catch { /* ignoruj */ }
      handleSelectOrg(org.id)
    } catch (err) {
      if (err instanceof ApiError && err.isCreationLimitReached) {
        toast.error(t('orgs.createLimitReached', { max: limits?.maxOrganizationsPerCreator ?? 1 }))
      } else {
        toast.error(t('orgs.createFailed'))
      }
    }
  }

  // Spinner podczas ładowania lub przekierowywania – żaden widok nie mignie
  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Ekran powitalny – brak organizacji
  if (!hasOrgs) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-start px-6 pt-12 pb-8">
        <div className="w-full max-w-sm flex flex-col gap-8">
          {/* Logo / Brand */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
              <span className="text-2xl font-black text-white">BH</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">BookingHub</h1>
              <p className="text-sm text-muted-foreground mt-1">{t('auth.subtitle')}</p>
            </div>
          </div>

          {/* Zachęta */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold">{t('orgs.welcomeHeading')}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('orgs.welcomeDesc')}</p>
          </div>

          {/* Formularz inline */}
          <WelcomeCreateForm
            onSubmit={handleCreate}
            isLoading={createMutation.isPending}
            canCreate={canCreate}
            maxOrgs={limits?.maxOrganizationsPerCreator ?? 1}
            formTitle={t('orgs.welcomeFormTitle')}
            t={t}
          />

          {user?.email && (
            <p className="text-center text-xs text-muted-foreground">{user.email}</p>
          )}
        </div>
      </div>
    )
  }

  // Widok zmiany organizacji (lista)
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-semibold">{t('orgs.yourOrgs')}</h1>
            {user?.email && (
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-2">
        {data?.items.map((org) => (
            <button
              key={org.id}
              onClick={() => handleSelectOrg(org.id)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-left"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                {org.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{org.name}</p>
                <p className="text-xs text-muted-foreground">{t('orgs.membersCount', { count: org.membersCount })}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
      </div>

      <div className="sticky bottom-0 px-4 pt-4 bg-background border-t border-border" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}>
        <Button
          className="w-full gap-2"
          onClick={() => setCreateOpen(true)}
          disabled={!canCreate}
          title={!canCreate ? t('orgs.createLimitReachedBtn') : undefined}
        >
          <Plus className="h-4 w-4" />
          {canCreate ? t('orgs.createOrg') : t('orgs.createLimitReachedBtn')}
        </Button>
      </div>

      <CreateOrgDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />
    </div>
  )
}

// Formularz inline na ekranie powitalnym
function WelcomeCreateForm({
  onSubmit, isLoading, canCreate, maxOrgs, formTitle, t,
}: {
  onSubmit: (data: CreateOrganizationRequest) => void
  isLoading: boolean
  canCreate: boolean
  maxOrgs: number
  formTitle: string
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !canCreate) return
    onSubmit({ name: name.trim(), description: description.trim() || undefined })
  }

  if (!canCreate) {
    return (
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
        <Building2 className="h-6 w-6 mx-auto mb-2 opacity-50" />
        {t('orgs.createLimitReached', { max: maxOrgs })}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-medium text-foreground">{formTitle}</p>
      <div className="space-y-2">
        <Label htmlFor="welcome-org-name">{t('orgs.orgName')}</Label>
        <Input
          id="welcome-org-name"
          placeholder={t('orgs.orgNamePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="welcome-org-desc">{t('orgs.orgDesc')}</Label>
        <Textarea
          id="welcome-org-desc"
          placeholder={t('orgs.orgDescPlaceholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full gap-2" disabled={!name.trim() || isLoading}>
        {isLoading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Plus className="h-4 w-4" />}
        {t('orgs.createOrgBtn')}
      </Button>
    </form>
  )
}

function CreateOrgDrawer({
  open, onClose, onSubmit, isLoading,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateOrganizationRequest) => void
  isLoading: boolean
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: description.trim() || undefined })
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{t('orgs.newOrg')}</DrawerTitle></DrawerHeader>
        <form onSubmit={handleSubmit} className="px-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">{t('orgs.orgName')}</Label>
            <Input id="org-name" placeholder={t('orgs.orgNamePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-desc">{t('orgs.orgDesc')}</Label>
            <Textarea id="org-desc" placeholder={t('orgs.orgDescPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </form>
        <DrawerFooter>
          <Button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={!name.trim() || isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('orgs.createOrgBtn')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
