import { useState, useEffect } from 'react'
import { useParams, useRouter, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit, UserCheck, Loader2, Shield, Grid3X3, UsersRound, ChevronRight, UserCog, Plus, Baby, Users2, User, Clock3, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useMember, useUpdateMember, useSetMemberActive, useAddMemberRole, useRemoveMemberRole, useAssignTrainer, useRemoveTrainerFromMember, useAllMembers, useAttachAccount, memberKeys } from './use-members'
import { useTrainers } from './use-members'
import { usePersonChildren, useAddChild, useRemoveChild, usePerson, useRemoveParentLink, useAddParentChildLink } from '@/features/profile/use-person'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { DetailSkeleton } from '@/shared/components/loading-skeletons'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { getRoleLabel } from '@/shared/utils/roles'
import { getInitials } from '@/shared/utils/format'
import { cn } from '@/shared/utils/cn'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { DatePickerInput } from '@/shared/components/ui/date-picker'
import type { UpdateMemberRequest } from '@/api/types'

export function MemberDetailPage() {
  const { orgId, memberId } = useParams({ strict: false }) as { orgId: string; memberId: string }
  const router = useRouter()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { t } = useTranslation()
  const { isAdmin, isAdminOrManager, user } = useAuthStore()
  const [editOpen, setEditOpen] = useState(false)
  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [trainerDrawerOpen, setTrainerDrawerOpen] = useState(false)
  const [childrenDrawerOpen, setChildrenDrawerOpen] = useState(false)
  const [parentDrawerOpen, setParentDrawerOpen] = useState(false)
  const [removeChildTarget, setRemoveChildTarget] = useState<{ id: string; name: string } | null>(null)
  const [removeParentTarget, setRemoveParentTarget] = useState<{ id: string; name: string } | null>(null)
  const [removeTrainerTarget, setRemoveTrainerTarget] = useState<{ id: string; name: string } | null>(null)
  const [attachAccountOpen, setAttachAccountOpen] = useState(false)
  const [attachEmail, setAttachEmail] = useState('')

  const { data: member, isLoading, isError, refetch } = useMember(orgId, memberId)
  const updateMutation = useUpdateMember(orgId, memberId)
  const setActiveMutation = useSetMemberActive(orgId, memberId)
  const addRoleMutation = useAddMemberRole(orgId, memberId)
  const removeRoleMutation = useRemoveMemberRole(orgId, memberId)
  const assignTrainerM = useAssignTrainer(orgId)
  const removeTrainerM = useRemoveTrainerFromMember(orgId)
  const attachAccountM = useAttachAccount(orgId, memberId, member?.personId ?? '')

  const { data: children } = usePersonChildren(member?.personId ?? '')
  const { data: personDetail } = usePerson(member?.personId ?? '')
  const addChildM = useAddChild(member?.personId ?? '')
  const removeChildM = useRemoveChild(member?.personId ?? '')
  const removeParentM = useRemoveParentLink()
  const addParentM = useAddParentChildLink()

  const isOwnProfile = user?.memberships.some(m => m.organizationId === orgId && member?.personId === user.personId)
  const canEdit = isAdminOrManager() || isOwnProfile
  const canManageRoles = isAdmin()
  const canToggleActive = isAdmin()
  const canManageTrainers = isAdminOrManager()

  const handleEdit = async (data: UpdateMemberRequest) => {
    try {
      await updateMutation.mutateAsync(data)
      setEditOpen(false)
      toast.success(t('members.profileUpdated'))
    } catch {
      toast.error(t('members.profileFailed'))
    }
  }

  const handleRolesChange = async (selectedRoles: string[]) => {
    const current = member?.roles ?? []
    const toAdd = selectedRoles.filter(r => !current.includes(r))
    const toRemove = current.filter(r => !selectedRoles.includes(r))
    if (selectedRoles.length === 0) { toast.error(t('members.cantRemoveAllRoles')); return }
    try {
      for (const r of toAdd) await addRoleMutation.mutateAsync({ role: r })
      for (const r of toRemove) await removeRoleMutation.mutateAsync(r)
      await qc.refetchQueries({ queryKey: memberKeys.detail(orgId, memberId) })
      setAddRoleOpen(false)
      toast.success(t('members.rolesUpdated'))
    } catch {
      toast.error(t('members.rolesFailed'))
    }
  }

  if (isLoading) return <DetailSkeleton />
  if (isError) return <ErrorState onRetry={refetch} />

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={t('members.detailTitle')}
          back={<Button variant="outline" size="sm" onClick={() => router.history.back()}><ArrowLeft className="h-4 w-4" /></Button>}
        />
      </div>

      <div className="p-4 space-y-4">
        <div className="flex flex-col items-center gap-3 py-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={member?.photoUrl} />
            <AvatarFallback
              style={member?.color ? { backgroundColor: member.color } : undefined}
              className={!member?.color ? 'bg-primary/20 text-primary text-2xl' : 'text-white text-2xl'}
            >
              {getInitials(member?.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-lg font-semibold">{member?.displayName}</h2>
            {(member?.firstName || member?.lastName) && (
              <p className="text-sm text-muted-foreground">{[member.firstName, member.lastName].filter(Boolean).join(' ')}</p>
            )}
            {isAdmin() && personDetail && (
              personDetail.email
                ? <p className="text-xs text-muted-foreground mt-0.5">{personDetail.email}</p>
                : <p className="text-xs text-muted-foreground/60 mt-0.5 italic">{t('members.noEmail')}</p>
            )}
          </div>
          {!member?.isActive && (
            <div className="flex gap-1.5 flex-wrap justify-center">
              <Badge variant="secondary">{t('members.inactiveBadge')}</Badge>
            </div>
          )}
          {canEdit && (
            <Button variant="outline" onClick={() => setEditOpen(true)} className="gap-2 mt-1 px-6">
              <Edit className="h-4 w-4" />
              {t('members.editProfile')}
            </Button>
          )}
        </div>

        {canManageRoles && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">{t('members.activeRoles')}</p>
            <button onClick={() => setAddRoleOpen(true)}
              className="w-full rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:bg-accent transition-colors text-left">
              <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{member?.roles.map(r => getRoleLabel(r)).join(', ')}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </div>
        )}

        {(member?.groups.length ?? 0) > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">{t('members.groupsSection')}</p>
            {member?.groups.map((g) => (
              <div key={g.groupId} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <Grid3X3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium">{g.groupName}</span>
              </div>
            ))}
          </div>
        )}

        {(member?.teams.length ?? 0) > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">{t('members.teamsSection')}</p>
            {member?.teams.map((tm) => (
              <div key={tm.teamId} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <UsersRound className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium">{tm.teamName ?? t('members.teamWithoutName')}</span>
              </div>
            ))}
          </div>
        )}

        {(canManageTrainers || (member?.assignedTrainers.length ?? 0) > 0) && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1 mb-1">{t('members.trainersSection')}</p>
            {canManageTrainers && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => setTrainerDrawerOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t('members.addTrainer')}
              </Button>
            )}
            {(member?.assignedTrainers.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground px-1 pt-1">{t('members.noTrainers')}</p>
            ) : (
              member?.assignedTrainers.map((tr) => (
                <button
                  key={tr.trainerMemberId}
                  onClick={() => canManageTrainers
                    ? setRemoveTrainerTarget({ id: tr.trainerMemberId, name: tr.displayName })
                    : undefined}
                  className={cn(
                    'w-full rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3 text-left',
                    canManageTrainers && 'hover:bg-accent transition-colors'
                  )}
                >
                  <UserCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium flex-1">{tr.displayName}</span>
                  {canManageTrainers && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        )}

        {canManageRoles && (
          <>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground px-1 mb-1">{t('members.childrenSection')}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => setChildrenDrawerOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t('members.addChild')}
              </Button>
              {(children?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground px-1 pt-1">{t('members.noChildren')}</p>
              ) : (
                children?.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setRemoveChildTarget({ id: child.id, name: child.fullName ?? '—' })}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left"
                  >
                    <Baby className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarImage src={child.photoUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {child.fullName ? getInitials(child.fullName) : <User className="h-3 w-3" />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium flex-1">{child.fullName ?? '—'}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground px-1 mb-1">{t('members.parentsSection')}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => setParentDrawerOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t('members.addParent')}
              </Button>
              {(personDetail?.parents.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground px-1 pt-1">{t('members.noParents')}</p>
              ) : (
                personDetail?.parents.map((parent) => (
                  <button
                    key={parent.id}
                    onClick={() => setRemoveParentTarget({ id: parent.id, name: parent.fullName ?? '—' })}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left"
                  >
                    <Users2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarImage src={parent.photoUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {parent.fullName ? getInitials(parent.fullName) : <User className="h-3 w-3" />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium flex-1">{parent.fullName ?? '—'}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {canToggleActive && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">{t('members.accountStatus')}</p>
            <button onClick={() => setStatusOpen(true)}
              className="w-full rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:bg-accent transition-colors text-left">
              <UserCog className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{member?.isActive ? t('members.statusActive') : t('members.statusInactive')}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </div>
        )}

        {isAdmin() && personDetail && !personDetail.hasAccount && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">{t('members.loginAccessSection')}</p>
            <button
              onClick={() => setAttachAccountOpen(true)}
              className="w-full rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:bg-accent transition-colors text-left"
            >
              <KeyRound className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{t('members.attachAccount')}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-1">{t('availability.tab')}</p>
          <button
            onClick={() => navigate({ to: `/app/org/${orgId}/members/${memberId}/availability` })}
            className="w-full rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:bg-accent transition-colors text-left"
          >
            <Clock3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium flex-1">{t('availability.memberSchedule')}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        </div>
      </div>

      {canEdit && member && (
        <EditMemberDrawer open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleEdit}
          isLoading={updateMutation.isPending}
          initialData={{ firstName: member.firstName, lastName: member.lastName, dateOfBirth: member.dateOfBirth, displayName: member.displayName, color: member.color }} />
      )}

      {canManageRoles && member && (
        <RolesDrawer open={addRoleOpen} onClose={() => setAddRoleOpen(false)} onSave={handleRolesChange}
          isLoading={addRoleMutation.isPending || removeRoleMutation.isPending} currentRoles={member.roles} />
      )}

      {canToggleActive && member && (
        <StatusDrawer open={statusOpen} onClose={() => setStatusOpen(false)} isActive={member.isActive}
          isLoading={setActiveMutation.isPending}
          onSave={async (active) => {
            try {
              await setActiveMutation.mutateAsync({ isActive: active })
              setStatusOpen(false)
              toast.success(active ? t('members.statusActivated') : t('members.statusDeactivated'))
            } catch {
              toast.error(t('members.statusFailed'))
            }
          }} />
      )}

      {canManageTrainers && member && (
        <AssignParticipantTrainerDrawer
          open={trainerDrawerOpen}
          onClose={() => setTrainerDrawerOpen(false)}
          orgId={orgId}
          memberId={memberId}
          assignedTrainerIds={member.assignedTrainers.map(t => t.trainerMemberId)}
          onAssign={async (trainerId) => {
            await assignTrainerM.mutateAsync({ memberId, data: { trainerMemberId: trainerId } })
          }}
        />
      )}

      {canManageRoles && member && (
        <AssignChildDrawer
          open={childrenDrawerOpen}
          onClose={() => setChildrenDrawerOpen(false)}
          orgId={orgId}
          parentPersonId={member.personId}
          assignedChildPersonIds={(children ?? []).map(c => c.id)}
          onAssign={async (childPersonId) => {
            await addChildM.mutateAsync({ parentPersonId: member.personId, childPersonId })
          }}
        />
      )}

      {canManageRoles && member && (
        <AssignParentDrawer
          open={parentDrawerOpen}
          onClose={() => setParentDrawerOpen(false)}
          orgId={orgId}
          childPersonId={member.personId}
          assignedParentPersonIds={(personDetail?.parents ?? []).map(p => p.id)}
          onAssign={async (parentPersonId) => {
            await addParentM.mutateAsync({ parentPersonId, childPersonId: member.personId })
          }}
        />
      )}

      <RemoveTrainerConfirmDrawer
        target={removeTrainerTarget}
        onClose={() => setRemoveTrainerTarget(null)}
        isLoading={removeTrainerM.isPending}
        onConfirm={async () => {
          if (!removeTrainerTarget) return
          try {
            await removeTrainerM.mutateAsync({ memberId, trainerId: removeTrainerTarget.id })
            setRemoveTrainerTarget(null)
            toast.success(t('members.trainerRemoved'))
          } catch {
            toast.error(t('members.trainerRemoveFailed'))
          }
        }}
      />

      <RemoveChildConfirmDrawer
        target={removeChildTarget}
        onClose={() => setRemoveChildTarget(null)}
        isLoading={removeChildM.isPending}
        onConfirm={async () => {
          if (!removeChildTarget) return
          try {
            await removeChildM.mutateAsync(removeChildTarget.id)
            setRemoveChildTarget(null)
            toast.success(t('members.childRemoved'))
          } catch {
            toast.error(t('members.childRemoveFailed'))
          }
        }}
      />

      <RemoveParentConfirmDrawer
        target={removeParentTarget}
        onClose={() => setRemoveParentTarget(null)}
        isLoading={removeParentM.isPending}
        onConfirm={async () => {
          if (!removeParentTarget || !member?.personId) return
          try {
            await removeParentM.mutateAsync({ parentPersonId: removeParentTarget.id, childPersonId: member.personId })
            setRemoveParentTarget(null)
            toast.success(t('members.parentRemoved'))
          } catch {
            toast.error(t('members.parentRemoveFailed'))
          }
        }}
      />

      <Drawer open={attachAccountOpen} onOpenChange={(v) => { if (!v) { setAttachAccountOpen(false); setAttachEmail('') } }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('members.attachAccountTitle')}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2 space-y-4">
            <p className="text-sm text-muted-foreground">{t('members.attachAccountDescription')}</p>
            <div className="space-y-2">
              <Label htmlFor="attach-email">{t('common.email')}</Label>
              <Input
                id="attach-email"
                type="email"
                value={attachEmail}
                onChange={(e) => setAttachEmail(e.target.value)}
                placeholder="jan@example.com"
                autoComplete="email"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button
              disabled={!attachEmail.trim() || attachAccountM.isPending}
              onClick={() =>
                attachAccountM.mutate(
                  { email: attachEmail.trim() },
                  {
                    onSuccess: () => {
                      toast.success(t('members.attachAccountSuccess'))
                      setAttachAccountOpen(false)
                      setAttachEmail('')
                    },
                    onError: (err) => toast.error(err.message),
                  }
                )
              }
            >
              {attachAccountM.isPending
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <KeyRound className="h-4 w-4 mr-2" />}
              {t('members.attachAccountSubmit')}
            </Button>
            <Button variant="outline" onClick={() => { setAttachAccountOpen(false); setAttachEmail('') }}>
              {t('common.cancel')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

function EditMemberDrawer({ open, onClose, onSubmit, isLoading, initialData }: {
  open: boolean; onClose: () => void; onSubmit: (data: UpdateMemberRequest) => void; isLoading: boolean
  initialData: { firstName?: string; lastName?: string; dateOfBirth?: string; displayName: string; color?: string }
}) {
  const { t } = useTranslation()
  const [firstName, setFirstName] = useState(initialData.firstName ?? '')
  const [lastName, setLastName] = useState(initialData.lastName ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(initialData.dateOfBirth ?? '')
  const [displayName, setDisplayName] = useState(initialData.displayName)
  const [color, setColor] = useState(initialData.color ?? '#6d28d9')

  useEffect(() => {
    if (open) {
      setFirstName(initialData.firstName ?? ''); setLastName(initialData.lastName ?? '')
      setDateOfBirth(initialData.dateOfBirth ?? ''); setDisplayName(initialData.displayName)
      setColor(initialData.color ?? '#6d28d9')
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ firstName: firstName || undefined, lastName: lastName || undefined, dateOfBirth: dateOfBirth || undefined, displayName: displayName || undefined, color })
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{t('members.editDrawerTitle')}</DrawerTitle></DrawerHeader>
        <form onSubmit={handleSubmit} className="px-4 space-y-4">
          <div className="space-y-2">
            <Label>{t('common.firstName')}</Label>
            <Input placeholder="Jan" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('common.lastName')}</Label>
            <Input placeholder="Kowalski" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('common.displayName')}</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('common.displayNamePlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{t('common.dateOfBirth')}</Label>
            <DatePickerInput value={dateOfBirth} onChange={setDateOfBirth} placeholder={t('common.birthDatePlaceholder')} />
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
          <Button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('common.save')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function RolesDrawer({ open, onClose, onSave, isLoading, currentRoles }: {
  open: boolean; onClose: () => void; onSave: (roles: string[]) => void; isLoading: boolean; currentRoles: string[]
}) {
  const { t } = useTranslation()
  const ALL_ROLES = ['Admin', 'Manager', 'Trainer', 'Participant']
  const [selected, setSelected] = useState<string[]>(currentRoles)

  useEffect(() => { if (open) setSelected(currentRoles) }, [open, currentRoles])

  const toggle = (role: string) => setSelected(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{t('members.rolesDrawerTitle')}</DrawerTitle></DrawerHeader>
        <div className="px-4 pb-2 space-y-2">
          {ALL_ROLES.map(role => {
            const active = selected.includes(role)
            return (
              <button key={role} onClick={() => toggle(role)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-accent'}`}>
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium flex-1 text-left">{getRoleLabel(role)}</span>
                {active && <span className="text-xs font-medium">✓</span>}
              </button>
            )
          })}
        </div>
        <DrawerFooter>
          <Button onClick={() => onSave(selected)} disabled={selected.length === 0 || isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('common.save')}
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function AssignParticipantTrainerDrawer({
  open, onClose, orgId, memberId: _memberId, assignedTrainerIds, onAssign,
}: {
  open: boolean
  onClose: () => void
  orgId: string
  memberId: string
  assignedTrainerIds: string[]
  onAssign: (trainerId: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const { data: trainers, isLoading } = useTrainers(orgId)

  const handleAssign = async (trainerId: string) => {
    if (assignedTrainerIds.includes(trainerId)) return
    setPendingId(trainerId)
    try {
      await onAssign(trainerId)
      toast.success(t('members.trainerAssigned'))
    } catch {
      toast.error(t('members.trainerAssignFailed'))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('members.assignTrainerTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !trainers || trainers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('members.noAvailableTrainers')}</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto -mx-4 px-4">
              {trainers.map((tr) => {
                const assigned = assignedTrainerIds.includes(tr.id)
                const loading = pendingId === tr.id
                return (
                  <button
                    key={tr.id}
                    onClick={() => handleAssign(tr.id)}
                    disabled={assigned || loading}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors text-left',
                      assigned
                        ? 'opacity-60 cursor-default bg-muted/30'
                        : 'hover:bg-accent cursor-pointer',
                    )}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={tr.photoUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(tr.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium">{tr.displayName}</span>
                    {assigned ? (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <UserCheck className="h-3 w-3" />
                        {t('members.alreadyAssigned')}
                      </Badge>
                    ) : loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <DrawerFooter>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.close')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function RemoveChildConfirmDrawer({ target, onClose, isLoading, onConfirm }: {
  target: { id: string; name: string } | null
  onClose: () => void
  isLoading: boolean
  onConfirm: () => Promise<void>
}) {
  const { t } = useTranslation()
  return (
    <Drawer open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('members.removeChildConfirmTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-3">
            <Baby className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium">{target?.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('members.removeChildConfirmDesc', { name: target?.name })}
          </p>
        </div>
        <DrawerFooter>
          <Button
            variant="destructive"
            className="w-full"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('members.removeChildBtn')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function RemoveTrainerConfirmDrawer({ target, onClose, isLoading, onConfirm }: {
  target: { id: string; name: string } | null
  onClose: () => void
  isLoading: boolean
  onConfirm: () => Promise<void>
}) {
  const { t } = useTranslation()
  return (
    <Drawer open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('members.removeTrainerConfirmTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-3">
            <UserCheck className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium">{target?.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('members.removeTrainerConfirmDesc', { name: target?.name })}
          </p>
        </div>
        <DrawerFooter>
          <Button
            variant="destructive"
            className="w-full"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('members.removeTrainerBtn')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function RemoveParentConfirmDrawer({ target, onClose, isLoading, onConfirm }: {
  target: { id: string; name: string } | null
  onClose: () => void
  isLoading: boolean
  onConfirm: () => Promise<void>
}) {
  const { t } = useTranslation()
  return (
    <Drawer open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('members.removeParentConfirmTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-3">
            <Users2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium">{target?.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('members.removeParentConfirmDesc', { name: target?.name })}
          </p>
        </div>
        <DrawerFooter>
          <Button
            variant="destructive"
            className="w-full"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('members.removeParentBtn')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function AssignChildDrawer({
  open, onClose, orgId, parentPersonId, assignedChildPersonIds, onAssign,
}: {
  open: boolean
  onClose: () => void
  orgId: string
  parentPersonId: string
  assignedChildPersonIds: string[]
  onAssign: (childPersonId: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const { data: allMembers, isLoading } = useAllMembers(orgId)

  const available = (allMembers ?? []).filter(
    m =>
      m.personId !== parentPersonId &&
      !assignedChildPersonIds.includes(m.personId) &&
      m.roles.includes('Participant')
  )

  const handleAssign = async (personId: string) => {
    setPendingId(personId)
    try {
      await onAssign(personId)
      toast.success(t('members.childAdded'))
      onClose()
    } catch {
      toast.error(t('members.childAddFailed'))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('members.assignChildTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : available.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('members.noAvailablePersons')}</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto -mx-4 px-4">
              {available.map((m) => {
                const loading = pendingId === m.personId
                return (
                  <button
                    key={m.id}
                    onClick={() => handleAssign(m.personId)}
                    disabled={loading}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors text-left',
                      loading ? 'opacity-60 cursor-default' : 'hover:bg-accent cursor-pointer',
                    )}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={m.photoUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(m.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium">{m.displayName}</span>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <DrawerFooter>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.close')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function AssignParentDrawer({
  open, onClose, orgId, childPersonId, assignedParentPersonIds, onAssign,
}: {
  open: boolean
  onClose: () => void
  orgId: string
  childPersonId: string
  assignedParentPersonIds: string[]
  onAssign: (parentPersonId: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const { data: allMembers, isLoading } = useAllMembers(orgId)

  const available = (allMembers ?? []).filter(
    m =>
      m.personId !== childPersonId &&
      !assignedParentPersonIds.includes(m.personId) &&
      m.roles.includes('Participant')
  )

  const handleAssign = async (personId: string) => {
    setPendingId(personId)
    try {
      await onAssign(personId)
      toast.success(t('members.parentAdded'))
      onClose()
    } catch {
      toast.error(t('members.parentAddFailed'))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('members.assignParentTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : available.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('members.noAvailablePersons')}</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto -mx-4 px-4">
              {available.map((m) => {
                const loading = pendingId === m.personId
                return (
                  <button
                    key={m.id}
                    onClick={() => handleAssign(m.personId)}
                    disabled={loading}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors text-left',
                      loading ? 'opacity-60 cursor-default' : 'hover:bg-accent cursor-pointer',
                    )}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={m.photoUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(m.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium">{m.displayName}</span>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <DrawerFooter>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.close')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function StatusDrawer({ open, onClose, isActive, isLoading, onSave }: {
  open: boolean; onClose: () => void; isActive: boolean; isLoading: boolean; onSave: (active: boolean) => void
}) {
  const { t } = useTranslation()
  const options = [
    { value: true, label: t('members.statusActive') },
    { value: false, label: t('members.statusInactive') },
  ]
  return (
    <Drawer open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{t('members.statusDrawerTitle')}</DrawerTitle></DrawerHeader>
        <div className="px-4 pb-2 space-y-2">
          {options.map(opt => {
            const isSelected = opt.value === isActive
            return (
              <button key={String(opt.value)} onClick={() => onSave(opt.value)} disabled={isLoading}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-accent'}`}>
                <UserCog className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium flex-1 text-left">{opt.label}</span>
                {isSelected && <span className="text-xs font-medium">✓</span>}
                {isLoading && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
              </button>
            )
          })}
        </div>
        <DrawerFooter>
          <Button variant="ghost" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
