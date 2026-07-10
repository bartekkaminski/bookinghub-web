import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/endpoints'
import type {
  CreateGroupRequest,
  UpdateGroupRequest,
  AddMemberToGroupRequest,
  AddTeamToGroupRequest,
  GroupFilterParams,
} from '@/api/types'

export const groupKeys = {
  all: (orgId: string) => ['groups', orgId] as const,
  lists: (orgId: string) => [...groupKeys.all(orgId), 'list'] as const,
  detail: (orgId: string, groupId: string) => [...groupKeys.all(orgId), 'detail', groupId] as const,
}

export function useGroups(orgId: string, params?: GroupFilterParams) {
  return useQuery({
    queryKey: [...groupKeys.lists(orgId), params],
    queryFn: () => groupsApi.list(orgId, params),
    enabled: !!orgId,
  })
}

export function useGroup(orgId: string, groupId: string) {
  return useQuery({
    queryKey: groupKeys.detail(orgId, groupId),
    queryFn: () => groupsApi.getById(orgId, groupId),
    enabled: !!orgId && !!groupId,
  })
}

export function useCreateGroup(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateGroupRequest) => groupsApi.create(orgId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.lists(orgId) }),
  })
}

export function useUpdateGroup(orgId: string, groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateGroupRequest) => groupsApi.update(orgId, groupId, data),
    onSuccess: (data) => {
      qc.setQueryData(groupKeys.detail(orgId, groupId), data)
      qc.invalidateQueries({ queryKey: groupKeys.lists(orgId) })
    },
  })
}

export function useDeleteGroup(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.delete(orgId, groupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.lists(orgId) }),
  })
}

export function useAddMemberToGroup(orgId: string, groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AddMemberToGroupRequest) => groupsApi.addMember(orgId, groupId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.detail(orgId, groupId) }),
  })
}

export function useRemoveMemberFromGroup(orgId: string, groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => groupsApi.removeMember(orgId, groupId, memberId),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.detail(orgId, groupId) }),
  })
}

export function useAddTeamToGroup(orgId: string, groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AddTeamToGroupRequest) => groupsApi.addTeam(orgId, groupId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.detail(orgId, groupId) }),
  })
}

export function useRemoveTeamFromGroup(orgId: string, groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (teamId: string) => groupsApi.removeTeam(orgId, groupId, teamId),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.detail(orgId, groupId) }),
  })
}
