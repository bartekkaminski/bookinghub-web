import { useState } from 'react'
import { useParams, useNavigate, useRouter } from '@tanstack/react-router'
import { MessageSquare, CheckCheck, Bot, Plus, Loader2, X, Search, ArrowUpRight, ArrowDownLeft, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useConversations, useUnreadCount, useMarkAllRead, useSendMessage } from './use-messages'
import { useMembers } from '@/features/members/use-members'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import { ListSkeleton } from '@/shared/components/loading-skeletons'
import { EmptyState } from '@/shared/components/empty-state'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { formatRelative } from '@/shared/utils/format'
import { cn } from '@/shared/utils/cn'
import type { SendMessageRequest, MemberSummaryResponse } from '@/api/types'

export function MessagesInboxPage() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const navigate = useNavigate()
  const router = useRouter()
  const { t } = useTranslation()

  const [composeOpen, setComposeOpen] = useState(false)

  const conversationsQuery = useConversations(orgId, { pageSize: 50 })
  const { data: unreadData } = useUnreadCount(orgId)
  const markAllReadMutation = useMarkAllRead(orgId)

  const unreadCount = unreadData?.unreadCount ?? 0

  const handleItemClick = (msgId: string) => {
    navigate({ to: `/org/${orgId}/messages/${msgId}` })
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={t('nav.messages')}
          back={
            <Button variant="outline" size="sm" onClick={() => router.history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
          action={
            <Button size="sm" onClick={() => setComposeOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              {t('messages.compose')}
            </Button>
          }
        />

        {unreadCount > 0 && (
          <div className="px-4 py-2 flex items-center justify-between border-b border-border">
            <span className="text-xs text-muted-foreground">
              {t('messages.unreadCount', { count: unreadCount })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="gap-1.5 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t('messages.markAllRead')}
            </Button>
          </div>
        )}
      </div>

      {conversationsQuery.isLoading ? (
        <ListSkeleton />
      ) : conversationsQuery.isError ? (
        <ErrorState onRetry={conversationsQuery.refetch} />
      ) : conversationsQuery.data?.items.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-8 w-8" />}
          title={t('messages.emptyInbox')}
          description={t('messages.emptyInboxDesc')}
          action={
            <Button size="sm" onClick={() => setComposeOpen(true)}>
              {t('messages.compose')}
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {conversationsQuery.data?.items.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleItemClick(conv.id)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
            >
              {/* Avatar */}
              <div className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative',
                conv.isAutomatic ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
              )}>
                {conv.isAutomatic ? (
                  <Bot className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-bold">
                    {(conv.otherPartyName ?? '??').slice(0, 2).toUpperCase()}
                  </span>
                )}
                {/* Sent/received indicator */}
                {!conv.isAutomatic && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-background flex items-center justify-center">
                    {conv.initiatedByMe
                      ? <ArrowUpRight className="h-2.5 w-2.5 text-muted-foreground" />
                      : <ArrowDownLeft className="h-2.5 w-2.5 text-primary" />
                    }
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    'text-sm truncate',
                    conv.hasUnread ? 'font-semibold' : 'font-medium text-muted-foreground'
                  )}>
                    {conv.otherPartyName || t('messages.unknownSender')}
                  </span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatRelative(conv.lastMessageAt)}
                  </span>
                </div>

                <p className={cn(
                  'text-xs truncate mt-0.5',
                  conv.hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}>
                  {conv.subject || t('messages.noSubject')}
                </p>

                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {conv.repliesCount > 0
                    ? `${conv.lastSenderName}: ${conv.lastMessagePreview}`
                    : conv.lastMessagePreview}
                </p>
              </div>

              {/* Unread badge */}
              {conv.hasUnread && (
                <div className="flex-shrink-0 mt-1">
                  {conv.unreadCount > 1 ? (
                    <Badge className="h-5 min-w-5 px-1.5 text-[10px]">{conv.unreadCount}</Badge>
                  ) : (
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <ComposeDrawer
        orgId={orgId}
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
      />
    </div>
  )
}

// ─── ComposeDrawer ────────────────────────────────────────────────────────────

function ComposeDrawer({
  orgId,
  open,
  onClose,
}: {
  orgId: string
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<MemberSummaryResponse[]>([])
  const [recipientSearch, setRecipientSearch] = useState('')

  const sendMutation = useSendMessage(orgId)
  const { data: membersData } = useMembers(orgId, { pageSize: 200 })

  const filteredMembers = (membersData?.items ?? []).filter((m) => {
    const name = m.displayName?.toLowerCase() ?? ''
    const q = recipientSearch.toLowerCase()
    return name.includes(q)
  })

  const toggleMember = (member: MemberSummaryResponse) => {
    setSelectedMembers((prev) =>
      prev.some((m) => m.id === member.id)
        ? prev.filter((m) => m.id !== member.id)
        : [...prev, member]
    )
  }

  const removeSelected = (memberId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== memberId))
  }

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || selectedMembers.length === 0) return
    const payload: SendMessageRequest = {
      subject: subject.trim(),
      body: body.trim(),
      recipientMemberIds: selectedMembers.map((m) => m.id),
    }
    try {
      await sendMutation.mutateAsync(payload)
      toast.success(t('messages.sent'))
      setSubject('')
      setBody('')
      setSelectedMembers([])
      setRecipientSearch('')
      onClose()
    } catch {
      toast.error(t('messages.sendFailed'))
    }
  }

  const handleClose = () => {
    setSubject('')
    setBody('')
    setSelectedMembers([])
    setRecipientSearch('')
    onClose()
  }

  const canSend =
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    selectedMembers.length > 0 &&
    !sendMutation.isPending

  return (
    <Drawer open={open} onOpenChange={(v) => !v && handleClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('messages.newMessage')}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Recipients */}
          <div className="space-y-2">
            <Label>{t('messages.recipientsLabel')}</Label>

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1">
                {selectedMembers.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    {m.displayName}
                    <button
                      type="button"
                      onClick={() => removeSelected(m.id)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t('messages.recipientsPlaceholder')}
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
              />
            </div>

            <div className="rounded-xl border border-border overflow-hidden max-h-44 overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {t('members.noAvailablePersons')}
                </p>
              ) : (
                filteredMembers.map((member) => {
                  const isSelected = selectedMembers.some((m) => m.id === member.id)
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors text-sm',
                        'hover:bg-accent border-b border-border last:border-b-0',
                        isSelected && 'bg-primary/5'
                      )}
                    >
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: member.color ?? '#6d28d9' }}
                      >
                        {(member.displayName ?? '??').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="flex-1 truncate">{member.displayName}</span>
                      {isSelected && (
                        <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
            {selectedMembers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('messages.selectedCount', { count: selectedMembers.length })}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>{t('messages.subjectLabel')}</Label>
            <Input
              placeholder={t('messages.subjectPlaceholder')}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>{t('messages.bodyLabel')}</Label>
            <Textarea
              placeholder={t('messages.bodyPlaceholder')}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground text-right">{body.length}/5000</p>
          </div>
        </div>

        <DrawerFooter>
          <Button onClick={handleSend} disabled={!canSend} className="w-full">
            {sendMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('messages.send')}
          </Button>
          <Button variant="outline" onClick={handleClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
