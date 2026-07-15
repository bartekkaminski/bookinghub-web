import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ranksApi } from '@/api/endpoints'
import type { CreateRankRequest, UpdateRankRequest } from '@/api/types'

export const rankKeys = {
  all:     (orgId: string) => ['ranks', orgId] as const,
  lists:   (orgId: string) => [...rankKeys.all(orgId), 'list'] as const,
  detail:  (orgId: string, rankId: string) => [...rankKeys.all(orgId), 'detail', rankId] as const,
  members: (orgId: string, rankId: string, page: number) =>
    [...rankKeys.detail(orgId, rankId), 'members', page] as const,
}

export function useRanks(orgId: string) {
  return useQuery({
    queryKey: rankKeys.lists(orgId),
    queryFn:  () => ranksApi.list(orgId),
    enabled:  !!orgId,
  })
}

export function useRank(orgId: string, rankId: string) {
  return useQuery({
    queryKey: rankKeys.detail(orgId, rankId),
    queryFn:  () => ranksApi.getById(orgId, rankId),
    enabled:  !!orgId && !!rankId,
  })
}

export function useRankMembers(orgId: string, rankId: string, page: number, pageSize = 20) {
  return useQuery({
    queryKey: rankKeys.members(orgId, rankId, page),
    queryFn:  () => ranksApi.getMembers(orgId, rankId, page, pageSize),
    enabled:  !!orgId && !!rankId,
    placeholderData: (prev) => prev,
  })
}

export function useCreateRank(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRankRequest) => ranksApi.create(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rankKeys.lists(orgId) })
    },
  })
}

export function useUpdateRank(orgId: string, rankId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateRankRequest) => ranksApi.update(orgId, rankId, data),
    onSuccess: (data) => {
      qc.setQueryData(rankKeys.detail(orgId, rankId), data)
      qc.invalidateQueries({ queryKey: rankKeys.lists(orgId) })
    },
  })
}

export function useDeleteRank(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rankId: string) => ranksApi.delete(orgId, rankId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rankKeys.lists(orgId) })
    },
  })
}
