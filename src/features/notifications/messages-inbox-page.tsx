import { useParams, useNavigate } from '@tanstack/react-router'
import { MessageSquare, CheckCheck, Bot } from 'lucide-react'
import { useInbox, useUnreadCount, useMarkAllRead } from './use-messages'
import { Button } from '@/shared/components/ui/button'
import { ListSkeleton } from '@/shared/components/loading-skeletons'
import { EmptyState } from '@/shared/components/empty-state'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { formatRelative } from '@/shared/utils/format'
import { cn } from '@/shared/utils/cn'

export function MessagesInboxPage() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const navigate = useNavigate()

  const { data, isLoading, isError, refetch } = useInbox(orgId, { pageSize: 50 })
  const { data: unreadData } = useUnreadCount(orgId)
  const markAllReadMutation = useMarkAllRead(orgId)

  const unreadCount = unreadData?.unreadCount ?? 0

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title="Wiadomości"
          subtitle={unreadCount > 0 ? `${unreadCount} nieprzeczytanych` : undefined}
          action={
            unreadCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                className="gap-1.5 text-xs"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Zaznacz jako przeczytane
              </Button>
            ) : undefined
          }
        />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : data?.items.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-8 w-8" />}
          title="Skrzynka pusta"
          description="Brak wiadomości"
        />
      ) : (
        <div className="divide-y divide-border">
          {data?.items.map((msg) => (
            <button
              key={msg.id}
              onClick={() => navigate({ to: `/app/org/${orgId}/messages/${msg.id}` })}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
            >
              <div className={cn(
                'h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                msg.isAutomatic ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
              )}>
                {msg.isAutomatic ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">
                    {msg.senderDisplayName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    'text-sm truncate',
                    msg.isRead === false ? 'font-semibold' : 'font-medium text-muted-foreground'
                  )}>
                    {msg.subject}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatRelative(msg.sentAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {msg.senderDisplayName}: {msg.body.slice(0, 60)}
                </p>
              </div>
              {msg.isRead === false && (
                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
