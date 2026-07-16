import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { disciplinesApi } from '@/api/endpoints'
import type { CreateDisciplineRequest, UpdateDisciplineRequest } from '@/api/types'

export const disciplineKeys = {
  all:    (orgId: string) => ['disciplines', orgId] as const,
  lists:  (orgId: string) => [...disciplineKeys.all(orgId), 'list'] as const,
  detail: (orgId: string, disciplineId: string) => [...disciplineKeys.all(orgId), 'detail', disciplineId] as const,
}

export function useDisciplines(orgId: string) {
  return useQuery({
    queryKey: disciplineKeys.lists(orgId),
    queryFn:  () => disciplinesApi.list(orgId),
    enabled:  !!orgId,
  })
}

export function useDiscipline(orgId: string, disciplineId: string) {
  return useQuery({
    queryKey: disciplineKeys.detail(orgId, disciplineId),
    queryFn:  () => disciplinesApi.getById(orgId, disciplineId),
    enabled:  !!orgId && !!disciplineId,
  })
}

export function useCreateDiscipline(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDisciplineRequest) => disciplinesApi.create(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disciplineKeys.lists(orgId) })
    },
  })
}

export function useUpdateDiscipline(orgId: string, disciplineId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateDisciplineRequest) => disciplinesApi.update(orgId, disciplineId, data),
    onSuccess: (data) => {
      qc.setQueryData(disciplineKeys.detail(orgId, disciplineId), data)
      qc.invalidateQueries({ queryKey: disciplineKeys.lists(orgId) })
    },
  })
}

export function useDeleteDiscipline(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (disciplineId: string) => disciplinesApi.delete(orgId, disciplineId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: disciplineKeys.lists(orgId) })
    },
  })
}
