import { useState } from 'react'
import { useParams, useRouter, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft, Edit, Users, ChevronLeft, ChevronRight as ChevronRightIcon,
  Loader2, Medal,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useRank, useRankMembers, useUpdateRank, useDeleteRank } from './use-ranks'
import { RankFormDrawer } from './ranks-list-page'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { DetailSkeleton } from '@/shared/components/loading-skeletons'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { EmptyState } from '@/shared/components/empty-state'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { getInitials } from '@/shared/utils/format'
import type { UpdateRankRequest } from '@/api/types'

const PAGE_SIZE = 20

export function RankDetailPage() {
  const { orgId, rankId } = useParams({ strict: false }) as { orgId: string; rankId: string }
  const router = useRouter()
  const navigate = useNavigate()
  const { isAdmin } = useAuthStore()
  const { t } = useTranslation()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [page, setPage] = useState(1)

  const { data: rank, isLoading, isError, refetch } = useRank(orgId, rankId)
  const { data: membersPage, isLoading: membersLoading } = useRankMembers(orgId, rankId, page, PAGE_SIZE)
  const updateMutation = useUpdateRank(orgId, rankId)
  const deleteMutation = useDeleteRank(orgId)

  const handleUpdate = async (data: UpdateRankRequest) => {
    try {
      await updateMutation.mutateAsync(data)
      setEditOpen(false)
      toast.success(t('ranks.updated'))
    } catch {
      toast.error(t('ranks.updateFailed'))
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(rankId)
      toast.success(t('ranks.deleted'))
      navigate({ to: `/app/org/${orgId}/ranks`, replace: true })
    } catch {
      toast.error(t('ranks.deleteFailed'))
    }
  }

  if (isLoading) return <DetailSkeleton />
  if (isError) return <ErrorState onRetry={refetch} />

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={rank?.name ?? t('ranks.title')}
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
        {/* Info block */}
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: rank?.color ?? '#475569' }}
          >
            {rank?.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold">{rank?.name}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {t('ranks.memberCount', { count: rank?.memberCount ?? 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* Members list */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground px-1">{t('ranks.membersSection')}</p>

          {membersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (membersPage?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Medal className="h-6 w-6" />}
              title={t('ranks.noMembersInRank')}
              className="py-8"
            />
          ) : (
            <>
              <div className="space-y-1">
                {membersPage?.items.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => navigate({ to: `/app/org/${orgId}/members/${member.id}` })}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-accent transition-colors text-left"
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarImage src={member.photoUrl} />
                      <AvatarFallback
                        style={member.color ? { backgroundColor: member.color } : undefined}
                        className={!member.color ? 'bg-primary/20 text-primary text-xs' : 'text-white text-xs'}
                      >
                        {getInitials(member.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium">{member.displayName}</span>
                    {!member.isActive && (
                      <Badge variant="secondary" className="text-xs">{t('members.inactiveBadge')}</Badge>
                    )}
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {(membersPage?.totalPages ?? 1) > 1 && (
                <div className="flex items-center justify-between pt-3 px-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={!membersPage?.hasPreviousPage}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('common.previous')}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {t('common.pageOf', { page, totalPages: membersPage?.totalPages ?? 1 })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!membersPage?.hasNextPage}
                    className="gap-1"
                  >
                    {t('common.next')}
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit drawer */}
      {isAdmin() && rank && (
        <RankFormDrawer
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
          title={t('ranks.editTitle')}
          initialData={{ name: rank.name, color: rank.color }}
          onDelete={() => { setEditOpen(false); setDeleteOpen(true) }}
        />
      )}

      {/* Delete confirm drawer */}
      <DeleteRankDrawer
        open={deleteOpen}
        rankName={rank?.name ?? ''}
        onClose={() => setDeleteOpen(false)}
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function DeleteRankDrawer({
  open,
  rankName,
  onClose,
  isLoading,
  onConfirm,
}: {
  open: boolean
  rankName: string
  onClose: () => void
  isLoading: boolean
  onConfirm: () => void
}) {
  const { t } = useTranslation()
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('ranks.deleteConfirmTitle')}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-3">
            <Medal className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium">{rankName}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('ranks.deleteConfirmDesc', { name: rankName })}
          </p>
        </div>
        <DrawerFooter>
          <Button
            variant="destructive"
            className="w-full"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('ranks.deleteBtn')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
