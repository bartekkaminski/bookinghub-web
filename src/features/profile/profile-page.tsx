import { useState } from 'react'
import { useKindeAuth } from '@kinde-oss/kinde-auth-react'
import { Edit, Building2, Loader2, SwitchCamera, Sun, Moon, ChevronRight, Globe, Baby, Hash, Copy, Check, Grid3X3, UsersRound, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useMyPerson, useUpdatePerson } from './use-person'
import { useOrganization, useUpdateOrganization } from '@/features/organizations/use-organizations'
import { useMember } from '@/features/members/use-members'
import { EditOrgDrawer } from '@/features/organizations/dashboard-page'
import { useTheme } from '@/shared/hooks/use-theme'
import { authApi } from '@/api/endpoints'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { DetailSkeleton } from '@/shared/components/loading-skeletons'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { getRoleLabel } from '@/shared/utils/roles'
import { getInitials } from '@/shared/utils/format'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import type { UpdatePersonRequest, UpdateOrganizationRequest } from '@/api/types'
import i18n from '@/i18n'

export function ProfilePage() {
  const { logout } = useKindeAuth()
  const navigate = useNavigate()
  const router = useRouter()
  const { user, currentOrgId, getCurrentRoles, isAdminOrManager, isTrainer } = useAuthStore()
  const { t } = useTranslation()
  const [editOpen, setEditOpen] = useState(false)
  const [editOrgOpen, setEditOrgOpen] = useState(false)
  const [orgActionsOpen, setOrgActionsOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const { isDark, setTheme } = useTheme()

  const canSeeOrgLists = isAdminOrManager() || isTrainer()
  const isParticipantOnly = !canSeeOrgLists
  const currentMembership = user?.memberships.find(m => m.organizationId === currentOrgId)
  const myMemberId = isParticipantOnly ? (currentMembership?.memberId ?? '') : ''

  const { data: person, isLoading, isError, refetch } = useMyPerson()
  const updateMutation = useUpdatePerson(person?.id ?? '')
  const { data: currentOrg } = useOrganization(currentOrgId ?? '')
  const updateOrgMutation = useUpdateOrganization(currentOrgId ?? '')
  const { data: myMember } = useMember(currentOrgId ?? '', myMemberId)

  const roles = getCurrentRoles()

  const handleUpdate = async (data: UpdatePersonRequest) => {
    if (!person?.id) return
    try {
      await updateMutation.mutateAsync(data)
      setEditOpen(false)
      toast.success(t('profile.saved'))
    } catch {
      toast.error(t('profile.saveFailed'))
    }
  }

  const handleUpdateOrg = async (data: UpdateOrganizationRequest) => {
    try {
      await updateOrgMutation.mutateAsync(data)
      setEditOrgOpen(false)
      toast.success(t('profile.orgSaved'))
    } catch {
      toast.error(t('profile.orgSaveFailed'))
    }
  }

  const handleLanguageChange = async (lang: string) => {
    try {
      await authApi.setLanguage(lang)
      localStorage.setItem('bookinghub-lang', lang)
      i18n.changeLanguage(lang)
      setLangOpen(false)
      toast.success(t('profile.languageSaved'))
    } catch {
      toast.error(t('profile.languageFailed'))
    }
  }

  const canManageOrg = isAdminOrManager()

  const handleCopyCode = () => {
    if (!person?.profileCode) return
    navigator.clipboard.writeText(person.profileCode).then(() => {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    })
  }

  if (isLoading) return <DetailSkeleton />
  if (isError) return <ErrorState onRetry={refetch} />

  const currentLang = i18n.language === 'en' ? t('profile.english') : t('profile.polish')

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={t('profile.title')}
          back={
            <Button variant="outline" size="sm" onClick={() => router.history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
      </div>

      <div className="p-4 space-y-4">
        {/* Avatar & name */}
        <div className="flex flex-col items-center gap-3 py-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={person?.photoUrl} />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl">
              {getInitials(person?.fullName ?? user?.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-lg font-semibold">{person?.fullName ?? user?.fullName ?? user?.email}</h2>
            {user?.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
          </div>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {roles.map(role => (
              <Badge key={role} variant="secondary">{getRoleLabel(role)}</Badge>
            ))}
          </div>
          <Button variant="outline" onClick={() => setEditOpen(true)} className="gap-2 mt-1 px-6">
            <Edit className="h-4 w-4" />
            {t('profile.editProfile')}
          </Button>
        </div>

        {/* Current org */}
        {currentMembership && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">{t('profile.activeOrg')}</p>
            <button onClick={() => setOrgActionsOpen(true)}
              className="w-full rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:bg-accent transition-colors text-left">
              <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium flex-1 truncate">{currentMembership.organizationName}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </div>
        )}

        {/* Memberships */}
        {user && user.memberships.length > 1 && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">{t('profile.organizations')}</h3>
            {user.memberships.map(m => (
              <div key={m.organizationId} className="flex items-center justify-between">
                <span className="text-sm">{m.organizationName}</span>
                <div className="flex gap-1">
                  {m.roles.map(r => (
                    <span key={r} className="text-xs bg-secondary px-2 py-0.5 rounded-full">{getRoleLabel(r)}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Theme */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-1">{t('profile.theme')}</p>
          <button onClick={() => setThemeOpen(true)}
            className="w-full rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:bg-accent transition-colors text-left">
            {isDark ? <Moon className="h-5 w-5 text-muted-foreground flex-shrink-0" /> : <Sun className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{isDark ? t('profile.dark') : t('profile.light')}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        </div>

        {/* Language */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-1">{t('profile.language')}</p>
          <button onClick={() => setLangOpen(true)}
            className="w-full rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:bg-accent transition-colors text-left">
            <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium flex-1">{currentLang}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        </div>

        {/* Profile code — visible only to account owner, used by admins to add to org */}
        {person?.profileCode && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">{t('profile.myCode')}</p>
            <button
              onClick={handleCopyCode}
              className="w-full rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:bg-accent transition-colors text-left active:scale-[0.99]"
              aria-label={t('profile.copyCode')}
            >
              <Hash className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-mono font-semibold tracking-widest">
                  {person.profileCode.slice(0, 4)}-{person.profileCode.slice(4)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('profile.myCodeDesc')}</p>
              </div>
              {codeCopied
                ? <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                : <Copy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              }
            </button>
          </div>
        )}

        {/* My children */}
        {(person?.children?.length ?? 0) > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">{t('children.pageTitle')}</p>
            <button
              onClick={() => navigate({ to: `/app/org/${currentOrgId}/children` })}
              className="w-full rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:bg-accent transition-colors text-left"
            >
              <Baby className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{t('profile.myChildren')}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </div>
        )}

        {/* Moje grupy i zespoły — tylko dla uczestnika */}
        {isParticipantOnly && myMember && (
          <>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground px-1">{t('profile.myGroups')}</p>
              <div className="rounded-xl border border-border bg-card px-4 py-3">
                {(myMember.groups?.length ?? 0) > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {myMember.groups!.map(g => (
                      <span
                        key={g.groupId}
                        className="text-xs px-2.5 py-1 rounded-full text-white font-medium"
                        style={{ backgroundColor: g.color ?? '#6d28d9' }}
                      >
                        {g.groupName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Grid3X3 className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{t('profile.noGroupsAssigned')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground px-1">{t('profile.myTeams')}</p>
              <div className="rounded-xl border border-border bg-card px-4 py-3">
                {(myMember.teams?.length ?? 0) > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {myMember.teams!.map(team => (
                      <span
                        key={team.teamId}
                        className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"
                      >
                        {team.teamName ?? t('members.teamWithoutName')}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UsersRound className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{t('profile.noTeamsAssigned')}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Logout */}
        <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive"
          onClick={() => setLogoutOpen(true)}>
          {t('auth.logout')}
        </Button>
      </div>

      {/* Logout confirmation */}
      <Drawer open={logoutOpen} onOpenChange={(v) => !v && setLogoutOpen(false)}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>{t('auth.logout')}</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-2 text-sm text-muted-foreground text-center">{t('auth.logoutConfirm')}</div>
          <div className="px-4 pb-6 pt-2 space-y-2">
            <Button variant="destructive" className="w-full" onClick={() => logout()}>{t('auth.logout')}</Button>
            <Button variant="ghost" className="w-full" onClick={() => setLogoutOpen(false)}>{t('common.cancel')}</Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Edit person drawer */}
      {person && (
        <EditPersonDrawer open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
          initialData={{ firstName: person.firstName, lastName: person.lastName, photoUrl: person.photoUrl }} />
      )}

      {/* Theme drawer */}
      <Drawer open={themeOpen} onOpenChange={(v) => !v && setThemeOpen(false)}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>{t('profile.theme')}</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-4 space-y-2">
            <button onClick={() => { setTheme('light'); setThemeOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${!isDark ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}>
              <Sun className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{t('profile.light')}</span>
              {!isDark && <span className="text-xs text-primary font-medium">✓</span>}
            </button>
            <button onClick={() => { setTheme('dark'); setThemeOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${isDark ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}>
              <Moon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium flex-1">{t('profile.dark')}</span>
              {isDark && <span className="text-xs text-primary font-medium">✓</span>}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Language drawer */}
      <Drawer open={langOpen} onOpenChange={(v) => !v && setLangOpen(false)}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>{t('profile.language')}</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-4 space-y-2">
            {[
              { code: 'pl', label: t('profile.polish') },
              { code: 'en', label: t('profile.english') },
            ].map(lang => {
              const isSelected = i18n.language === lang.code
              return (
                <button key={lang.code} onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}`}>
                  <Globe className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium flex-1">{lang.label}</span>
                  {isSelected && <span className="text-xs font-medium">✓</span>}
                </button>
              )
            })}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Org actions drawer */}
      <Drawer open={orgActionsOpen} onOpenChange={(v) => !v && setOrgActionsOpen(false)}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>{currentMembership?.organizationName}</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-4 space-y-2">
            <button onClick={() => { setOrgActionsOpen(false); navigate({ to: '/app/org-select' }) }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition-colors text-left">
              <SwitchCamera className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{t('profile.changeOrg')}</span>
            </button>
            {canManageOrg && (
              <button onClick={() => { setOrgActionsOpen(false); setEditOrgOpen(true) }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition-colors text-left">
                <Edit className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{t('profile.editOrg')}</span>
              </button>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Edit org drawer */}
      {canManageOrg && currentOrg && (
        <EditOrgDrawer open={editOrgOpen} onClose={() => setEditOrgOpen(false)} onSubmit={handleUpdateOrg}
          isLoading={updateOrgMutation.isPending}
          initialData={{ name: currentOrg.name, description: currentOrg.description }} />
      )}
    </div>
  )
}

function EditPersonDrawer({ open, onClose, onSubmit, isLoading, initialData }: {
  open: boolean; onClose: () => void; onSubmit: (data: UpdatePersonRequest) => void; isLoading: boolean
  initialData: { firstName?: string; lastName?: string; photoUrl?: string }
}) {
  const { t } = useTranslation()
  const [firstName, setFirstName] = useState(initialData.firstName ?? '')
  const [lastName, setLastName] = useState(initialData.lastName ?? '')
  const [photoUrl, setPhotoUrl] = useState(initialData.photoUrl ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ firstName: firstName.trim() || undefined, lastName: lastName.trim() || undefined, photoUrl: photoUrl.trim() || undefined })
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{t('profile.editPersonTitle')}</DrawerTitle></DrawerHeader>
        <form onSubmit={handleSubmit} className="px-4 space-y-3">
          <div className="space-y-2">
            <Label>{t('common.firstName')}</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t('common.firstName')} />
          </div>
          <div className="space-y-2">
            <Label>{t('common.lastName')}</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t('common.lastName')} />
          </div>
          <div className="space-y-2">
            <Label>{t('common.photoUrl')}</Label>
            <Input type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
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
