import { useState, useEffect, type ReactNode } from 'react'
import { useParams, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Edit, Plus, Users, User, UsersRound, UserCheck, Loader2, ChevronRight, Trash2, ExternalLink, Grid3X3 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useGroup, useUpdateGroup, useDeleteGroup, useAddMemberToGroup, useRemoveMemberFromGroup, useAddTeamToGroup, useRemoveTeamFromGroup, useAssignTrainerToGroup, useRemoveTrainerFromGroup } from './use-groups'
import { useAllMembers, useTrainers } from '@/features/members/use-members'
import { useAllTeams } from '@/features/teams/use-teams'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { DetailSkeleton } from '@/shared/components/loading-skeletons'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { EmptyState } from '@/shared/components/empty-state'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { GroupFormDrawer } from './groups-list-page'
import { getInitials } from '@/shared/utils/format'
import type { UpdateGroupRequest } from '@/api/types'

export function GroupDetailPage() {
  const { orgId, groupId } = useParams({ strict: false }) as { orgId: string; groupId: string }
  const router = useRouter()
  const navigate = useNavigate()
  const { isAdminOrManager } = useAuthStore()
  const { t } = useTranslation()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<{ memberId: string; displayName: string; photoUrl?: string; isDirectParticipant: boolean; teamNames: string[] } | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<{ teamId: string; teamName?: string } | null>(null)
  const [selectedTrainer, setSelectedTrainer] = useState<{ trainerMemberId: string; displayName: string; color?: string } | null>(null)

  const { data: group, isLoading, isError, refetch } = useGroup(orgId, groupId)
  const updateMutation = useUpdateGroup(orgId, groupId)
  const deleteMutation = useDeleteGroup(orgId)
  const addMemberMutation = useAddMemberToGroup(orgId, groupId)
  const removeMemberMutation = useRemoveMemberFromGroup(orgId, groupId)
  const addTeamMutation = useAddTeamToGroup(orgId, groupId)
  const removeTeamMutation = useRemoveTeamFromGroup(orgId, groupId)
  const assignTrainerMutation = useAssignTrainerToGroup(orgId, groupId)
  const removeTrainerMutation = useRemoveTrainerFromGroup(orgId, groupId)
  const { data: allMembers } = useAllMembers(orgId)
  const { data: allTeams } = useAllTeams(orgId)
  const { data: allTrainers } = useTrainers(orgId)

  const handleUpdate = async (data: { name: string; description?: string; color?: string }) => {
    try {
      await updateMutation.mutateAsync({ name: data.name, description: data.description, color: data.color, isActive: group?.isActive ?? true } as UpdateGroupRequest)
      setEditOpen(false)
      toast.success(t('groups.updated'))
    } catch {
      toast.error(t('groups.updateFailed'))
    }
  }

  const handleAddMember = async (memberId: string) => {
    try {
      await addMemberMutation.mutateAsync({ organizationMemberId: memberId })
      setAddDrawerOpen(false)
      toast.success(t('groups.memberAdded'))
    } catch {
      toast.error(t('groups.memberAddFailed'))
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMemberMutation.mutateAsync(memberId)
      toast.success(t('groups.memberRemoved'))
    } catch {
      toast.error(t('groups.memberRemoveFailed'))
    }
  }

  const handleAddTeam = async (teamId: string) => {
    try {
      await addTeamMutation.mutateAsync({ teamId })
      setAddDrawerOpen(false)
      toast.success(t('groups.teamAdded'))
    } catch {
      toast.error(t('groups.teamAddFailed'))
    }
  }

  const handleRemoveTeam = async (teamId: string) => {
    try {
      await removeTeamMutation.mutateAsync(teamId)
      toast.success(t('groups.teamRemoved'))
    } catch {
      toast.error(t('groups.teamRemoveFailed'))
    }
  }

  const handleAssignTrainer = async (trainerMemberId: string) => {
    try {
      await assignTrainerMutation.mutateAsync({ trainerMemberId })
      setAddDrawerOpen(false)
      toast.success(t('groups.trainerAssigned'))
    } catch {
      toast.error(t('groups.trainerAssignFailed'))
    }
  }

  const handleRemoveTrainer = async (trainerMemberId: string) => {
    try {
      await removeTrainerMutation.mutateAsync(trainerMemberId)
      toast.success(t('groups.trainerRemoved'))
    } catch {
      toast.error(t('groups.trainerRemoveFailed'))
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(groupId)
      toast.success(t('groups.deleted'))
      navigate({ to: `/org/${orgId}/groups`, replace: true })
    } catch {
      toast.error(t('groups.deleteFailed'))
    }
  }

  if (isLoading) return <DetailSkeleton />
  if (isError) return <ErrorState onRetry={refetch} />

  const currentMemberIds = new Set(group?.members.map(m => m.memberId) ?? [])
  const availableMembers = allMembers?.filter(m => !currentMemberIds.has(m.id)) ?? []
  const currentTeamIds = new Set(group?.teams.map(tm => tm.teamId) ?? [])
  const availableTeams = allTeams?.filter(tm => !currentTeamIds.has(tm.id)).map(tm => ({ id: tm.id, name: tm.name ?? '' })) ?? []
  const currentTrainerIds = new Set(group?.trainers.map(tr => tr.trainerMemberId) ?? [])
  const availableTrainers = allTrainers?.filter(tr => !currentTrainerIds.has(tr.id)) ?? []

  const effectiveMembers = group?.effectiveMembers ?? []

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={group?.name ?? t('groups.title')}
          back={<Button variant="outline" size="sm" onClick={() => router.history.back()}><ArrowLeft className="h-4 w-4" /></Button>}
          action={isAdminOrManager() ? (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
              <Edit className="h-4 w-4" />{t('common.edit')}
            </Button>
          ) : undefined}
        />
      </div>

      <div className="p-4">
        {(group?.description || !group?.isActive) && (
          <div className="flex items-center gap-2 mb-4">
            {group?.description && <span className="text-xs text-muted-foreground">{group.description}</span>}
            {!group?.isActive && <Badge variant="secondary" className="text-xs">{t('groups.inactiveBadge')}</Badge>}
          </div>
        )}

        {isAdminOrManager() && (
          <Button variant="outline" size="sm" className="mb-3 gap-1.5 w-full" onClick={() => setAddDrawerOpen(true)}>
            <Plus className="h-4 w-4" />{t('groups.addButton')}
          </Button>
        )}

        <Tabs defaultValue="all">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 min-w-0 gap-1.5">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('groups.allTab', { count: effectiveMembers.length })}</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex-1 min-w-0 gap-1.5">
              <UsersRound className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('groups.teamsTab', { count: group?.teams.length ?? 0 })}</span>
            </TabsTrigger>
            <TabsTrigger value="trainers" className="flex-1 min-w-0 gap-1.5">
              <UserCheck className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t('groups.trainersTab', { count: group?.trainers.length ?? 0 })}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {effectiveMembers.length === 0 ? (
              <EmptyState icon={<Users className="h-6 w-6" />} title={t('groups.noMembers')} className="py-8" />
            ) : (
              <div className="mt-2 space-y-1">
                {effectiveMembers.map((m) => (
                  <button key={m.memberId} onClick={() => setSelectedMember(m)}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent text-left">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={m.photoUrl} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">{getInitials(m.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.displayName}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.isDirectParticipant && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 leading-4">{t('groups.directBadge')}</Badge>
                        )}
                        {m.teamNames.map((teamName) => (
                          <Badge key={teamName} variant="secondary" className="text-[10px] px-1.5 py-0 leading-4">
                            {t('groups.viaTeamBadge', { name: teamName })}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="teams">
            {group?.teams.length === 0 ? (
              <EmptyState icon={<UsersRound className="h-6 w-6" />} title={t('groups.noTeams')} className="py-8" />
            ) : (
              <div className="mt-2 space-y-1">
                {group?.teams.map((tm) => (
                  <button key={tm.teamId} onClick={() => setSelectedTeam(tm)}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent text-left">
                    <UsersRound className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-sm font-medium">{tm.teamName ?? t('members.teamWithoutName')}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trainers">
            {group?.trainers.length === 0 ? (
              <EmptyState icon={<UserCheck className="h-6 w-6" />} title={t('groups.noTrainers')} className="py-8" />
            ) : (
              <div className="mt-2 space-y-1">
                {group?.trainers.map((tr) => (
                  <button key={tr.trainerMemberId} onClick={() => setSelectedTrainer(tr)}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent text-left">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback
                        style={tr.color ? { backgroundColor: tr.color } : undefined}
                        className={!tr.color ? 'bg-emerald-600/20 text-emerald-600 text-xs' : 'text-white text-xs'}
                      >{getInitials(tr.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium">{tr.displayName}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {isAdminOrManager() && group && (
        <GroupFormDrawer open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleUpdate}
          isLoading={updateMutation.isPending} title={t('groups.editTitle')}
          initialData={{ name: group.name, description: group.description, color: group.color }}
          onDelete={() => { setEditOpen(false); setDeleteOpen(true) }} />
      )}

      {isAdminOrManager() && (
        <AddToGroupDrawer open={addDrawerOpen} onClose={() => setAddDrawerOpen(false)}
          onAddMember={handleAddMember} onAddTeam={handleAddTeam} onAddTrainer={handleAssignTrainer}
          isAddingMember={addMemberMutation.isPending} isAddingTeam={addTeamMutation.isPending}
          isAddingTrainer={assignTrainerMutation.isPending}
          availableMembers={availableMembers} availableTeams={availableTeams} availableTrainers={availableTrainers} />
      )}

      <MemberContextDrawer member={selectedMember} onClose={() => setSelectedMember(null)} orgId={orgId}
        canManage={isAdminOrManager()} onRemove={(id) => { handleRemoveMember(id); setSelectedMember(null) }}
        isRemoving={removeMemberMutation.isPending} />

      <TeamContextDrawer team={selectedTeam} onClose={() => setSelectedTeam(null)} orgId={orgId}
        canManage={isAdminOrManager()} onRemove={(id) => { handleRemoveTeam(id); setSelectedTeam(null) }}
        isRemoving={removeTeamMutation.isPending} />

      <TrainerContextDrawer trainer={selectedTrainer} onClose={() => setSelectedTrainer(null)} orgId={orgId}
        canManage={isAdminOrManager()} onRemove={(id) => { handleRemoveTrainer(id); setSelectedTrainer(null) }}
        isRemoving={removeTrainerMutation.isPending} />

      <DeleteConfirmDrawer
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title={t('groups.deleteConfirmTitle')}
        description={t('groups.deleteConfirmDesc', { name: group?.name ?? '' })}
        icon={<Grid3X3 className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
        itemName={group?.name ?? ''}
        deleteLabel={t('groups.deleteBtn')}
      />
    </div>
  )
}

/**
 * Jeden drawer z dwoma krokami: wybór (uczestnik/zespół) -> lista z wyszukiwaniem.
 * Zmiana kroku odbywa się w tym samym otwartym Drawerze (bez zamykania i ponownego
 * otwierania), żeby przejście było płynne.
 */
/**
 * Jeden drawer z dwoma krokami: wybór (uczestnik/zespół) -> lista z wyszukiwaniem
 * wyświetlona bezpośrednio (bez zagnieżdżonego kolejnego drawera/selecta).
 * Kliknięcie osoby/zespołu na liście od razu dodaje ją do grupy.
 */
function AddToGroupDrawer({ open, onClose, onAddMember, onAddTeam, onAddTrainer, isAddingMember, isAddingTeam, isAddingTrainer, availableMembers, availableTeams, availableTrainers }: {
  open: boolean; onClose: () => void
  onAddMember: (memberId: string) => void; onAddTeam: (teamId: string) => void; onAddTrainer: (trainerMemberId: string) => void
  isAddingMember: boolean; isAddingTeam: boolean; isAddingTrainer: boolean
  availableMembers: { id: string; displayName: string }[]
  availableTeams: { id: string; name: string }[]
  availableTrainers: { id: string; displayName: string }[]
}) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'choice' | 'member' | 'team' | 'trainer'>('choice')
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
  const filteredTeams = search
    ? availableTeams.filter(tm => tm.name.toLowerCase().includes(search.toLowerCase()))
    : availableTeams
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
            {step === 'choice' ? t('groups.addChoiceTitle')
              : step === 'member' ? t('groups.addMemberTitle')
              : step === 'team' ? t('groups.addTeamTitle')
              : t('groups.addTrainerTitle')}
          </DrawerTitle>
        </DrawerHeader>

        {step === 'choice' && (
          <div className="px-4 pb-2 space-y-2">
            <button onClick={() => setStep('member')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent text-left">
              <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{t('groups.addMember')}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
            <button onClick={() => setStep('team')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent text-left">
              <UsersRound className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{t('groups.addTeam')}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
            <button onClick={() => setStep('trainer')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent text-left">
              <UserCheck className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{t('groups.addTrainer')}</span>
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
              placeholder={t('groups.searchMember')}
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

        {step === 'team' && (
          <div className="px-4 pb-2 space-y-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('groups.searchTeam')}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              autoFocus
            />
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {filteredTeams.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">{t('common.noResults')}</p>
              )}
              {filteredTeams.map((tm) => (
                <button key={tm.id} onClick={() => onAddTeam(tm.id)} disabled={isAddingTeam}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent text-left disabled:opacity-50">
                  <span className="text-sm font-medium flex-1">{tm.name}</span>
                  {isAddingTeam && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
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
              placeholder={t('groups.searchTrainer')}
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
  member: { memberId: string; displayName: string; photoUrl?: string; isDirectParticipant: boolean; teamNames: string[] } | null
  onClose: () => void; orgId: string; canManage: boolean; onRemove: (id: string) => void; isRemoving: boolean
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <Drawer open={!!member} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{member?.displayName}</DrawerTitle></DrawerHeader>
        <div className="px-4 pb-2 space-y-2">
          <button onClick={() => { onClose(); navigate({ to: `/org/${orgId}/members/${member!.memberId}` }) }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent text-left">
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium flex-1">{t('groups.moreAboutMember')}</span>
          </button>
          {canManage && member?.isDirectParticipant && (
            <button onClick={() => onRemove(member!.memberId)} disabled={isRemoving}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-destructive/40 bg-card hover:bg-destructive/10 text-destructive text-left">
              {isRemoving ? <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" /> : <Trash2 className="h-4 w-4 flex-shrink-0" />}
              <span className="text-sm font-medium flex-1">{t('groups.removeFromGroup')}</span>
            </button>
          )}
          {canManage && member && !member.isDirectParticipant && member.teamNames.length > 0 && (
            <p className="text-xs text-muted-foreground px-1 py-1">
              {t('groups.removeViaTeamNote', { teams: member.teamNames.join(', ') })}
            </p>
          )}
        </div>
        <DrawerFooter>
          <Button variant="ghost" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function TeamContextDrawer({ team, onClose, orgId, canManage, onRemove, isRemoving }: {
  team: { teamId: string; teamName?: string } | null
  onClose: () => void; orgId: string; canManage: boolean; onRemove: (id: string) => void; isRemoving: boolean
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  return (
    <Drawer open={!!team} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{team?.teamName ?? t('members.teamWithoutName')}</DrawerTitle></DrawerHeader>
        <div className="px-4 pb-2 space-y-2">
          <button onClick={() => { onClose(); navigate({ to: `/org/${orgId}/teams/${team!.teamId}` }) }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent text-left">
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium flex-1">{t('groups.moreAboutTeam')}</span>
          </button>
          {canManage && (
            <button onClick={() => onRemove(team!.teamId)} disabled={isRemoving}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-destructive/40 bg-card hover:bg-destructive/10 text-destructive text-left">
              {isRemoving ? <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" /> : <Trash2 className="h-4 w-4 flex-shrink-0" />}
              <span className="text-sm font-medium flex-1">{t('groups.removeFromGroup')}</span>
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
          <button onClick={() => { onClose(); navigate({ to: `/org/${orgId}/members/${trainer!.trainerMemberId}` }) }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent text-left">
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium flex-1">{t('groups.moreAboutTrainer')}</span>
          </button>
          {canManage && (
            <button onClick={() => onRemove(trainer!.trainerMemberId)} disabled={isRemoving}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-destructive/40 bg-card hover:bg-destructive/10 text-destructive text-left">
              {isRemoving ? <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" /> : <Trash2 className="h-4 w-4 flex-shrink-0" />}
              <span className="text-sm font-medium flex-1">{t('groups.removeFromGroup')}</span>
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
