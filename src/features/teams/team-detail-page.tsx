import { useState, useEffect, type ReactNode } from 'react'
import { useParams, useRouter, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Edit, Plus, Users, User, UserCheck, Loader2, UsersRound, ChevronRight, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useTeam, useUpdateTeam, useDeleteTeam, useAddMemberToTeam, useRemoveMemberFromTeam, useAssignTrainerToTeam, useRemoveTrainerFromTeam } from './use-teams'
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

export function TeamDetailPage() {
  const { orgId, teamId } = useParams({ strict: false }) as { orgId: string; teamId: string }
  const router = useRouter()
  const navigate = useNavigate()
  const { isAdminOrManager } = useAuthStore()
  const { t } = useTranslation()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<{ memberId: string; displayName: string; photoUrl?: string } | null>(null)
  const [selectedTrainer, setSelectedTrainer] = useState<{ trainerMemberId: string; displayName: string; color?: string } | null>(null)

  const { data: team, isLoading, isError, refetch } = useTeam(orgId, teamId)
  const updateMutation = useUpdateTeam(orgId, teamId)
  const deleteMutation = useDeleteTeam(orgId)
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

  const handleAddMember = async (memberId: string) => {
    try {
      await addMemberMutation.mutateAsync({ organizationMemberId: memberId })
      setAddDrawerOpen(false)
      toast.success(t('teams.memberAdded'))
    } catch {
      toast.error(t('teams.memberAddFailed'))
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMemberMutation.mutateAsync(memberId)
      toast.success(t('teams.memberRemoved'))
    } catch {
      toast.error(t('teams.memberRemoveFailed'))
    }
  }

  const handleAssignTrainer = async (trainerMemberId: string) => {
    try {
      await assignTrainerMutation.mutateAsync({ trainerMemberId })
      setAddDrawerOpen(false)
      toast.success(t('teams.trainerAssigned'))
    } catch {
      toast.error(t('teams.trainerAssignFailed'))
    }
  }

  const handleRemoveTrainer = async (trainerMemberId: string) => {
    try {
      await removeTrainerMutation.mutateAsync(trainerMemberId)
      toast.success(t('teams.trainerRemoved'))
    } catch {
      toast.error(t('teams.trainerRemoveFailed'))
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(teamId)
      toast.success(t('teams.deleted'))
      navigate({ to: `/app/org/${orgId}/teams`, replace: true })
    } catch {
      toast.error(t('teams.deleteFailed'))
    }
  }

  if (isLoading) return <DetailSkeleton />
  if (isError) return <ErrorState onRetry={refetch} />

  const currentMemberIds = new Set(team?.members.map(m => m.memberId) ?? [])
  const currentTrainerIds = new Set(team?.trainers.map(tr => tr.trainerMemberId) ?? [])
  const availableMembers = allMembers?.filter(m => !currentMemberIds.has(m.id)) ?? []
  const availableTrainers = allTrainers?.filter(tr => !currentTrainerIds.has(tr.id)) ?? []

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

        {isAdminOrManager() && (
          <Button variant="outline" size="sm" className="mb-3 gap-1.5 w-full" onClick={() => setAddDrawerOpen(true)}>
            <Plus className="h-4 w-4" />{t('teams.addButton')}
          </Button>
        )}

        <Tabs defaultValue="members">
          <TabsList className="w-full">
            <TabsTrigger value="members" className="flex-1 min-w-0 gap-1.5">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('teams.membersTab', { count: team?.members.length ?? 0 })}</span>
            </TabsTrigger>
            <TabsTrigger value="trainers" className="flex-1 min-w-0 gap-1.5">
              <UserCheck className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('teams.trainersTab', { count: team?.trainers.length ?? 0 })}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            {team?.members.length === 0 ? (
              <EmptyState icon={<Users className="h-6 w-6" />} title={t('teams.noMembers')} className="py-8" />
            ) : (
              <div className="mt-2 space-y-1">
                {team?.members.map((m) => (
                  <button key={m.memberId} onClick={() => setSelectedMember(m)}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent text-left">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={m.photoUrl} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">{getInitials(m.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium truncate">{m.displayName}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trainers">
            {team?.trainers.length === 0 ? (
              <EmptyState icon={<UserCheck className="h-6 w-6" />} title={t('teams.noTrainers')} className="py-8" />
            ) : (
              <div className="mt-2 space-y-1">
                {team?.trainers.map((tr) => (
                  <button key={tr.trainerMemberId} onClick={() => setSelectedTrainer(tr)}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent text-left">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback
                        style={tr.color ? { backgroundColor: tr.color } : undefined}
                        className={!tr.color ? 'bg-emerald-600/20 text-emerald-600 text-xs' : 'text-white text-xs'}
                      >{getInitials(tr.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium truncate">{tr.displayName}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {isAdminOrManager() && team && (
        <TeamFormDrawer open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleUpdate}
          isLoading={updateMutation.isPending} title={t('teams.editTitle')}
          initialData={{ name: team.name ?? '', priority: team.priority ?? undefined, notes: team.notes ?? '' }}
          onDelete={() => { setEditOpen(false); setDeleteOpen(true) }} />
      )}

      {isAdminOrManager() && (
        <AddToTeamDrawer open={addDrawerOpen} onClose={() => setAddDrawerOpen(false)}
          onAddMember={handleAddMember} onAddTrainer={handleAssignTrainer}
          isAddingMember={addMemberMutation.isPending} isAddingTrainer={assignTrainerMutation.isPending}
          availableMembers={availableMembers} availableTrainers={availableTrainers} />
      )}

      <MemberContextDrawer member={selectedMember} onClose={() => setSelectedMember(null)} orgId={orgId}
        canManage={isAdminOrManager()} onRemove={(id) => { handleRemoveMember(id); setSelectedMember(null) }}
        isRemoving={removeMemberMutation.isPending} />

      <TrainerContextDrawer trainer={selectedTrainer} onClose={() => setSelectedTrainer(null)} orgId={orgId}
        canManage={isAdminOrManager()} onRemove={(id) => { handleRemoveTrainer(id); setSelectedTrainer(null) }}
        isRemoving={removeTrainerMutation.isPending} />

      <DeleteConfirmDrawer
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title={t('teams.deleteConfirmTitle')}
        description={t('teams.deleteConfirmDesc', { name: team?.name ?? '' })}
        icon={<UsersRound className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
        itemName={team?.name ?? `${t('teams.title')} ${team?.priority ?? ''}`}
        deleteLabel={t('teams.deleteBtn')}
      />
    </div>
  )
}

/**
 * Jeden drawer z dwoma krokami: wybór (uczestnik/trener) -> lista z wyszukiwaniem.
 * Kliknięcie osoby na liście od razu dodaje ją do zespołu.
 */
function AddToTeamDrawer({ open, onClose, onAddMember, onAddTrainer, isAddingMember, isAddingTrainer, availableMembers, availableTrainers }: {
  open: boolean; onClose: () => void
  onAddMember: (memberId: string) => void; onAddTrainer: (trainerMemberId: string) => void
  isAddingMember: boolean; isAddingTrainer: boolean
  availableMembers: { id: string; displayName: string }[]
  availableTrainers: { id: string; displayName: string }[]
}) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'choice' | 'member' | 'trainer'>('choice')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (open) {
      setStep('choice')
      setSearch('')
    }
  }, [open])

  const handleClose = () => {
    onClose()
    setStep('choice')
    setSearch('')
  }

  const handleBack = () => {
    setStep('choice')
    setSearch('')
  }

  const filteredMembers = search
    ? availableMembers.filter(m => m.displayName.toLowerCase().includes(search.toLowerCase()))
    : availableMembers
  const filteredTrainers = search
    ? availableTrainers.filter(tr => tr.displayName.toLowerCase().includes(search.toLowerCase()))
    : availableTrainers

  return (
    <Drawer open={open} onOpenChange={(v) => !v && handleClose()}>
      <DrawerContent>
        <DrawerHeader className="flex items-center gap-2 text-left">
          {step !== 'choice' && (
            <button onClick={handleBack} className="p-1 -ml-1 rounded-lg hover:bg-accent flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <DrawerTitle>
            {step === 'choice' ? t('teams.addChoiceTitle')
              : step === 'member' ? t('teams.addMemberTitle')
              : t('teams.assignTrainerTitle')}
          </DrawerTitle>
        </DrawerHeader>

        {step === 'choice' && (
          <div className="px-4 pb-2 space-y-2">
            <button onClick={() => setStep('member')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent text-left">
              <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{t('teams.addMember')}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
            <button onClick={() => setStep('trainer')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent text-left">
              <UserCheck className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{t('teams.assignTrainer')}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </div>
        )}

        {step === 'member' && (
          <div className="px-4 pb-2 space-y-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('teams.searchMember')}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              autoFocus
            />
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {filteredMembers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t('common.noResults')}</p>
              )}
              {filteredMembers.map((m) => (
                <button key={m.id} onClick={() => onAddMember(m.id)} disabled={isAddingMember}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent text-left disabled:opacity-50">
                  <span className="text-sm font-medium flex-1">{m.displayName}</span>
                  {isAddingMember && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'trainer' && (
          <div className="px-4 pb-2 space-y-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('teams.searchTrainer')}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              autoFocus
            />
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {filteredTrainers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t('common.noResults')}</p>
              )}
              {filteredTrainers.map((tr) => (
                <button key={tr.id} onClick={() => onAddTrainer(tr.id)} disabled={isAddingTrainer}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent text-left disabled:opacity-50">
                  <span className="text-sm font-medium flex-1">{tr.displayName}</span>
                  {isAddingTrainer && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <DrawerFooter>
          <Button variant="outline" onClick={handleClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function DeleteConfirmDrawer({
  open, onClose, onConfirm, isLoading, title, description, icon, itemName, deleteLabel,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean
  title: string; description: string; icon: ReactNode; itemName: string; deleteLabel: string
}) {
  const { t } = useTranslation()
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{title}</DrawerTitle></DrawerHeader>
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-3">
            {icon}
            <span className="text-sm font-medium">{itemName}</span>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <DrawerFooter>
          <Button variant="destructive" className="w-full" disabled={isLoading} onClick={onConfirm}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {deleteLabel}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function MemberContextDrawer({ member, onClose, orgId, canManage, onRemove, isRemoving }: {
  member: { memberId: string; displayName: string; photoUrl?: string } | null
  onClose: () => void; orgId: string; canManage: boolean; onRemove: (id: string) => void; isRemoving: boolean
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <Drawer open={!!member} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{member?.displayName}</DrawerTitle></DrawerHeader>
        <div className="px-4 pb-2 space-y-2">
          <button onClick={() => { onClose(); navigate({ to: `/app/org/${orgId}/members/${member!.memberId}` }) }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent text-left">
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium flex-1">{t('teams.moreAboutMember')}</span>
          </button>
          {canManage && (
            <button onClick={() => onRemove(member!.memberId)} disabled={isRemoving}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-destructive/40 bg-card hover:bg-destructive/10 text-destructive text-left">
              {isRemoving ? <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" /> : <Trash2 className="h-4 w-4 flex-shrink-0" />}
              <span className="text-sm font-medium flex-1">{t('teams.removeFromTeam')}</span>
            </button>
          )}
        </div>
        <DrawerFooter>
          <Button variant="ghost" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function TrainerContextDrawer({ trainer, onClose, orgId, canManage, onRemove, isRemoving }: {
  trainer: { trainerMemberId: string; displayName: string; color?: string } | null
  onClose: () => void; orgId: string; canManage: boolean; onRemove: (id: string) => void; isRemoving: boolean
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <Drawer open={!!trainer} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{trainer?.displayName}</DrawerTitle></DrawerHeader>
        <div className="px-4 pb-2 space-y-2">
          <button onClick={() => { onClose(); navigate({ to: `/app/org/${orgId}/members/${trainer!.trainerMemberId}` }) }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent text-left">
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium flex-1">{t('teams.moreAboutTrainer')}</span>
          </button>
          {canManage && (
            <button onClick={() => onRemove(trainer!.trainerMemberId)} disabled={isRemoving}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-destructive/40 bg-card hover:bg-destructive/10 text-destructive text-left">
              {isRemoving ? <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" /> : <Trash2 className="h-4 w-4 flex-shrink-0" />}
              <span className="text-sm font-medium flex-1">{t('teams.removeFromTeam')}</span>
            </button>
          )}
        </div>
        <DrawerFooter>
          <Button variant="ghost" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
