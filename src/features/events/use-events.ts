import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from '@/api/endpoints'
import type {
  CreateEventRequest,
  UpdateEventRequest,
  CancelEventRequest,
  AssignTrainerToEventRequest,
  CalendarRequest,
  EventFilterParams,
  EventType,
  EventStatus,
} from '@/api/types'

export const eventKeys = {
  all: (orgId: string) => ['events', orgId] as const,
  lists: (orgId: string) => [...eventKeys.all(orgId), 'list'] as const,
  list: (orgId: string, params?: EventFilterParams) => [...eventKeys.lists(orgId), params] as const,
  calendar: (orgId: string, params: CalendarRequest) => [...eventKeys.all(orgId), 'calendar', params] as const,
  myCalendar: (orgId: string, params: CalendarRequest) => [...eventKeys.all(orgId), 'my-calendar', params] as const,
  detail: (orgId: string, eventId: string) => [...eventKeys.all(orgId), 'detail', eventId] as const,
}

export function useCalendarEvents(orgId: string, params: CalendarRequest, myCalendar = false) {
  return useQuery({
    queryKey: myCalendar ? eventKeys.myCalendar(orgId, params) : eventKeys.calendar(orgId, params),
    queryFn: () =>
      myCalendar
        ? eventsApi.myCalendar(orgId, params)
        : eventsApi.calendar(orgId, params),
    enabled: !!orgId && !!params.from && !!params.to,
    staleTime: 2 * 60 * 1000,
  })
}

export function useEvents(orgId: string, params?: EventFilterParams) {
  return useQuery({
    queryKey: eventKeys.list(orgId, params),
    queryFn: () => eventsApi.list(orgId, params),
    enabled: !!orgId,
  })
}

export function useEvent(orgId: string, eventId: string) {
  return useQuery({
    queryKey: eventKeys.detail(orgId, eventId),
    queryFn: () => eventsApi.getById(orgId, eventId),
    enabled: !!orgId && !!eventId,
  })
}

export function useCreateEvent(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEventRequest) => eventsApi.create(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all(orgId) })
    },
  })
}

export function useUpdateEvent(orgId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateEventRequest) => eventsApi.update(orgId, eventId, data),
    onSuccess: (data) => {
      qc.setQueryData(eventKeys.detail(orgId, eventId), data)
      qc.invalidateQueries({ queryKey: eventKeys.all(orgId) })
    },
  })
}

export function useCancelEvent(orgId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CancelEventRequest) => eventsApi.cancel(orgId, eventId, data),
    onSuccess: (data) => {
      qc.setQueryData(eventKeys.detail(orgId, eventId), data)
      qc.invalidateQueries({ queryKey: eventKeys.all(orgId) })
    },
  })
}

export function useCompleteEvent(orgId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => eventsApi.complete(orgId, eventId),
    onSuccess: (data) => {
      qc.setQueryData(eventKeys.detail(orgId, eventId), data)
      qc.invalidateQueries({ queryKey: eventKeys.all(orgId) })
    },
  })
}

export function useDeleteEvent(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (eventId: string) => eventsApi.delete(orgId, eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all(orgId) })
    },
  })
}

export function useAssignTrainerToEvent(orgId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AssignTrainerToEventRequest) => eventsApi.assignTrainer(orgId, eventId, data),
    onSuccess: (data) => {
      qc.setQueryData(eventKeys.detail(orgId, eventId), data)
    },
  })
}

export function useRemoveTrainerFromEvent(orgId: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (trainerId: string) => eventsApi.removeTrainer(orgId, eventId, trainerId),
    onSuccess: (data) => {
      qc.setQueryData(eventKeys.detail(orgId, eventId), data)
    },
  })
}

// ── Utility helpers ───────────────────────────────────────────────────────────

export function getEventColor(event: { color?: string; eventType: EventType }): string {
  if (event.color) return event.color
  switch (event.eventType) {
    case 'GroupTraining': return '#3b82f6'
    case 'IndividualSession': return '#8b5cf6'
    case 'Camp': return '#f97316'
    case 'Other': return '#6b7280'
  }
}

export function getStatusColor(status: EventStatus): string {
  switch (status) {
    case 'Scheduled': return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
    case 'Cancelled': return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'
    case 'Completed': return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
  }
}
