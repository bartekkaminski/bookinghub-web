import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { personsApi } from '@/api/endpoints'
import type { UpdatePersonRequest, AddParentChildRequest } from '@/api/types'

export const personKeys = {
  me: ['person', 'me'] as const,
  detail: (personId: string) => ['person', personId] as const,
  children: (personId: string) => ['person', personId, 'children'] as const,
}

export function useMyPerson() {
  return useQuery({
    queryKey: personKeys.me,
    queryFn: () => personsApi.getMe(),
  })
}

export function usePerson(personId: string) {
  return useQuery({
    queryKey: personKeys.detail(personId),
    queryFn: () => personsApi.getById(personId),
    enabled: !!personId,
  })
}

export function useUpdatePerson(personId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdatePersonRequest) => personsApi.update(personId, data),
    onSuccess: (data) => {
      qc.setQueryData(personKeys.detail(personId), data)
      qc.invalidateQueries({ queryKey: personKeys.me })
    },
  })
}

export function usePersonChildren(personId: string) {
  return useQuery({
    queryKey: personKeys.children(personId),
    queryFn: () => personsApi.getChildren(personId),
    enabled: !!personId,
  })
}

export function useAddChild(personId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AddParentChildRequest) => personsApi.addChild(personId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: personKeys.children(personId) })
      qc.invalidateQueries({ queryKey: personKeys.detail(personId) })
      qc.invalidateQueries({ queryKey: personKeys.detail(variables.childPersonId) })
    },
  })
}

export function useRemoveChild(personId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (childPersonId: string) => personsApi.removeChild(personId, childPersonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: personKeys.children(personId) })
      qc.invalidateQueries({ queryKey: personKeys.detail(personId) })
    },
  })
}

export function useAddParentChildLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ parentPersonId, childPersonId }: { parentPersonId: string; childPersonId: string }) =>
      personsApi.addChild(parentPersonId, { parentPersonId, childPersonId }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: personKeys.children(vars.parentPersonId) })
      qc.invalidateQueries({ queryKey: personKeys.detail(vars.childPersonId) })
      qc.invalidateQueries({ queryKey: personKeys.detail(vars.parentPersonId) })
    },
  })
}

export function useRemoveParentLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ parentPersonId, childPersonId }: { parentPersonId: string; childPersonId: string }) =>
      personsApi.removeChild(parentPersonId, childPersonId),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: personKeys.children(vars.parentPersonId) })
      qc.invalidateQueries({ queryKey: personKeys.detail(vars.childPersonId) })
    },
  })
}
