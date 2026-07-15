import { useState, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Plus, Medal, ChevronRight, ArrowLeft, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useRanks, useCreateRank } from './use-ranks'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { ListSkeleton } from '@/shared/components/loading-skeletons'
import { EmptyState } from '@/shared/components/empty-state'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import type { CreateRankRequest, UpdateRankRequest, RankSummaryResponse } from '@/api/types'

const COLOR_PALETTE = [
  '#6d28d9', '#2563eb', '#059669', '#dc2626',
  '#d97706', '#db2777', '#0891b2', '#65a30d',
  '#7c3aed', '#475569',
]

// ─── List Page ────────────────────────────────────────────────────────────────

export function RanksListPage() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const navigate = useNavigate()
  const { isAdmin } = useAuthStore()
  const { t } = useTranslation()
  const [createOpen, setCreateOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useRanks(orgId)
  const createMutation = useCreateRank(orgId)

  const handleCreate = async (data: CreateRankRequest) => {
    try {
      await createMutation.mutateAsync(data)
      setCreateOpen(false)
      toast.success(t('ranks.created'))
    } catch {
      toast.error(t('ranks.createFailed'))
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={t('ranks.title')}
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
          icon={<Medal className="h-8 w-8" />}
          title={t('ranks.noRanks')}
          description={t('ranks.noRanksDesc')}
          action={
            isAdmin() ? (
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                {t('ranks.createRank')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {data?.map((rank) => (
            <RankRow
              key={rank.id}
              rank={rank}
              onClick={() => navigate({ to: `/app/org/${orgId}/ranks/${rank.id}` })}
            />
          ))}
        </div>
      )}

      <RankFormDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
        title={t('ranks.newRank')}
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
        className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
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

// ─── Rank Form Drawer (reused by detail page for edit) ────────────────────────

export function RankFormDrawer({
  open,
  onClose,
  onSubmit,
  isLoading,
  title,
  initialData,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateRankRequest | UpdateRankRequest) => void
  isLoading: boolean
  title: string
  initialData?: { name: string; color?: string }
  onDelete?: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialData?.name ?? '')
  const [color, setColor] = useState<string | undefined>(initialData?.color)

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '')
      setColor(initialData?.color)
    }
  }, [open, initialData?.name, initialData?.color])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), color: color ?? undefined })
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="px-4 space-y-4">
          <div className="space-y-2">
            <Label>{t('ranks.nameLabel')}</Label>
            <Input
              placeholder={t('ranks.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>
              {t('common.color')}{' '}
              <span className="text-muted-foreground text-xs">{t('common.optional')}</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(color === c ? undefined : c)}
                  className={`w-9 h-9 rounded-lg border-2 transition-all ${
                    color === c
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
            {color && (
              <button
                type="button"
                onClick={() => setColor(undefined)}
                className="text-xs text-muted-foreground underline"
              >
                {t('ranks.clearColor')}
              </button>
            )}
          </div>
        </form>
        <DrawerFooter>
          <Button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={!name.trim() || isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {initialData ? t('common.save') : t('ranks.createBtn')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.cancel')}
          </Button>
          {onDelete && (
            <Button variant="ghost" onClick={onDelete} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4 mr-2" />{t('ranks.deleteRank')}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
