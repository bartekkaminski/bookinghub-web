import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { locationsApi } from '@/api/endpoints'
import type { CreateLocationRequest, UpdateLocationRequest, LocationFilterParams } from '@/api/types'

export const locationKeys = {
  all: (orgId: string) => ['locations', orgId] as const,
  lists: (orgId: string) => [...locationKeys.all(orgId), 'list'] as const,
  detail: (orgId: string, locationId: string) => [...locationKeys.all(orgId), 'detail', locationId] as const,
}

export function useLocations(orgId: string, params?: LocationFilterParams) {
  return useQuery({
    queryKey: [...locationKeys.lists(orgId), params],
    queryFn: () => locationsApi.list(orgId, params),
    enabled: !!orgId,
  })
}

export function useLocation(orgId: string, locationId: string) {
  return useQuery({
    queryKey: locationKeys.detail(orgId, locationId),
    queryFn: () => locationsApi.getById(orgId, locationId),
    enabled: !!orgId && !!locationId,
  })
}

export function useCreateLocation(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateLocationRequest) => locationsApi.create(orgId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.lists(orgId) }),
  })
}

export function useUpdateLocation(orgId: string, locationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateLocationRequest) => locationsApi.update(orgId, locationId, data),
    onSuccess: (data) => {
      qc.setQueryData(locationKeys.detail(orgId, locationId), data)
      qc.invalidateQueries({ queryKey: locationKeys.lists(orgId) })
    },
  })
}

export function useDeleteLocation(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (locationId: string) => locationsApi.delete(orgId, locationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.lists(orgId) }),
  })
}
