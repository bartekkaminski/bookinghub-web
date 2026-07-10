import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { enrollmentsApi, enrollmentRequestsApi } from '@/api/endpoints'
import { eventKeys } from '@/features/events/use-events'
import type {
  EnrollMemberRequest,
  EnrollTeamRequest,
  SetEnrollmentStatusRequest,
  BulkAttendanceRequest,
  EventEnrollmentFilterParams,
  RequestEnrollmentRequest,
  ReviewEnrollmentRequestRequest,
} from '@/api/types'

export const enrollmentKeys = {
  all: (orgId: string) => ['enrollments', orgId] as const,
  forEvent: (orgId: string, eventId: string, params?: EventEnrollmentFilterParams) =>
    ['enrollments', orgId, 'event', eventId, params] as const,
  teamsForEvent: (orgId: string, eventId: string) =>
    ['enrollments', orgId, 'event', eventId, 'teams'] as const,
  forMember: (orgId: string, memberId: string) =>
    ['enrollments', orgId, 'member', memberId] as const,
}

export function useEventEnrollments(orgId: string, eventId: string, params?: EventEnrollmentFilterParams) {
  return useQuery({
    queryKey: enrollmentKeys.forEvent(orgId, eventId, params),
    queryFn: () => enrollmentsApi.listForEvent(orgId, eventId, params),
    enabled: !!orgId && !!eventId,
  })
}

export function useEventTeamEnrollments(orgId: string, eventId: string) {
  return useQuery({
    queryKey: enrollmentKeys.teamsForEvent(orgId, eventId),
    queryFn: () => enrollmentsApi.listTeamsForEvent(orgId, eventId),
    enabled: !!orgId && !!eventId,
  })
}

export function useMemberEnrollments(orgId: string, memberId: string) {
  return useQuery({
    queryKey: enrollmentKeys.forMember(orgId, memberId),
    queryFn: () => enrollmentsApi.listForMember(orgId, memberId),
    enabled: !!orgId && !!memberId,
  })
}

export function useEnrollMember(orgId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: EnrollMemberRequest) => enrollmentsApi.enrollMember(orgId, eventId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.all(orgId) })
      qc.invalidateQueries({ queryKey: eventKeys.detail(orgId, eventId) })
    },
  })
}

export function useEnrollTeam(orgId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: EnrollTeamRequest) => enrollmentsApi.enrollTeam(orgId, eventId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.all(orgId) })
      qc.invalidateQueries({ queryKey: eventKeys.detail(orgId, eventId) })
    },
  })
}

export function useUnenroll(orgId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enrollmentId: string) => enrollmentsApi.unenroll(orgId, eventId, enrollmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.all(orgId) })
      qc.invalidateQueries({ queryKey: eventKeys.detail(orgId, eventId) })
    },
  })
}

export function useUnenrollTeam(orgId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (teamEnrollmentId: string) => enrollmentsApi.unenrollTeam(orgId, eventId, teamEnrollmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.all(orgId) })
      qc.invalidateQueries({ queryKey: eventKeys.detail(orgId, eventId) })
    },
  })
}

export function useSetEnrollmentStatus(orgId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ enrollmentId, data }: { enrollmentId: string; data: SetEnrollmentStatusRequest }) =>
      enrollmentsApi.setStatus(orgId, eventId, enrollmentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.all(orgId) })
      qc.invalidateQueries({ queryKey: eventKeys.detail(orgId, eventId) })
    },
  })
}

export function useBulkAttendance(orgId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BulkAttendanceRequest) => enrollmentsApi.bulkAttendance(orgId, eventId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: enrollmentKeys.all(orgId) })
    },
  })
}

// ── Enrollment Requests ───────────────────────────────────────────────────────

export const enrollmentRequestKeys = {
  pending: (orgId: string) => ['enrollment-requests', orgId, 'pending'] as const,
}

export function usePendingEnrollmentRequests(orgId: string) {
  return useQuery({
    queryKey: enrollmentRequestKeys.pending(orgId),
    queryFn: () => enrollmentRequestsApi.listPending(orgId),
    enabled: !!orgId,
  })
}

export function useRequestEnrollment(orgId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RequestEnrollmentRequest) =>
      enrollmentsApi.requestEnrollment(orgId, eventId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(orgId, eventId) })
      qc.invalidateQueries({ queryKey: enrollmentKeys.all(orgId) })
    },
  })
}

export function useApproveEnrollmentRequest(orgId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ enrollmentId, data }: { enrollmentId: string; data: ReviewEnrollmentRequestRequest }) =>
      enrollmentsApi.approveEnrollmentRequest(orgId, eventId, enrollmentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(orgId, eventId) })
      qc.invalidateQueries({ queryKey: enrollmentKeys.all(orgId) })
      qc.invalidateQueries({ queryKey: enrollmentRequestKeys.pending(orgId) })
    },
  })
}

export function useRejectEnrollmentRequest(orgId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ enrollmentId, data }: { enrollmentId: string; data: ReviewEnrollmentRequestRequest }) =>
      enrollmentsApi.rejectEnrollmentRequest(orgId, eventId, enrollmentId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(orgId, eventId) })
      qc.invalidateQueries({ queryKey: enrollmentKeys.all(orgId) })
      qc.invalidateQueries({ queryKey: enrollmentRequestKeys.pending(orgId) })
    },
  })
}
