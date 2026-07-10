import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cancellationRequestsApi } from '@/api/endpoints'
import type { CreateCancellationRequest, ReviewCancellationRequest, CancellationRequestFilterParams } from '@/api/types'

export const cancellationKeys = {
  all: (orgId: string) => ['cancellationRequests', orgId] as const,
  pending: (orgId: string) => ['cancellationRequests', orgId, 'pending'] as const,
  my: (orgId: string) => ['cancellationRequests', orgId, 'my'] as const,
  paged: (orgId: string, params?: CancellationRequestFilterParams) =>
    ['cancellationRequests', orgId, 'paged', params] as const,
}

export function usePendingCancellationRequests(orgId: string) {
  return useQuery({
    queryKey: cancellationKeys.pending(orgId),
    queryFn: () => cancellationRequestsApi.listPending(orgId),
    enabled: !!orgId,
    staleTime: 30_000,
  })
}

export function useMyCancellationRequests(orgId: string) {
  return useQuery({
    queryKey: cancellationKeys.my(orgId),
    queryFn: () => cancellationRequestsApi.listMy(orgId),
    enabled: !!orgId,
  })
}

export function usePagedCancellationRequests(orgId: string, params?: CancellationRequestFilterParams) {
  return useQuery({
    queryKey: cancellationKeys.paged(orgId, params),
    queryFn: () => cancellationRequestsApi.listPaged(orgId, params),
    enabled: !!orgId,
  })
}

export function useSubmitCancellationRequest(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ enrollmentId, data }: { enrollmentId: string; data: CreateCancellationRequest }) =>
      cancellationRequestsApi.submit(orgId, enrollmentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cancellationKeys.all(orgId) })
      qc.invalidateQueries({ queryKey: ['enrollments', orgId] })
    },
  })
}

export function useReviewCancellationRequest(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: ReviewCancellationRequest }) =>
      cancellationRequestsApi.review(orgId, requestId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cancellationKeys.all(orgId) })
      qc.invalidateQueries({ queryKey: ['enrollments', orgId] })
    },
  })
}

export function useWithdrawCancellationRequest(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => cancellationRequestsApi.withdraw(orgId, requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cancellationKeys.all(orgId) })
    },
  })
}
