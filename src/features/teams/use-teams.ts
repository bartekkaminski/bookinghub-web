import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamsApi } from '@/api/endpoints'
import type {
  CreateTeamRequest,
  UpdateTeamRequest,
  AddMemberToTeamRequest,
  AssignTrainerToTeamRequest,
  TeamFilterParams,
} from '@/api/types'

export const teamKeys = {
  all: (orgId: string) => ['teams', orgId] as const,
  lists: (orgId: string) => [...teamKeys.all(orgId), 'list'] as const,
  detail: (orgId: string, teamId: string) => [...teamKeys.all(orgId), 'detail', teamId] as const,
}

export function useTeams(orgId: string, params?: TeamFilterParams) {
  return useQuery({
    queryKey: [...teamKeys.lists(orgId), params],
    queryFn: () => teamsApi.list(orgId, params),
    enabled: !!orgId,
  })
}

export function useAllTeams(orgId: string) {
  return useQuery({
    queryKey: [...teamKeys.all(orgId), 'all'],
    queryFn: () => teamsApi.listAll(orgId),
    enabled: !!orgId,
  })
}

export function useTeam(orgId: string, teamId: string) {
  return useQuery({
    queryKey: teamKeys.detail(orgId, teamId),
    queryFn: () => teamsApi.getById(orgId, teamId),
    enabled: !!orgId && !!teamId,
  })
}

export function useCreateTeam(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTeamRequest) => teamsApi.create(orgId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.lists(orgId) }),
  })
}

export function useUpdateTeam(orgId: string, teamId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateTeamRequest) => teamsApi.update(orgId, teamId, data),
    onSuccess: (data) => {
      qc.setQueryData(teamKeys.detail(orgId, teamId), data)
      qc.invalidateQueries({ queryKey: teamKeys.lists(orgId) })
    },
  })
}

export function useDeleteTeam(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (teamId: string) => teamsApi.delete(orgId, teamId),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.lists(orgId) }),
  })
}

export function useAddMemberToTeam(orgId: string, teamId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AddMemberToTeamRequest) => teamsApi.addMember(orgId, teamId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.detail(orgId, teamId) }),
  })
}

export function useRemoveMemberFromTeam(orgId: string, teamId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => teamsApi.removeMember(orgId, teamId, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.detail(orgId, teamId) }),
  })
}

export function useAssignTrainerToTeam(orgId: string, teamId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AssignTrainerToTeamRequest) => teamsApi.assignTrainer(orgId, teamId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.detail(orgId, teamId) }),
  })
}

export function useRemoveTrainerFromTeam(orgId: string, teamId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (trainerId: string) => teamsApi.removeTrainer(orgId, teamId, trainerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.detail(orgId, teamId) }),
  })
}
