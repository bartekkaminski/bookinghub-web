import { useState } from 'react'
import { useParams, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Edit, Plus, X, Users, UserCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useTeam, useUpdateTeam, useAddMemberToTeam, useRemoveMemberFromTeam, useAssignTrainerToTeam, useRemoveTrainerFromTeam } from './use-teams'
import { useAllMembers, useTrainers } from '@/features/members/use-members'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { DetailSkeleton } from '@/shared/components/loading-skeletons'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { EmptyState } from '@/shared/components/empty-state'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { TeamFormDrawer } from './teams-list-page'
import { getInitials } from '@/shared/utils/format'
import type { UpdateTeamRequest } from '@/api/types'
import { DrawerSearchSelect } from '@/shared/components/ui/drawer-select'

export function TeamDetailPage() {
  const { orgId, teamId } = useParams({ strict: false }) as { orgId: string; teamId: string }
  const router = useRouter()
  const { isAdminOrManager } = useAuthStore()
  const { t } = useTranslation()
  const [editOpen, setEditOpen] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [addTrainerOpen, setAddTrainerOpen] = useState(false)

  const { data: team, isLoading, isError, refetch } = useTeam(orgId, teamId)
  const updateMutation = useUpdateTeam(orgId, teamId)
  const addMemberMutation = useAddMemberToTeam(orgId, teamId)
  const removeMemberMutation = useRemoveMemberFromTeam(orgId, teamId)
  const assignTrainerMutation = useAssignTrainerToTeam(orgId, teamId)
  const removeTrainerMutation = useRemoveTrainerFromTeam(orgId, teamId)
  const { data: allMembers } = useAllMembers(orgId)
  const { data: allTrainers } = useTrainers(orgId)

  const handleUpdate = async (data: { name?: string; priority?: number; notes?: string }) => {
    try {
      await updateMutation.mutateAsync({ ...data, isActive: team?.isActive ?? true } as UpdateTeamRequest)
      setEditOpen(false)
      toast.success(t('teams.updated'))
    } catch {
      toast.error(t('teams.updateFailed'))
    }
  }

  const currentMemberIds = new Set(team?.members.map(m => m.memberId) ?? [])
  const currentTrainerIds = new Set(team?.trainers.map(tr => tr.trainerMemberId) ?? [])
  const availableMembers = allMembers?.filter(m => !currentMemberIds.has(m.id)) ?? []
  const availableTrainers = allTrainers?.filter(tr => !currentTrainerIds.has(tr.id)) ?? []

  if (isLoading) return <DetailSkeleton />
  if (isError) return <ErrorState onRetry={refetch} />

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={team?.name ?? `${t('teams.title')} ${team?.priority ?? ''}`}
          back={<Button variant="outline" size="sm" onClick={() => router.history.back()}><ArrowLeft className="h-4 w-4" /></Button>}
          action={isAdminOrManager() ? (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
              <Edit className="h-4 w-4" />{t('common.edit')}
            </Button>
          ) : undefined}
        />
      </div>

      <div className="p-4">
        {team?.notes && <p className="text-sm text-muted-foreground mb-4">{team.notes}</p>}

        <Tabs defaultValue="members">
          <TabsList className="w-full">
            <TabsTrigger value="members" className="flex-1 gap-1.5">
              <Users className="h-4 w-4" />
              {t('teams.membersTab', { count: team?.members.length ?? 0 })}
            </TabsTrigger>
            <TabsTrigger value="trainers" className="flex-1 gap-1.5">
              <UserCheck className="h-4 w-4" />
              {t('teams.trainersTab', { count: team?.trainers.length ?? 0 })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            {isAdminOrManager() && (
              <Button variant="outline" size="sm" className="mt-3 gap-1.5 w-full" onClick={() => setAddMemberOpen(true)}>
                <Plus className="h-4 w-4" />{t('teams.addMember')}
              </Button>
            )}
            {team?.members.length === 0 ? (
              <EmptyState icon={<Users className="h-6 w-6" />} title={t('teams.noMembers')} className="py-8" />
            ) : (
              <div className="mt-2 space-y-1">
                {team?.members.map((m) => (
                  <div key={m.memberId} className="flex items-center gap-3 px-2 py-2.5 rounded-lg">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={m.photoUrl} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">{getInitials(m.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium">{m.displayName}</span>
                    {isAdminOrManager() && (
                      <button onClick={() => removeMemberMutation.mutate(m.memberId)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trainers">
            {isAdminOrManager() && (
              <Button variant="outline" size="sm" className="mt-3 gap-1.5 w-full" onClick={() => setAddTrainerOpen(true)}>
                <Plus className="h-4 w-4" />{t('teams.assignTrainer')}
              </Button>
            )}
            {team?.trainers.length === 0 ? (
              <EmptyState icon={<UserCheck className="h-6 w-6" />} title={t('teams.noTrainers')} className="py-8" />
            ) : (
              <div className="mt-2 space-y-1">
                {team?.trainers.map((tr) => (
                  <div key={tr.trainerMemberId} className="flex items-center gap-3 px-2 py-2.5 rounded-lg">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback
                        style={tr.color ? { backgroundColor: tr.color } : undefined}
                        className={!tr.color ? 'bg-emerald-600/20 text-emerald-600 text-xs' : 'text-white text-xs'}
                      >{getInitials(tr.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium">{tr.displayName}</span>
                    {isAdminOrManager() && (
                      <button onClick={() => removeTrainerMutation.mutate(tr.trainerMemberId)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {isAdminOrManager() && team && (
        <TeamFormDrawer open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleUpdate}
          isLoading={updateMutation.isPending} title={t('teams.editTitle')}
          initialData={{ name: team.name ?? '', priority: team.priority ?? undefined, notes: team.notes ?? '' }} />
      )}

      <SelectMemberDrawer open={addMemberOpen} onClose={() => setAddMemberOpen(false)}
        onAdd={(id) => { addMemberMutation.mutate({ organizationMemberId: id }); setAddMemberOpen(false); toast.success(t('teams.memberAdded')) }}
        isLoading={addMemberMutation.isPending} items={availableMembers} title={t('teams.addMemberTitle')} />

      <SelectMemberDrawer open={addTrainerOpen} onClose={() => setAddTrainerOpen(false)}
        onAdd={(id) => { assignTrainerMutation.mutate({ trainerMemberId: id }); setAddTrainerOpen(false); toast.success(t('teams.trainerAssigned')) }}
        isLoading={assignTrainerMutation.isPending} items={availableTrainers} title={t('teams.assignTrainerTitle')} />
    </div>
  )
}

function SelectMemberDrawer({ open, onClose, onAdd, isLoading, items, title }: {
  open: boolean; onClose: () => void; onAdd: (id: string) => void; isLoading: boolean
  items: { id: string; displayName: string }[]; title: string
}) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState('')
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{title}</DrawerTitle></DrawerHeader>
        <div className="px-4">
          <DrawerSearchSelect value={selectedId} onChange={setSelectedId} title={title}
            placeholder={t('teams.selectPerson')} searchPlaceholder={t('common.search')}
            options={items.map(m => ({ value: m.id, label: m.displayName }))} />
        </div>
        <DrawerFooter>
          <Button onClick={() => onAdd(selectedId)} disabled={!selectedId || isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('common.add')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
