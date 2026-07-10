import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Building2, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { authApi } from '@/api/endpoints'
import { useOrganizations, useCreateOrganization } from './use-organizations'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter,
} from '@/shared/components/ui/drawer'
import { EmptyState } from '@/shared/components/empty-state'
import type { CreateOrganizationRequest } from '@/api/types'

export function OrgSelectPage() {
  const navigate = useNavigate()
  const { user, setCurrentOrg, setUser } = useAuthStore()
  const { t } = useTranslation()
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading } = useOrganizations({ pageSize: 50 })
  const createMutation = useCreateOrganization()

  const handleSelectOrg = async (orgId: string) => {
    setCurrentOrg(orgId)
    try {
      const freshUser = await authApi.getMe()
      setUser(freshUser)
    } catch { /* ignoruj */ }
    navigate({ to: `/app/org/${orgId}/dashboard` })
  }

  const handleCreate = async (formData: CreateOrganizationRequest) => {
    try {
      const org = await createMutation.mutateAsync(formData)
      setCreateOpen(false)
      toast.success(t('orgs.created', { name: org.name }))
      try {
        const freshUser = await authApi.me()
        setUser(freshUser)
      } catch { /* ignoruj */ }
      handleSelectOrg(org.id)
    } catch {
      toast.error(t('orgs.createFailed'))
    }
  }

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
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))
        ) : data?.items.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-8 w-8" />}
            title={t('orgs.noOrgs')}
            description={t('orgs.noOrgsDesc')}
          />
        ) : (
          data?.items.map((org) => (
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
          ))
        )}
      </div>

      <div className="px-4 pt-4 border-t border-border" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}>
        <Button className="w-full gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('orgs.createOrg')}
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
