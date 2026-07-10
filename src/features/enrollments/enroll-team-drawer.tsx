import { useState } from 'react'
import { Loader2, UsersRound } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { EmptyState } from '@/shared/components/empty-state'
import { useAllTeams } from '@/features/teams/use-teams'
import { useEnrollTeam } from './use-enrollments'
import { cn } from '@/shared/utils/cn'

interface EnrollTeamDrawerProps {
  open: boolean
  onClose: () => void
  orgId: string
  eventId: string
  /** IDs of teams already enrolled */
  enrolledTeamIds: string[]
}

export function EnrollTeamDrawer({ open, onClose, orgId, eventId, enrolledTeamIds }: EnrollTeamDrawerProps) {
  const { t } = useTranslation()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const { data: teams, isLoading } = useAllTeams(orgId)
  const enrollM = useEnrollTeam(orgId, eventId)

  const handleEnroll = async (teamId: string) => {
    if (enrolledTeamIds.includes(teamId)) return
    setPendingId(teamId)
    try {
      await enrollM.mutateAsync({ teamId })
      toast.success(t('enrollments.enrollTeamSuccess'))
    } catch {
      toast.error(t('enrollments.enrollTeamFailed'))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('enrollments.enrollTeamTitle')}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-2">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !teams || teams.length === 0 ? (
            <EmptyState
              icon={<UsersRound className="h-6 w-6" />}
              title={t('enrollments.noAvailableTeams')}
              className="py-6"
            />
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto -mx-4 px-4">
              {teams.map((team) => {
                const alreadyEnrolled = enrolledTeamIds.includes(team.id)
                const loading = pendingId === team.id

                return (
                  <button
                    key={team.id}
                    onClick={() => handleEnroll(team.id)}
                    disabled={alreadyEnrolled || loading}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors text-left',
                      alreadyEnrolled
                        ? 'opacity-60 cursor-default bg-muted/30'
                        : 'hover:bg-accent active:bg-accent/80 cursor-pointer',
                    )}
                  >
                    <div className="h-9 w-9 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                      <UsersRound className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('enrollments.membersCount', { count: team.membersCount })}
                      </p>
                    </div>
                    {alreadyEnrolled ? (
                      <Badge variant="secondary" className="text-xs">
                        {t('enrollments.alreadyEnrolledTeam')}
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
