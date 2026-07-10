import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationsApi } from '@/api/endpoints'
import type { CreateOrganizationRequest, UpdateOrganizationRequest } from '@/api/types'

export const orgKeys = {
  all: ['organizations'] as const,
  lists: () => [...orgKeys.all, 'list'] as const,
  detail: (id: string) => [...orgKeys.all, 'detail', id] as const,
  limits: () => [...orgKeys.all, 'limits'] as const,
}

export function useOrganizations(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: [...orgKeys.lists(), params],
    queryFn: () => organizationsApi.list(params),
  })
}

export function useOrganization(organizationId: string) {
  return useQuery({
    queryKey: orgKeys.detail(organizationId),
    queryFn: () => organizationsApi.getById(organizationId),
    enabled: !!organizationId,
  })
}

export function useOrganizationCreationLimits() {
  return useQuery({
    queryKey: orgKeys.limits(),
    queryFn: () => organizationsApi.getCreationLimits(),
  })
}

export function useCreateOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOrganizationRequest) => organizationsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.lists() })
      qc.invalidateQueries({ queryKey: orgKeys.limits() })
    },
  })
}

export function useUpdateOrganization(organizationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateOrganizationRequest) => organizationsApi.update(organizationId, data),
    onSuccess: (data) => {
      qc.setQueryData(orgKeys.detail(organizationId), data)
      qc.invalidateQueries({ queryKey: orgKeys.lists() })
    },
  })
}

export function useDeleteOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (organizationId: string) => organizationsApi.delete(organizationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgKeys.lists() })
    },
  })
}
