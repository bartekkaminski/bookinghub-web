import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Bot, Trash2, Loader2, Send, Check, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useMessage, useMarkMessageRead, useReplyMessage, useDeleteMessage } from './use-messages'
import { useAuthStore } from '@/features/auth/auth-store'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { DetailSkeleton } from '@/shared/components/loading-skeletons'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { formatRelative } from '@/shared/utils/format'
import { cn } from '@/shared/utils/cn'
import type { MessageSummaryResponse, MessageRecipientInfo } from '@/api/types'

export function MessageDetailPage() {
  const { orgId, messageId } = useParams({ strict: false }) as { orgId: string; messageId: string }
  const navigate = useNavigate()
  const { t } = useTranslation()
  const getCurrentMembership = useAuthStore((s) => s.getCurrentMembership)
  const currentMemberId = getCurrentMembership()?.memberId

  const [replyText, setReplyText] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: message, isLoading, isError, refetch } = useMessage(orgId, messageId)
  const markReadMutation = useMarkMessageRead(orgId)
  const replyMutation = useReplyMessage(orgId, messageId)
  const deleteMutation = useDeleteMessage(orgId)

  useEffect(() => {
    if (message && messageId) {
      markReadMutation.mutate(messageId)
    }
  }, [messageId, message?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when replies load or new reply added
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [message?.replies.length])

  if (isLoading) return <DetailSkeleton />
  if (isError) return <ErrorState onRetry={refetch} />

  const isSender = message?.senderMemberId === currentMemberId
  const canReply = !message?.isAutomatic

  // Build unified thread: original message + all replies in order
  const thread: Array<{ id: string; senderId: string; senderName: string; body: string; sentAt: string; isAutomatic: boolean }> = []

  if (message) {
    thread.push({
      id: message.id,
      senderId: message.senderMemberId,
      senderName: message.isAutomatic ? t('messages.systemSender') : message.senderName,
      body: message.body,
      sentAt: message.sentAt,
      isAutomatic: message.isAutomatic,
    })
    message.replies.forEach((reply: MessageSummaryResponse) => {
      thread.push({
        id: reply.id,
        senderId: reply.senderMemberId,
        senderName: reply.senderName,
        body: reply.bodyPreview,
        sentAt: reply.sentAt,
        isAutomatic: reply.isAutomatic,
      })
    })
  }

  // Group consecutive messages from the same sender
  const groupedThread = thread.map((msg, idx) => ({
    ...msg,
    isFirst: idx === 0 || thread[idx - 1].senderId !== msg.senderId,
    isLast: idx === thread.length - 1 || thread[idx + 1].senderId !== msg.senderId,
  }))

  const handleReply = async () => {
    if (!replyText.trim()) return
    try {
      await replyMutation.mutateAsync({ body: replyText.trim() })
      toast.success(t('messages.replySent'))
      setReplyText('')
    } catch {
      toast.error(t('messages.replyFailed'))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleReply()
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(messageId)
      toast.success(t('messages.deleted'))
      navigate({ to: `/app/org/${orgId}/messages` })
    } catch {
      toast.error(t('messages.deleteFailed'))
    }
  }

  // Determine participants for header subtitle
  const recipientNames = message?.recipients.map((r) => r.displayName) ?? []
  const participantLine = isSender
    ? recipientNames.slice(0, 3).join(', ') + (recipientNames.length > 3 ? ` +${recipientNames.length - 3}` : '')
    : message?.senderName ?? ''

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={message?.subject || t('messages.noSubject')}
          subtitle={participantLine}
          back={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: `/app/org/${orgId}/messages` })}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
          action={
            isSender ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : undefined
          }
        />
      </div>

      {/* Messages thread — scrollable */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {groupedThread.map((msg) => {
          const isMe = msg.senderId === currentMemberId
          const isSystem = msg.isAutomatic

          return (
            <div
              key={msg.id}
              className={cn(
                'flex flex-col',
                isMe ? 'items-end' : 'items-start',
              )}
            >
              {/* Sender name — show only on first bubble in group, and only for others */}
              {!isMe && !isSystem && msg.isFirst && (
                <span className="text-xs text-muted-foreground px-3 mb-0.5 font-medium">
                  {msg.senderName}
                </span>
              )}
              {isSystem && msg.isFirst && (
                <span className="text-xs text-amber-500 px-3 mb-0.5 flex items-center gap-1 font-medium">
                  <Bot className="h-3 w-3" />
                  {msg.senderName}
                </span>
              )}

              {/* Bubble */}
              <div
                className={cn(
                  'max-w-[78%] px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words',
                  // Shape: round corners, flat on connecting side
                  isMe
                    ? cn(
                        'bg-primary text-primary-foreground',
                        msg.isFirst && msg.isLast && 'rounded-2xl rounded-br-sm',
                        msg.isFirst && !msg.isLast && 'rounded-t-2xl rounded-bl-2xl rounded-br-sm',
                        !msg.isFirst && msg.isLast && 'rounded-b-2xl rounded-tl-2xl rounded-tr-sm',
                        !msg.isFirst && !msg.isLast && 'rounded-l-2xl rounded-r-sm',
                      )
                    : cn(
                        isSystem
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'bg-muted text-foreground',
                        msg.isFirst && msg.isLast && 'rounded-2xl rounded-bl-sm',
                        msg.isFirst && !msg.isLast && 'rounded-t-2xl rounded-br-2xl rounded-bl-sm',
                        !msg.isFirst && msg.isLast && 'rounded-b-2xl rounded-tr-2xl rounded-tl-sm',
                        !msg.isFirst && !msg.isLast && 'rounded-r-2xl rounded-l-sm',
                      ),
                )}
              >
                {msg.body}
              </div>

              {/* Timestamp — show only on last bubble in group */}
              {msg.isLast && (
                <span className="text-[11px] text-muted-foreground px-1 mt-0.5">
                  {formatRelative(msg.sentAt)}
                </span>
              )}

              {/* Read receipts — only on last bubble of sender = me */}
              {isMe && msg.isLast && (
                <ReadReceipt
                  messageId={msg.id}
                  originalMessageId={message?.id}
                  recipients={message?.recipients ?? []}
                />
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply input — pinned to bottom */}
      {canReply && (
        <div className="flex-shrink-0 border-t border-border bg-background px-3 py-2 flex items-end gap-2">
          <Textarea
            placeholder={t('messages.replyPlaceholder')}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={5000}
            className="resize-none min-h-[40px] max-h-32 overflow-y-auto flex-1 text-sm"
          />
          <Button
            size="icon"
            onClick={handleReply}
            disabled={!replyText.trim() || replyMutation.isPending}
            className="h-10 w-10 flex-shrink-0 rounded-full"
          >
            {replyMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Delete confirm drawer */}
      <Drawer open={deleteConfirmOpen} onOpenChange={(v) => !v && setDeleteConfirmOpen(false)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('messages.deleteBtn')}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <p className="text-sm text-muted-foreground">
              {message?.subject ? `„${message.subject}"` : t('messages.noSubject')}
            </p>
          </div>
          <DrawerFooter>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="w-full"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('messages.deleteBtn')}
            </Button>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="w-full">
              {t('common.cancel')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

// ─── ReadReceipt ──────────────────────────────────────────────────────────────

function ReadReceipt({
  messageId,
  originalMessageId,
  recipients,
}: {
  messageId: string
  originalMessageId: string | undefined
  recipients: MessageRecipientInfo[]
}) {
  const { t } = useTranslation()

  // For replies (messageId !== originalMessageId) we only know it was sent
  const isReply = messageId !== originalMessageId

  if (isReply || recipients.length === 0) {
    // Single check — sent/delivered
    return (
      <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground px-1">
        <Check className="h-3 w-3" />
      </span>
    )
  }

  const readCount = recipients.filter((r) => r.isRead).length
  const allRead = readCount === recipients.length
  const someRead = readCount > 0

  if (allRead) {
    return (
      <span className="flex items-center gap-0.5 text-[11px] text-primary px-1" title={t('messages.readBadge')}>
        <CheckCheck className="h-3 w-3" />
        {recipients.length > 1 && (
          <span>{readCount}/{recipients.length}</span>
        )}
      </span>
    )
  }

  if (someRead) {
    return (
      <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground px-1" title={t('messages.readBadge')}>
        <CheckCheck className="h-3 w-3" />
        <span>{readCount}/{recipients.length}</span>
      </span>
    )
  }

  // No one read yet — single check (delivered)
  return (
    <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground px-1">
      <Check className="h-3 w-3" />
    </span>
  )
}
