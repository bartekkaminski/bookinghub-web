import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Plus, UsersRound, ChevronRight, Search, Loader2, ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useTeams, useCreateTeam } from './use-teams'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { ListSkeleton } from '@/shared/components/loading-skeletons'
import { EmptyState } from '@/shared/components/empty-state'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import type { CreateTeamRequest } from '@/api/types'
import { useDebounce } from '@/shared/hooks/use-debounce'

export function TeamsListPage() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const navigate = useNavigate()
  const { isAdminOrManager } = useAuthStore()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError, refetch } = useTeams(orgId, {
    search: debouncedSearch || undefined,
    pageSize: 50,
  })
  const createMutation = useCreateTeam(orgId)

  const handleCreate = async (data: CreateTeamRequest) => {
    try {
      await createMutation.mutateAsync(data)
      setCreateOpen(false)
      toast.success(t('teams.created'))
    } catch {
      toast.error(t('teams.createFailed'))
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={t('teams.title')}
          back={<Button variant="outline" size="sm" onClick={() => navigate({ to: `/org/${orgId}/dashboard` })}><ArrowLeft className="h-4 w-4" /></Button>}
          action={isAdminOrManager() ? (
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />{t('common.add')}
            </Button>
          ) : undefined}
        />
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('teams.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
      </div>

      {isLoading ? <ListSkeleton /> : isError ? <ErrorState onRetry={refetch} /> :
        data?.items.length === 0 ? (
          <EmptyState icon={<UsersRound className="h-8 w-8" />} title={t('teams.noTeams')}
            action={isAdminOrManager() ? <Button size="sm" onClick={() => setCreateOpen(true)}>{t('teams.createTeam')}</Button> : undefined}
          />
        ) : (
          <div className="divide-y divide-border">
            {data?.items.map((team) => (
              <button key={team.id} onClick={() => navigate({ to: `/org/${orgId}/teams/${team.id}` })}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <UsersRound className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{team.name ?? `${t('teams.title')} ${team.priority ?? ''}`}</span>
                    {!team.isActive && <Badge variant="secondary" className="text-xs">{t('teams.inactiveBadge')}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('teams.membersCount', { count: team.membersCount })}
                    {team.priority !== undefined && team.priority !== null && ` · ${t('teams.priorityBadge', { n: team.priority })}`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )
      }

      <TeamFormDrawer open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate}
        isLoading={createMutation.isPending} title={t('teams.newTeam')} />
    </div>
  )
}

export function TeamFormDrawer({ open, onClose, onSubmit, isLoading, title, initialData, onDelete }: {
  open: boolean; onClose: () => void; onSubmit: (data: CreateTeamRequest) => void; isLoading: boolean
  title: string; initialData?: { name?: string; priority?: number; notes?: string }
  onDelete?: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialData?.name ?? '')
  const [priority, setPriority] = useState(String(initialData?.priority ?? ''))
  const [notes, setNotes] = useState(initialData?.notes ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name: name.trim() || undefined, priority: priority ? Number(priority) : undefined, notes: notes.trim() || undefined })
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{title}</DrawerTitle></DrawerHeader>
        <form onSubmit={handleSubmit} className="px-4 space-y-3">
          <div className="space-y-2">
            <Label>{t('teams.teamNameLabel')}</Label>
            <Input placeholder={t('teams.teamNamePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('common.priority')}</Label>
            <Input type="number" placeholder="1" value={priority} onChange={(e) => setPriority(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('common.notes')}</Label>
            <Input placeholder={t('teams.notesPlaceholder')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </form>
        <DrawerFooter>
          <Button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {initialData ? t('common.save') : t('teams.createBtn')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
          {onDelete && (
            <Button variant="ghost" onClick={onDelete} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4 mr-2" />{t('teams.deleteTeam')}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
