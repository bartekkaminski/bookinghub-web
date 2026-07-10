import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Plus, Search, Users, ChevronRight, ArrowLeft, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useMembers, useCreateMemberWithAccount, useCreateMemberProfile } from './use-members'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { ListSkeleton } from '@/shared/components/loading-skeletons'
import { EmptyState } from '@/shared/components/empty-state'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { getRoleLabel, roleColors } from '@/shared/utils/roles'
import { getInitials } from '@/shared/utils/format'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { Label } from '@/shared/components/ui/label'
import { Loader2 } from 'lucide-react'
import { DatePickerInput } from '@/shared/components/ui/date-picker'
import { DrawerSelect } from '@/shared/components/ui/drawer-select'
import type { CreateMemberWithAccountRequest, CreateMemberProfileRequest } from '@/api/types'
import { useDebounce } from '@/shared/hooks/use-debounce'

export function MembersListPage() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const navigate = useNavigate()
  const { isAdmin } = useAuthStore()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [addMode, setAddMode] = useState<null | 'new'>(null)
  const [roleFilter, setRoleFilter] = useState<string>('')

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError, refetch } = useMembers(orgId, {
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
    pageSize: 50,
  })

  const createMutation = useCreateMemberWithAccount(orgId)
  const createProfileMutation = useCreateMemberProfile(orgId)

  const handleCreateNew = async (formData: CreateMemberWithAccountRequest) => {
    try {
      await createMutation.mutateAsync(formData)
      setAddMode(null)
      toast.success(t('members.memberAdded'))
    } catch {
      toast.error(t('members.memberAddFailed'))
    }
  }

  const handleCreateProfile = async (formData: CreateMemberProfileRequest) => {
    try {
      await createProfileMutation.mutateAsync(formData)
      setAddMode(null)
      toast.success(t('members.profileCreated'))
    } catch {
      toast.error(t('members.profileCreateFailed'))
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={t('members.title')}
          back={<Button variant="outline" size="sm" onClick={() => navigate({ to: `/app/org/${orgId}/dashboard` })}><ArrowLeft className="h-4 w-4" /></Button>}
          action={
            isAdmin() ? (
              <Button size="sm" onClick={() => setAddMode('new')} className="gap-1.5">
                <Plus className="h-4 w-4" />
                {t('common.add')}
              </Button>
            ) : undefined
          }
        />
        <div className="px-4 pb-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <DrawerSelect
            value={roleFilter}
            onChange={setRoleFilter}
            title={t('members.filterRole')}
            placeholder={t('members.allRoles')}
            options={[
              { value: '', label: t('members.all') },
              { value: 'Admin', label: t('members.roleAdmin') },
              { value: 'Manager', label: t('members.roleManager') },
              { value: 'Trainer', label: t('members.roleTrainer') },
              { value: 'Participant', label: t('members.roleParticipant') },
            ]}
          />
        </div>
      </div>

      {isLoading ? <ListSkeleton /> : isError ? <ErrorState onRetry={refetch} /> :
        data?.items.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title={t('members.noMembers')}
            description={search ? t('members.noResults') : t('members.addFirst')}
            action={
              isAdmin() ? (
                <Button size="sm" onClick={() => setAddMode('new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('members.addMember')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {data?.items.map((member) => (
              <button
                key={member.id}
                onClick={() => navigate({ to: `/app/org/${orgId}/members/${member.id}` })}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={member.photoUrl} />
                  <AvatarFallback
                    style={member.color ? { backgroundColor: member.color } : undefined}
                    className={!member.color ? 'bg-primary/20 text-primary' : 'text-white'}
                  >
                    {getInitials(member.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{member.displayName}</span>
                    {!member.isActive && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">{t('members.inactiveBadge')}</Badge>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap mt-0.5">
                    {member.roles.map((role) => (
                      <span
                        key={role}
                        className={`text-xs px-1.5 py-0.5 rounded text-white ${roleColors[role as keyof typeof roleColors] ?? 'bg-zinc-600'}`}
                      >
                        {getRoleLabel(role)}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )
      }

      {isAdmin() && (
        <CreateMemberDrawer
          open={addMode === 'new'}
          onClose={() => setAddMode(null)}
          onSubmitWithAccount={handleCreateNew}
          onSubmitProfile={handleCreateProfile}
          isLoadingWithAccount={createMutation.isPending}
          isLoadingProfile={createProfileMutation.isPending}
        />
      )}
    </div>
  )
}

function CreateMemberDrawer({
  open, onClose, onSubmitWithAccount, onSubmitProfile, isLoadingWithAccount, isLoadingProfile,
}: {
  open: boolean
  onClose: () => void
  onSubmitWithAccount: (data: CreateMemberWithAccountRequest) => void
  onSubmitProfile: (data: CreateMemberProfileRequest) => void
  isLoadingWithAccount: boolean
  isLoadingProfile: boolean
}) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'account' | 'profile'>('account')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [color, setColor] = useState('#6d28d9')
  const [roles, setRoles] = useState<string[]>(['Participant'])

  const handleModeChange = (newMode: 'account' | 'profile') => {
    setMode(newMode)
    if (newMode === 'profile') setRoles(['Participant'])
  }

  const reset = () => {
    setFirstName(''); setLastName(''); setEmail(''); setDateOfBirth('')
    setDisplayName(''); setColor('#6d28d9'); setRoles(['Participant'])
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !lastName) return
    if (mode === 'account') {
      if (!email) return
      onSubmitWithAccount({ firstName, lastName, email, roles, dateOfBirth: dateOfBirth || undefined, displayName: displayName || undefined, color })
    } else {
      onSubmitProfile({ firstName, lastName, roles, dateOfBirth: dateOfBirth || undefined, displayName: displayName || undefined, color })
    }
  }

  const isLoading = mode === 'account' ? isLoadingWithAccount : isLoadingProfile
  const canSubmit = firstName && lastName && roles.length > 0 && (mode === 'profile' || email)

  return (
    <Drawer open={open} onOpenChange={(v) => !v && handleClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{t('members.newMember')}</DrawerTitle></DrawerHeader>
        <div className="px-4 mb-3">
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            <button type="button" onClick={() => handleModeChange('account')}
              className={`flex-1 py-2 font-medium transition-colors ${mode === 'account' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
              {t('members.withAccount')}
            </button>
            <button type="button" onClick={() => handleModeChange('profile')}
              className={`flex-1 py-2 font-medium transition-colors ${mode === 'profile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>
              {t('members.profileOnly')}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {mode === 'account' ? t('members.withAccountDesc') : t('members.profileOnlyDesc')}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="px-4 space-y-3">
          <div className="space-y-2">
            <Label>{t('members.firstNameLabel')}</Label>
            <Input placeholder="Jan" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>{t('members.lastNameLabel')}</Label>
            <Input placeholder="Kowalski" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>{t('common.displayName')}</Label>
            <Input placeholder={t('common.displayNamePlaceholder')} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          {mode === 'account' && (
            <div className="space-y-2">
              <Label>{t('members.emailLabel')}</Label>
              <Input type="email" placeholder={t('members.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          )}
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
          {mode === 'account' && (
            <div className="space-y-2">
              <Label>{t('members.rolesLabel')}</Label>
              <div className="space-y-2">
                {['Admin', 'Manager', 'Trainer', 'Participant'].map(r => {
                  const active = roles.includes(r)
                  return (
                    <button key={r} type="button"
                      onClick={() => setRoles(prev => prev.includes(r) ? (prev.length > 1 ? prev.filter(x => x !== r) : prev) : [...prev, r])}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:bg-accent'}`}>
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium flex-1 text-left">{getRoleLabel(r)}</span>
                      {active && <span className="text-xs font-medium">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </form>
        <DrawerFooter>
          <Button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={!canSubmit || isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {mode === 'account' ? t('members.createAccount') : t('members.createProfile')}
          </Button>
          <Button variant="outline" onClick={handleClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
