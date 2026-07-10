import { useState, useMemo } from 'react'
import { Loader2, UserCheck, Users, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { EmptyState } from '@/shared/components/empty-state'
import { useAllMembers } from '@/features/members/use-members'
import { useEnrollMember } from './use-enrollments'
import { getInitials } from '@/shared/utils/format'
import { cn } from '@/shared/utils/cn'

interface EnrollMemberDrawerProps {
  open: boolean
  onClose: () => void
  orgId: string
  eventId: string
  /** IDs of members already enrolled */
  enrolledMemberIds: string[]
}

export function EnrollMemberDrawer({ open, onClose, orgId, eventId, enrolledMemberIds }: EnrollMemberDrawerProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)

  const { data: members, isLoading } = useAllMembers(orgId)
  const enrollM = useEnrollMember(orgId, eventId)

  const filtered = useMemo(() => {
    if (!members) return []
    const q = search.toLowerCase()
    return members.filter(m => m.displayName.toLowerCase().includes(q))
  }, [members, search])

  const handleEnroll = async (memberId: string) => {
    if (enrolledMemberIds.includes(memberId)) return
    setPendingId(memberId)
    try {
      await enrollM.mutateAsync({ organizationMemberId: memberId })
      toast.success(t('enrollments.enrollSuccess'))
    } catch {
      toast.error(t('enrollments.enrollFailed'))
    } finally {
      setPendingId(null)
    }
  }

  const handleClose = () => {
    setSearch('')
    onClose()
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && handleClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('enrollments.enrollMemberTitle')}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-2 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9"
              placeholder={t('enrollments.searchMembers')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Member list */}
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title={t('enrollments.noAvailableMembers')}
              className="py-6"
            />
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto -mx-4 px-4">
              {filtered.map((m) => {
                const alreadyEnrolled = enrolledMemberIds.includes(m.id)
                const isLoading = pendingId === m.id

                return (
                  <button
                    key={m.id}
                    onClick={() => handleEnroll(m.id)}
                    disabled={alreadyEnrolled || isLoading}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors text-left',
                      alreadyEnrolled
                        ? 'opacity-60 cursor-default bg-muted/30'
                        : 'hover:bg-accent active:bg-accent/80 cursor-pointer',
                    )}
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage src={m.photoUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(m.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium">{m.displayName}</span>
                    {alreadyEnrolled ? (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <UserCheck className="h-3 w-3" />
                        {t('enrollments.alreadyEnrolled')}
                      </Badge>
                    ) : isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button variant="outline" onClick={handleClose} className="w-full">
            {t('common.close')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
