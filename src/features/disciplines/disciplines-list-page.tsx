import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Plus, Layers, ChevronRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useDisciplines, useCreateDiscipline } from './use-disciplines'
import { DisciplineFormDrawer } from './discipline-form-drawer'
import { Button } from '@/shared/components/ui/button'
import { ListSkeleton } from '@/shared/components/loading-skeletons'
import { EmptyState } from '@/shared/components/empty-state'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import type { CreateDisciplineRequest, DisciplineSummaryResponse } from '@/api/types'

export function DisciplinesListPage() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const navigate = useNavigate()
  const { isAdmin } = useAuthStore()
  const { t } = useTranslation()
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useDisciplines(orgId)
  const createMutation = useCreateDiscipline(orgId)

  const handleCreate = async (data: CreateDisciplineRequest) => {
    try {
      await createMutation.mutateAsync(data)
      setCreateOpen(false)
      toast.success(t('disciplines.created'))
    } catch {
      toast.error(t('disciplines.createFailed'))
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={t('disciplines.title')}
          back={
            <Button variant="outline" size="sm" onClick={() => navigate({ to: `/app/org/${orgId}/dashboard` })}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
          action={
            isAdmin() ? (
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />
                {t('common.add')}
              </Button>
            ) : undefined
          }
        />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Layers className="h-8 w-8" />}
          title={t('disciplines.noDisciplines')}
          description={t('disciplines.noDisciplinesDesc')}
          action={
            isAdmin() ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                {t('disciplines.createDiscipline')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {data?.map((discipline) => (
            <DisciplineRow
              key={discipline.id}
              discipline={discipline}
              onClick={() => navigate({ to: `/app/org/${orgId}/disciplines/${discipline.id}` })}
            />
          ))}
        </div>
      )}

      <DisciplineFormDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
        title={t('disciplines.newDiscipline')}
      />
    </div>
  )
}

function DisciplineRow({ discipline, onClick }: { discipline: DisciplineSummaryResponse; onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
    >
      <div
        className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
        style={{ backgroundColor: discipline.color ?? '#475569' }}
      >
        {discipline.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm truncate block">{discipline.name}</span>
        <span className="text-xs text-muted-foreground">
          {t('disciplines.rankCount', { count: discipline.rankCount })}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </button>
  )
}
