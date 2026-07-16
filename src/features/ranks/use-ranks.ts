import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ranksApi } from '@/api/endpoints'
import type { CreateRankRequest, UpdateRankRequest } from '@/api/types'

export const rankKeys = {
  all:     (orgId: string, disciplineId: string) => ['ranks', orgId, disciplineId] as const,
  lists:   (orgId: string, disciplineId: string) => [...rankKeys.all(orgId, disciplineId), 'list'] as const,
  detail:  (orgId: string, disciplineId: string, rankId: string) =>
    [...rankKeys.all(orgId, disciplineId), 'detail', rankId] as const,
  members: (orgId: string, disciplineId: string, rankId: string, page: number) =>
    [...rankKeys.detail(orgId, disciplineId, rankId), 'members', page] as const,
}

export function useRanks(orgId: string, disciplineId: string) {
  return useQuery({
    queryKey: rankKeys.lists(orgId, disciplineId),
    queryFn:  () => ranksApi.list(orgId, disciplineId),
    enabled:  !!orgId && !!disciplineId,
  })
}

export function useRank(orgId: string, disciplineId: string, rankId: string) {
  return useQuery({
    queryKey: rankKeys.detail(orgId, disciplineId, rankId),
    queryFn:  () => ranksApi.getById(orgId, disciplineId, rankId),
    enabled:  !!orgId && !!disciplineId && !!rankId,
  })
}

export function useRankMembers(orgId: string, disciplineId: string, rankId: string, page: number, pageSize = 20) {
  return useQuery({
    queryKey: rankKeys.members(orgId, disciplineId, rankId, page),
    queryFn:  () => ranksApi.getMembers(orgId, disciplineId, rankId, page, pageSize),
    enabled:  !!orgId && !!disciplineId && !!rankId,
    placeholderData: (prev) => prev,
  })
}

export function useCreateRank(orgId: string, disciplineId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRankRequest) => ranksApi.create(orgId, disciplineId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rankKeys.lists(orgId, disciplineId) })
      qc.invalidateQueries({ queryKey: ['disciplines', orgId] })
    },
  })
}

export function useUpdateRank(orgId: string, disciplineId: string, rankId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateRankRequest) => ranksApi.update(orgId, disciplineId, rankId, data),
    onSuccess: (data) => {
      qc.setQueryData(rankKeys.detail(orgId, disciplineId, rankId), data)
      qc.invalidateQueries({ queryKey: rankKeys.lists(orgId, disciplineId) })
    },
  })
}

export function useDeleteRank(orgId: string, disciplineId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (rankId: string) => ranksApi.delete(orgId, disciplineId, rankId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rankKeys.lists(orgId, disciplineId) })
      qc.invalidateQueries({ queryKey: ['disciplines', orgId] })
    },
  })
}
