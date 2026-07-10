import { useState } from 'react'
import { useParams, useNavigate, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Edit, Plus, Users, UsersRound, Loader2, ChevronRight, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useGroup, useUpdateGroup, useAddMemberToGroup, useRemoveMemberFromGroup, useAddTeamToGroup, useRemoveTeamFromGroup } from './use-groups'
import { useAllMembers } from '@/features/members/use-members'
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
import { Label } from '@/shared/components/ui/label'
import { DrawerSearchSelect } from '@/shared/components/ui/drawer-select'

export function GroupDetailPage() {
  const { orgId, groupId } = useParams({ strict: false }) as { orgId: string; groupId: string }
  const router = useRouter()
  const { isAdminOrManager } = useAuthStore()
  const { t } = useTranslation()
  const [editOpen, setEditOpen] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [addTeamOpen, setAddTeamOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<{ memberId: string; displayName: string; photoUrl?: string } | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<{ teamId: string; teamName?: string } | null>(null)

  const { data: group, isLoading, isError, refetch } = useGroup(orgId, groupId)
  const updateMutation = useUpdateGroup(orgId, groupId)
  const addMemberMutation = useAddMemberToGroup(orgId, groupId)
  const removeMemberMutation = useRemoveMemberFromGroup(orgId, groupId)
  const addTeamMutation = useAddTeamToGroup(orgId, groupId)
  const removeTeamMutation = useRemoveTeamFromGroup(orgId, groupId)
  const { data: allMembers } = useAllMembers(orgId)
  const { data: allTeams } = useAllTeams(orgId)

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
      setAddMemberOpen(false)
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
      setAddTeamOpen(false)
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

  if (isLoading) return <DetailSkeleton />
  if (isError) return <ErrorState onRetry={refetch} />

  const currentMemberIds = new Set(group?.members.map(m => m.memberId) ?? [])
  const availableMembers = allMembers?.filter(m => !currentMemberIds.has(m.id)) ?? []
  const currentTeamIds = new Set(group?.teams.map(tm => tm.teamId) ?? [])
  const availableTeams = allTeams?.filter(tm => !currentTeamIds.has(tm.id)).map(tm => ({ id: tm.id, name: tm.name ?? '' })) ?? []

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
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: group?.color ?? '#6d28d9' }}>
            {group?.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold">{group?.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {group?.description && <span className="text-xs text-muted-foreground">{group.description}</span>}
              {!group?.isActive && <Badge variant="secondary" className="text-xs">{t('groups.inactiveBadge')}</Badge>}
            </div>
          </div>
        </div>

        <Tabs defaultValue="members">
          <TabsList className="w-full">
            <TabsTrigger value="members" className="flex-1 gap-1.5">
              <Users className="h-4 w-4" />
              {t('groups.membersTab', { count: group?.members.length ?? 0 })}
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex-1 gap-1.5">
              <UsersRound className="h-4 w-4" />
              {t('groups.teamsTab', { count: group?.teams.length ?? 0 })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            {isAdminOrManager() && (
              <Button variant="outline" size="sm" className="mt-3 gap-1.5 w-full" onClick={() => setAddMemberOpen(true)}>
                <Plus className="h-4 w-4" />{t('groups.addMember')}
              </Button>
            )}
            {group?.members.length === 0 ? (
              <EmptyState icon={<Users className="h-6 w-6" />} title={t('groups.noMembers')} className="py-8" />
            ) : (
              <div className="mt-2 space-y-1">
                {group?.members.map((m) => (
                  <button key={m.memberId} onClick={() => setSelectedMember(m)}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent text-left">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={m.photoUrl} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">{getInitials(m.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium">{m.displayName}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="teams">
            {isAdminOrManager() && (
              <Button variant="outline" size="sm" className="mt-3 gap-1.5 w-full" onClick={() => setAddTeamOpen(true)}>
                <Plus className="h-4 w-4" />{t('groups.addTeam')}
              </Button>
            )}
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
        </Tabs>
      </div>

      {isAdminOrManager() && group && (
        <GroupFormDrawer open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleUpdate}
          isLoading={updateMutation.isPending} title={t('groups.editTitle')}
          initialData={{ name: group.name, description: group.description, color: group.color }} />
      )}

      {isAdminOrManager() && (
        <AddMemberDrawer open={addMemberOpen} onClose={() => setAddMemberOpen(false)}
          onAdd={handleAddMember} isLoading={addMemberMutation.isPending} availableMembers={availableMembers} />
      )}

      {isAdminOrManager() && (
        <AddTeamDrawer open={addTeamOpen} onClose={() => setAddTeamOpen(false)}
          onAdd={handleAddTeam} isLoading={addTeamMutation.isPending} availableTeams={availableTeams} />
      )}

      <MemberContextDrawer member={selectedMember} onClose={() => setSelectedMember(null)} orgId={orgId}
        canManage={isAdminOrManager()} onRemove={(id) => { handleRemoveMember(id); setSelectedMember(null) }}
        isRemoving={removeMemberMutation.isPending} />

      <TeamContextDrawer team={selectedTeam} onClose={() => setSelectedTeam(null)} orgId={orgId}
        canManage={isAdminOrManager()} onRemove={(id) => { handleRemoveTeam(id); setSelectedTeam(null) }}
        isRemoving={removeTeamMutation.isPending} />
    </div>
  )
}

function AddMemberDrawer({ open, onClose, onAdd, isLoading, availableMembers }: {
  open: boolean; onClose: () => void; onAdd: (memberId: string) => void; isLoading: boolean
  availableMembers: { id: string; displayName: string }[]
}) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState('')
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{t('groups.addMemberTitle')}</DrawerTitle></DrawerHeader>
        <div className="px-4 space-y-3">
          <div className="space-y-2">
            <Label>{t('groups.selectMember')}</Label>
            <DrawerSearchSelect value={selectedId} onChange={setSelectedId} title={t('groups.selectMember')}
              placeholder={t('groups.selectMemberPlaceholder')} searchPlaceholder={t('groups.searchMember')}
              options={availableMembers.map(m => ({ value: m.id, label: m.displayName }))} />
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={() => onAdd(selectedId)} disabled={!selectedId || isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('groups.addToGroup')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function AddTeamDrawer({ open, onClose, onAdd, isLoading, availableTeams }: {
  open: boolean; onClose: () => void; onAdd: (teamId: string) => void; isLoading: boolean
  availableTeams: { id: string; name: string }[]
}) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState('')
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{t('groups.addTeamTitle')}</DrawerTitle></DrawerHeader>
        <div className="px-4 space-y-3">
          <div className="space-y-2">
            <Label>{t('groups.selectTeam')}</Label>
            <DrawerSearchSelect value={selectedId} onChange={setSelectedId} title={t('groups.selectTeam')}
              placeholder={t('groups.selectTeamPlaceholder')} searchPlaceholder={t('groups.searchTeam')}
              options={availableTeams.map(tm => ({ value: tm.id, label: tm.name }))} />
          </div>
        </div>
        <DrawerFooter>
          <Button onClick={() => onAdd(selectedId)} disabled={!selectedId || isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('groups.addToGroup')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
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
            <span className="text-sm font-medium flex-1">{t('groups.moreAboutMember')}</span>
          </button>
          {canManage && (
            <button onClick={() => onRemove(member!.memberId)} disabled={isRemoving}
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
          <button onClick={() => { onClose(); navigate({ to: `/app/org/${orgId}/teams/${team!.teamId}` }) }}
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
