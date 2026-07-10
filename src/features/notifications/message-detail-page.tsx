import { useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Bot } from 'lucide-react'
import { useMessage, useMarkMessageRead } from './use-messages'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { DetailSkeleton } from '@/shared/components/loading-skeletons'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { formatDateTime } from '@/shared/utils/format'

export function MessageDetailPage() {
  const { orgId, messageId } = useParams({ strict: false }) as { orgId: string; messageId: string }
  const navigate = useNavigate()

  const { data: message, isLoading, isError, refetch } = useMessage(orgId, messageId)
  const markReadMutation = useMarkMessageRead(orgId)

  useEffect(() => {
    // Mark as read when opened
    if (message && messageId) {
      markReadMutation.mutate(messageId)
    }
  }, [messageId, message?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <DetailSkeleton />
  if (isError) return <ErrorState onRetry={refetch} />

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title="Wiadomość"
          back={
            <Button variant="outline" size="sm" onClick={() => navigate({ to: `/app/org/${orgId}/messages` })}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
        />
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{message?.subject}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {message?.isAutomatic && (
              <span className="flex items-center gap-1 text-amber-500">
                <Bot className="h-3.5 w-3.5" />
                System
              </span>
            )}
            {!message?.isAutomatic && <span>{message?.senderDisplayName}</span>}
            <span>·</span>
            <span>{message?.sentAt ? formatDateTime(message.sentAt) : ''}</span>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border p-4">
          <p className="text-sm whitespace-pre-wrap">{message?.body}</p>
        </div>

        {(message?.recipients.length ?? 0) > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Odbiorcy</h3>
            <div className="flex flex-wrap gap-2">
              {message?.recipients.map((r) => (
                <div key={r.memberId} className="flex items-center gap-1.5">
                  <span className="text-sm">{r.displayName}</span>
                  {r.isRead && <Badge variant="outline" className="text-xs h-4 px-1">Przeczytano</Badge>}
                </div>
              ))}
            </div>
          </div>
        )}

        {(message?.replies.length ?? 0) > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Odpowiedzi</h3>
            {message?.replies.map((reply) => (
              <div key={reply.id} className="rounded-xl bg-card border border-border p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{reply.senderDisplayName}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(reply.sentAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{reply.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
