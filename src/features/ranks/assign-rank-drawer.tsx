import { useState } from 'react'
import { Loader2, Medal } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useRanks } from './use-ranks'
import { useSetMemberRank } from '@/features/members/use-members'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'

interface AssignRankDrawerProps {
  open: boolean
  onClose: () => void
  orgId: string
  memberId: string
  disciplineId: string
  disciplineName: string
  currentRankId?: string
}

export function AssignRankDrawer({
  open,
  onClose,
  orgId,
  memberId,
  disciplineId,
  disciplineName,
  currentRankId,
}: AssignRankDrawerProps) {
  const { t } = useTranslation()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const { data: ranks, isLoading } = useRanks(orgId, disciplineId)
  const setRankMutation = useSetMemberRank(orgId, memberId, disciplineId)

  const handleAssign = async (rankId: string | null) => {
    if (rankId === currentRankId) {
      onClose()
      return
    }

    setPendingId(rankId ?? '__none__')
    try {
      await setRankMutation.mutateAsync({ rankId })
      toast.success(
        rankId ? t('ranks.rankAssigned') : t('ranks.rankRemoved')
      )
      onClose()
    } catch {
      toast.error(t('ranks.assignFailed'))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('ranks.assignRankTitle', { discipline: disciplineName })}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto -mx-4 px-4">
              {/* Opcja: brak rangi */}
              <button
                onClick={() => handleAssign(null)}
                disabled={pendingId !== null}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors text-left ${
                  !currentRankId
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-accent cursor-pointer'
                }`}
              >
                <div className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-muted">
                  <Medal className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="flex-1 text-sm font-medium">{t('ranks.noRank')}</span>
                {!currentRankId && (
                  <Badge variant="secondary" className="text-xs gap-1">✓</Badge>
                )}
                {pendingId === '__none__' && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </button>

              {/* Lista rang w tej dyscyplinie */}
              {(ranks ?? []).map((rank) => {
                const isCurrent = rank.id === currentRankId
                const isAssigning = pendingId === rank.id
                return (
                  <button
                    key={rank.id}
                    onClick={() => handleAssign(rank.id)}
                    disabled={pendingId !== null}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors text-left ${
                      isCurrent
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-accent cursor-pointer'
                    }`}
                  >
                    <div
                      className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: rank.color ?? '#475569' }}
                    >
                      {rank.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium">{rank.name}</span>
                    {isCurrent && !isAssigning && (
                      <Badge variant="secondary" className="text-xs gap-1">✓</Badge>
                    )}
                    {isAssigning && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </button>
                )
              })}

              {(ranks?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t('ranks.noRanksAvailable')}
                </p>
              )}
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
