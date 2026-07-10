import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersApi } from '@/api/endpoints'
import type {
  AddMemberRequest,
  CreateMemberWithAccountRequest,
  CreateMemberProfileRequest,
  UpdateMemberRequest,
  SetMemberActiveRequest,
  AddMemberRoleRequest,
  AssignTrainerToParticipantRequest,
  OrganizationMemberFilterParams,
} from '@/api/types'

export const memberKeys = {
  all: (orgId: string) => ['members', orgId] as const,
  lists: (orgId: string) => [...memberKeys.all(orgId), 'list'] as const,
  listAll: (orgId: string) => [...memberKeys.all(orgId), 'all'] as const,
  listTrainers: (orgId: string) => [...memberKeys.all(orgId), 'trainers'] as const,
  detail: (orgId: string, memberId: string) => [...memberKeys.all(orgId), 'detail', memberId] as const,
}

export function useMembers(orgId: string, params?: OrganizationMemberFilterParams) {
  return useQuery({
    queryKey: [...memberKeys.lists(orgId), params],
    queryFn: () => membersApi.list(orgId, params),
    enabled: !!orgId,
  })
}

export function useAllMembers(orgId: string) {
  return useQuery({
    queryKey: memberKeys.listAll(orgId),
    queryFn: () => membersApi.listAll(orgId),
    enabled: !!orgId,
  })
}

export function useTrainers(orgId: string) {
  return useQuery({
    queryKey: memberKeys.listTrainers(orgId),
    queryFn: () => membersApi.listTrainers(orgId),
    enabled: !!orgId,
  })
}

export function useMember(orgId: string, memberId: string) {
  return useQuery({
    queryKey: memberKeys.detail(orgId, memberId),
    queryFn: () => membersApi.getById(orgId, memberId),
    enabled: !!orgId && !!memberId,
  })
}

export function useAddExistingMember(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AddMemberRequest) => membersApi.addExisting(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.lists(orgId) })
      qc.invalidateQueries({ queryKey: memberKeys.listAll(orgId) })
    },
  })
}

export function useCreateMemberWithAccount(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMemberWithAccountRequest) => membersApi.createWithAccount(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.lists(orgId) })
      qc.invalidateQueries({ queryKey: memberKeys.listAll(orgId) })
    },
  })
}

export function useCreateMemberProfile(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMemberProfileRequest) => membersApi.createProfile(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.lists(orgId) })
      qc.invalidateQueries({ queryKey: memberKeys.listAll(orgId) })
    },
  })
}

export function useUpdateMember(orgId: string, memberId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateMemberRequest) => membersApi.update(orgId, memberId, data),
    onSuccess: (data) => {
      qc.setQueryData(memberKeys.detail(orgId, memberId), data)
      qc.invalidateQueries({ queryKey: memberKeys.lists(orgId) })
    },
  })
}

export function useSetMemberActive(orgId: string, memberId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SetMemberActiveRequest) => membersApi.setActive(orgId, memberId, data),
    onSuccess: (data) => {
      qc.setQueryData(memberKeys.detail(orgId, memberId), data)
      qc.invalidateQueries({ queryKey: memberKeys.lists(orgId) })
    },
  })
}

export function useAddMemberRole(orgId: string, memberId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AddMemberRoleRequest) => membersApi.addRole(orgId, memberId, data),
    onSuccess: (data) => {
      qc.setQueryData(memberKeys.detail(orgId, memberId), data)
      qc.invalidateQueries({ queryKey: memberKeys.lists(orgId) })
    },
  })
}

export function useRemoveMemberRole(orgId: string, memberId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (role: string) => membersApi.removeRole(orgId, memberId, role),
    onSuccess: (data) => {
      qc.setQueryData(memberKeys.detail(orgId, memberId), data)
      qc.invalidateQueries({ queryKey: memberKeys.lists(orgId) })
    },
  })
}

export function useAssignTrainer(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: AssignTrainerToParticipantRequest }) =>
      membersApi.assignTrainer(orgId, memberId, data),
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: memberKeys.detail(orgId, variables.memberId) })
    },
  })
}

export function useRemoveTrainerFromMember(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, trainerId }: { memberId: string; trainerId: string }) =>
      membersApi.removeTrainer(orgId, memberId, trainerId),
    onSuccess: (_d, variables) => {
      qc.invalidateQueries({ queryKey: memberKeys.detail(orgId, variables.memberId) })
    },
  })
}

export function useDeleteMember(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => membersApi.delete(orgId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.lists(orgId) })
      qc.invalidateQueries({ queryKey: memberKeys.listAll(orgId) })
    },
  })
}
