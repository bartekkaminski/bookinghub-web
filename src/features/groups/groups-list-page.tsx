import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Plus, Grid3X3, ChevronRight, Search, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useGroups, useCreateGroup } from './use-groups'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import { ListSkeleton } from '@/shared/components/loading-skeletons'
import { EmptyState } from '@/shared/components/empty-state'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import type { CreateGroupRequest } from '@/api/types'
import { useDebounce } from '@/shared/hooks/use-debounce'

export function GroupsListPage() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const navigate = useNavigate()
  const { isAdminOrManager } = useAuthStore()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError, refetch } = useGroups(orgId, { search: debouncedSearch || undefined, pageSize: 50 })
  const createMutation = useCreateGroup(orgId)

  const handleCreate = async (data: CreateGroupRequest) => {
    try {
      await createMutation.mutateAsync(data)
      setCreateOpen(false)
      toast.success(t('groups.created'))
    } catch {
      toast.error(t('groups.createFailed'))
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={t('groups.title')}
          back={<Button variant="outline" size="sm" onClick={() => navigate({ to: `/app/org/${orgId}/dashboard` })}><ArrowLeft className="h-4 w-4" /></Button>}
          action={isAdminOrManager() ? (
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />{t('common.add')}
            </Button>
          ) : undefined}
        />
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('groups.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
      </div>

      {isLoading ? <ListSkeleton /> : isError ? <ErrorState onRetry={refetch} /> :
        data?.items.length === 0 ? (
          <EmptyState icon={<Grid3X3 className="h-8 w-8" />} title={t('groups.noGroups')} description={t('groups.noGroupsDesc')}
            action={isAdminOrManager() ? <Button size="sm" onClick={() => setCreateOpen(true)}>{t('groups.createGroup')}</Button> : undefined}
          />
        ) : (
          <div className="divide-y divide-border">
            {data?.items.map((group) => (
              <button key={group.id} onClick={() => navigate({ to: `/app/org/${orgId}/groups/${group.id}` })}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left">
                <div className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: group.color ?? '#6d28d9' }}>
                  {group.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{group.name}</span>
                    {!group.isActive && <Badge variant="secondary" className="text-xs">{t('groups.inactiveBadge')}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('groups.countStats', { members: group.membersCount, teams: group.teamsCount })}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )
      }

      <GroupFormDrawer open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate}
        isLoading={createMutation.isPending} title={t('groups.newGroup')} />
    </div>
  )
}

export function GroupFormDrawer({ open, onClose, onSubmit, isLoading, title, initialData }: {
  open: boolean; onClose: () => void; onSubmit: (data: CreateGroupRequest) => void; isLoading: boolean
  title: string; initialData?: { name: string; description?: string; color?: string }
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [color, setColor] = useState(initialData?.color ?? '#6d28d9')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: description.trim() || undefined, color })
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{title}</DrawerTitle></DrawerHeader>
        <form onSubmit={handleSubmit} className="px-4 space-y-3">
          <div className="space-y-2">
            <Label>{t('groups.nameLabel')}</Label>
            <Input placeholder={t('groups.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-2">
            <Label>{t('common.description')}</Label>
            <Textarea placeholder={t('groups.descPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>{t('common.color')}</Label>
            <div className="flex flex-wrap gap-2">
              {['#6d28d9','#2563eb','#059669','#dc2626','#d97706','#db2777','#0891b2','#65a30d','#7c3aed','#475569'].map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-lg border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </form>
        <DrawerFooter>
          <Button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={!name.trim() || isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {initialData ? t('common.save') : t('groups.createBtn')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
