import { useState, useEffect } from 'react'
import { useParams, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Edit, UserCheck, Loader2, Shield, Grid3X3, UsersRound, ChevronRight, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useMember, useUpdateMember, useSetMemberActive, useAddMemberRole, useRemoveMemberRole, memberKeys } from './use-members'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { DetailSkeleton } from '@/shared/components/loading-skeletons'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { getRoleLabel } from '@/shared/utils/roles'
import { getInitials } from '@/shared/utils/format'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { DatePickerInput } from '@/shared/components/ui/date-picker'
import type { UpdateMemberRequest } from '@/api/types'

export function MemberDetailPage() {
  const { orgId, memberId } = useParams({ strict: false }) as { orgId: string; memberId: string }
  const router = useRouter()
  const qc = useQueryClient()
  const { t } = useTranslation()
  const { isAdmin, isAdminOrManager, user } = useAuthStore()
  const [editOpen, setEditOpen] = useState(false)
  const [addRoleOpen, setAddRoleOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  const { data: member, isLoading, isError, refetch } = useMember(orgId, memberId)
  const updateMutation = useUpdateMember(orgId, memberId)
  const setActiveMutation = useSetMemberActive(orgId, memberId)
  const addRoleMutation = useAddMemberRole(orgId, memberId)
  const removeRoleMutation = useRemoveMemberRole(orgId, memberId)

  const isOwnProfile = user?.memberships.some(m => m.organizationId === orgId && member?.personId === user.personId)
  const canEdit = isAdminOrManager() || isOwnProfile
  const canManageRoles = isAdmin()
  const canToggleActive = isAdmin()

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

        {(member?.assignedTrainers.length ?? 0) > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">{t('members.trainersSection')}</p>
            {member?.assignedTrainers.map((tr) => (
              <div key={tr.trainerId} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <UserCheck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium">{tr.trainerName}</span>
              </div>
            ))}
          </div>
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
