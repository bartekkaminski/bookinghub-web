import { useState } from 'react'
import { useParams, useNavigate, useRouter } from '@tanstack/react-router'
import { Plus, ChevronRight, ArrowLeft, Edit, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useDiscipline, useUpdateDiscipline, useDeleteDiscipline } from './use-disciplines'
import { DisciplineFormDrawer } from './discipline-form-drawer'
import { useRanks, useCreateRank } from '@/features/ranks/use-ranks'
import { RankFormDrawer } from '@/features/ranks/rank-form-drawer'
import { Button } from '@/shared/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { ListSkeleton, DetailSkeleton } from '@/shared/components/loading-skeletons'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import type { CreateRankRequest, RankSummaryResponse, UpdateDisciplineRequest } from '@/api/types'

export function DisciplineDetailPage() {
  const { orgId, disciplineId } = useParams({ strict: false }) as { orgId: string; disciplineId: string }
  const router = useRouter()
  const navigate = useNavigate()
  const { isAdmin } = useAuthStore()
  const { t } = useTranslation()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [createRankOpen, setCreateRankOpen] = useState(false)

  const { data: discipline, isLoading, isError, refetch } = useDiscipline(orgId, disciplineId)
  const { data: ranks, isLoading: ranksLoading } = useRanks(orgId, disciplineId)
  const updateMutation = useUpdateDiscipline(orgId, disciplineId)
  const deleteMutation = useDeleteDiscipline(orgId)
  const createRankMutation = useCreateRank(orgId, disciplineId)

  const handleUpdate = async (data: UpdateDisciplineRequest) => {
    try {
      await updateMutation.mutateAsync(data)
      setEditOpen(false)
      toast.success(t('disciplines.updated'))
    } catch {
      toast.error(t('disciplines.updateFailed'))
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(disciplineId)
      toast.success(t('disciplines.deleted'))
      navigate({ to: `/org/${orgId}/disciplines`, replace: true })
    } catch {
      toast.error(t('disciplines.deleteHasRanks'))
    }
  }

  const handleCreateRank = async (data: CreateRankRequest) => {
    try {
      await createRankMutation.mutateAsync(data)
      setCreateRankOpen(false)
      toast.success(t('ranks.created'))
    } catch {
      toast.error(t('ranks.createFailed'))
    }
  }

  if (isLoading) return <DetailSkeleton />
  if (isError) return <ErrorState onRetry={refetch} />

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={discipline?.name ?? t('disciplines.title')}
          back={
            <Button variant="outline" size="sm" onClick={() => router.history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
          action={
            isAdmin() ? (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
                <Edit className="h-4 w-4" />
                {t('common.edit')}
              </Button>
            ) : undefined
          }
        />
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-1">
          {isAdmin() && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setCreateRankOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t('ranks.createRank')}
            </Button>
          )}

          <p className="text-xs text-muted-foreground px-1 mb-1 pt-2">{t('disciplines.ranksSection')}</p>

          {ranksLoading ? (
            <ListSkeleton />
          ) : (ranks?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground px-1 pt-1">{t('ranks.noRanksDesc')}</p>
          ) : (
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {ranks?.map((rank) => (
                <RankRow
                  key={rank.id}
                  rank={rank}
                  onClick={() => navigate({ to: `/org/${orgId}/disciplines/${disciplineId}/ranks/${rank.id}` })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isAdmin() && discipline && (
        <DisciplineFormDrawer
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
          title={t('disciplines.editTitle')}
          initialData={{ name: discipline.name, color: discipline.color }}
          onDelete={() => { setEditOpen(false); setDeleteOpen(true) }}
        />
      )}

      <RankFormDrawer
        open={createRankOpen}
        onClose={() => setCreateRankOpen(false)}
        onSubmit={handleCreateRank}
        isLoading={createRankMutation.isPending}
        title={t('ranks.newRank')}
      />

      <DeleteDisciplineDrawer
        open={deleteOpen}
        disciplineName={discipline?.name ?? ''}
        hasRanks={(discipline?.rankCount ?? 0) > 0}
        onClose={() => setDeleteOpen(false)}
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function RankRow({ rank, onClick }: { rank: RankSummaryResponse; onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
    >
      <div
        className="h-9 w-9 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
        style={{ backgroundColor: rank.color ?? '#475569' }}
      >
        {rank.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm truncate block">{rank.name}</span>
        <span className="text-xs text-muted-foreground">
          {t('ranks.memberCount', { count: rank.memberCount })}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </button>
  )
}

function DeleteDisciplineDrawer({
  open,
  disciplineName,
  hasRanks,
  onClose,
  isLoading,
  onConfirm,
}: {
  open: boolean
  disciplineName: string
  hasRanks: boolean
  onClose: () => void
  isLoading: boolean
  onConfirm: () => void
}) {
  const { t } = useTranslation()
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('disciplines.deleteConfirmTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-3">
            <span className="text-sm font-medium">{disciplineName}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {hasRanks ? t('disciplines.deleteBlockedHasRanks') : t('disciplines.deleteConfirmDesc', { name: disciplineName })}
          </p>
        </div>
        <DrawerFooter>
          <Button
            variant="destructive"
            className="w-full"
            disabled={isLoading || hasRanks}
            onClick={onConfirm}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('disciplines.deleteBtn')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
