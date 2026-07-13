import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi } from '@/api/endpoints'
import type { SendMessageRequest, ReplyMessageRequest, MessageFilterParams } from '@/api/types'

export const messageKeys = {
  all: (orgId: string) => ['messages', orgId] as const,
  inbox: (orgId: string) => [...messageKeys.all(orgId), 'inbox'] as const,
  outbox: (orgId: string) => [...messageKeys.all(orgId), 'outbox'] as const,
  unreadCount: (orgId: string) => [...messageKeys.all(orgId), 'unread-count'] as const,
  detail: (orgId: string, messageId: string) => [...messageKeys.all(orgId), 'detail', messageId] as const,
}

export function useConversations(orgId: string, params?: MessageFilterParams) {
  return useQuery({
    queryKey: [...messageKeys.all(orgId), 'conversations', params],
    queryFn: () => messagesApi.conversations(orgId, params),
    enabled: !!orgId,
    staleTime: 0,
  })
}

export function useInbox(orgId: string, params?: MessageFilterParams) {
  return useQuery({
    queryKey: [...messageKeys.inbox(orgId), params],
    queryFn: () => messagesApi.inbox(orgId, params),
    enabled: !!orgId,
    staleTime: 0, // zawsze odświeżaj przy wejściu na skrzynkę
  })
}

export function useUnreadCount(orgId: string) {
  return useQuery({
    queryKey: messageKeys.unreadCount(orgId),
    queryFn: () => messagesApi.unreadCount(orgId),
    enabled: !!orgId,
    // Brak pollingu — badge jest aktualizowany przez invalidation z SignalR (useAppHub)
  })
}

export function useMessage(orgId: string, messageId: string) {
  return useQuery({
    queryKey: messageKeys.detail(orgId, messageId),
    queryFn: () => messagesApi.getById(orgId, messageId),
    enabled: !!orgId && !!messageId,
    staleTime: 0, // zawsze odświeżaj przy wejściu na wątek
    // Brak refetchInterval — aktualizacje przychodzą przez SignalR (useAppHub)
  })
}

export function useSendMessage(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SendMessageRequest) => messagesApi.send(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.all(orgId) })
    },
  })
}

export function useMarkMessageRead(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) => messagesApi.markRead(orgId, messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.unreadCount(orgId) })
      qc.invalidateQueries({ queryKey: messageKeys.inbox(orgId) })
    },
  })
}

export function useOutbox(orgId: string, params?: MessageFilterParams) {
  return useQuery({
    queryKey: [...messageKeys.outbox(orgId), params],
    queryFn: () => messagesApi.outbox(orgId, params),
    enabled: !!orgId,
    staleTime: 0,
  })
}

export function useReplyMessage(orgId: string, messageId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ReplyMessageRequest) => messagesApi.reply(orgId, messageId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.all(orgId) })
    },
  })
}

export function useDeleteMessage(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) => messagesApi.delete(orgId, messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.all(orgId) })
    },
  })
}

export function useMarkAllRead(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => messagesApi.markAllRead(orgId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.unreadCount(orgId) })
      qc.invalidateQueries({ queryKey: messageKeys.inbox(orgId) })
    },
  })
}
