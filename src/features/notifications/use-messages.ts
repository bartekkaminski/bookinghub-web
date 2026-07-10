import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi } from '@/api/endpoints'
import type { SendMessageRequest, MessageFilterParams } from '@/api/types'

export const messageKeys = {
  all: (orgId: string) => ['messages', orgId] as const,
  inbox: (orgId: string) => [...messageKeys.all(orgId), 'inbox'] as const,
  unreadCount: (orgId: string) => [...messageKeys.all(orgId), 'unread-count'] as const,
  detail: (orgId: string, messageId: string) => [...messageKeys.all(orgId), 'detail', messageId] as const,
}

export function useInbox(orgId: string, params?: MessageFilterParams) {
  return useQuery({
    queryKey: [...messageKeys.inbox(orgId), params],
    queryFn: () => messagesApi.inbox(orgId, params),
    enabled: !!orgId,
  })
}

export function useUnreadCount(orgId: string) {
  return useQuery({
    queryKey: messageKeys.unreadCount(orgId),
    queryFn: () => messagesApi.unreadCount(orgId),
    enabled: !!orgId,
    refetchInterval: 60_000, // poll every minute
  })
}

export function useMessage(orgId: string, messageId: string) {
  return useQuery({
    queryKey: messageKeys.detail(orgId, messageId),
    queryFn: () => messagesApi.getById(orgId, messageId),
    enabled: !!orgId && !!messageId,
  })
}

export function useSendMessage(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SendMessageRequest) => messagesApi.send(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.inbox(orgId) })
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
