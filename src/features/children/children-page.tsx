import { useTranslation } from 'react-i18next'
import { useRouter } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/auth-store'
import { usePersonChildren } from '@/features/profile/use-person'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { ListSkeleton } from '@/shared/components/loading-skeletons'
import { EmptyState } from '@/shared/components/empty-state'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { getInitials, formatDate } from '@/shared/utils/format'
import { Users2, User, ArrowLeft } from 'lucide-react'

export function ChildrenPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuthStore()
  const personId = user?.personId ?? ''

  const { data: children, isLoading, isError, refetch } = usePersonChildren(personId)

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={t('children.pageTitle')}
          back={
            <Button variant="outline" size="sm" onClick={() => router.history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : children?.length === 0 ? (
        <EmptyState
          icon={<Users2 className="h-8 w-8" />}
          title={t('children.noChildren')}
          description={t('children.noChildrenDesc')}
        />
      ) : (
        <div className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            {t('children.contactAdmin')}
          </p>
          {children?.map((child) => (
            <div
              key={child.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
            >
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={child.photoUrl} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {child.fullName ? getInitials(child.fullName) : <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">
                  {child.fullName ?? '—'}
                </p>
                {child.dateOfBirth && (
                  <p className="text-xs text-muted-foreground">
                    {t('children.bornOn', { date: formatDate(child.dateOfBirth) })}
                  </p>
                )}
                <div className="mt-1">
                  <Badge variant={child.hasAccount ? 'default' : 'secondary'} className="text-xs">
                    {child.hasAccount ? t('children.hasAccount') : t('children.noAccount')}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
