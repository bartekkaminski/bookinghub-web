import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2, Search, Users, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { useAllMembers } from '@/features/members/use-members'
import { useAllTeams } from '@/features/teams/use-teams'
import { getInitials } from '@/shared/utils/format'
import { cn } from '@/shared/utils/cn'

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}

// ── Members ──────────────────────────────────────────────────────────────────

interface SelectEventMembersDrawerProps {
  open: boolean
  onClose: () => void
  orgId: string
  selectedIds: string[]
  onConfirm: (memberIds: string[]) => void
}

export function SelectEventMembersDrawer({
  open,
  onClose,
  orgId,
  selectedIds,
  onConfirm,
}: SelectEventMembersDrawerProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<string[]>(selectedIds)
  const { data: members, isLoading } = useAllMembers(orgId)

  useEffect(() => {
    if (open) {
      setDraft(selectedIds)
      setSearch('')
    }
  }, [open, selectedIds])

  const filtered = useMemo(() => {
    const list = (members ?? []).filter((m) => m.isActive)
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((m) => m.displayName.toLowerCase().includes(q))
  }, [members, search])

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('events.selectMembersTitle')}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9"
              placeholder={t('events.selectMembersSearch')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('common.noResults')}</p>
          ) : (
            <div className="space-y-1 max-h-[55vh] overflow-y-auto -mx-4 px-4">
              {filtered.map((m) => {
                const isSelected = draft.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setDraft(toggleId(draft, m.id))}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors border',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent hover:bg-accent',
                    )}
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage src={m.photoUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(m.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium truncate">{m.displayName}</span>
                    <span
                      className={cn(
                        'h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border',
                      )}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button
            onClick={() => {
              onConfirm(draft)
              onClose()
            }}
            className="w-full"
          >
            {draft.length > 0
              ? t('events.selectParticipantsConfirm', { count: draft.length })
              : t('events.selectMembersConfirmEmpty')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export function SelectedMembersSummary({
  memberIds,
  orgId,
  onRemove,
}: {
  memberIds: string[]
  orgId: string
  onRemove: (id: string) => void
}) {
  const { t } = useTranslation()
  const { data: members } = useAllMembers(orgId)
  const selected = (members ?? []).filter((m) => memberIds.includes(m.id))

  if (selected.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
        <Users className="h-5 w-5 opacity-50" />
        {t('events.membersNoneSelected')}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border divide-y divide-border">
      {selected.map((m) => (
        <div key={m.id} className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={m.photoUrl} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(m.displayName)}
            </AvatarFallback>
          </Avatar>
          <p className="flex-1 text-sm font-medium truncate">{m.displayName}</p>
          <button
            type="button"
            onClick={() => onRemove(m.id)}
            className="text-xs text-muted-foreground hover:text-destructive px-2 py-1"
          >
            {t('common.delete')}
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Teams ─────────────────────────────────────────────────────────────────────

interface SelectEventTeamsDrawerProps {
  open: boolean
  onClose: () => void
  orgId: string
  selectedIds: string[]
  onConfirm: (teamIds: string[]) => void
}

export function SelectEventTeamsDrawer({
  open,
  onClose,
  orgId,
  selectedIds,
  onConfirm,
}: SelectEventTeamsDrawerProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<string[]>(selectedIds)
  const { data: teams, isLoading } = useAllTeams(orgId)

  useEffect(() => {
    if (open) {
      setDraft(selectedIds)
      setSearch('')
    }
  }, [open, selectedIds])

  const filtered = useMemo(() => {
    const list = (teams ?? []).filter((tm) => tm.isActive)
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((tm) => (tm.name ?? '').toLowerCase().includes(q))
  }, [teams, search])

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('events.selectTeamsTitle')}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9"
              placeholder={t('events.selectTeamsSearch')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('common.noResults')}</p>
          ) : (
            <div className="space-y-1 max-h-[55vh] overflow-y-auto -mx-4 px-4">
              {filtered.map((team) => {
                const isSelected = draft.includes(team.id)
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setDraft(toggleId(draft, team.id))}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors border',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent hover:bg-accent',
                    )}
                  >
                    <div className="h-9 w-9 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <UsersRound className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('events.teamsMembersCount', { count: team.membersCount })}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0',
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border',
                      )}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button
            onClick={() => {
              onConfirm(draft)
              onClose()
            }}
            className="w-full"
          >
            {draft.length > 0
              ? t('events.selectParticipantsConfirm', { count: draft.length })
              : t('events.selectTeamsConfirmEmpty')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export function SelectedTeamsSummary({
  teamIds,
  orgId,
  onRemove,
}: {
  teamIds: string[]
  orgId: string
  onRemove: (id: string) => void
}) {
  const { t } = useTranslation()
  const { data: teams } = useAllTeams(orgId)
  const selected = (teams ?? []).filter((tm) => teamIds.includes(tm.id))

  if (selected.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
        <UsersRound className="h-5 w-5 opacity-50" />
        {t('events.teamsNoneSelected')}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border divide-y divide-border">
      {selected.map((team) => (
        <div key={team.id} className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            <UsersRound className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{team.name}</p>
            <p className="text-xs text-muted-foreground">
              {t('events.teamsMembersCount', { count: team.membersCount })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(team.id)}
            className="text-xs text-muted-foreground hover:text-destructive px-2 py-1"
          >
            {t('common.delete')}
          </button>
        </div>
      ))}
    </div>
  )
}
