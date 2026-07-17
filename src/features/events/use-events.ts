import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from '@/api/endpoints'
import type {
  CreateEventRequest,
  CreateRecurringEventsRequest,
  CancelFutureInSeriesGroupRequest,
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
  seriesGroup: (orgId: string, seriesGroupId: string) =>
    [...eventKeys.all(orgId), 'series-group', seriesGroupId] as const,
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

export function useEventsBySeriesGroup(orgId: string, seriesGroupId: string | undefined) {
  return useQuery({
    queryKey: eventKeys.seriesGroup(orgId, seriesGroupId ?? ''),
    queryFn: () => eventsApi.bySeriesGroup(orgId, seriesGroupId!),
    enabled: !!orgId && !!seriesGroupId,
  })
}

export function useCreateEvent(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEventRequest) => eventsApi.create(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all(orgId) })
      qc.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

export function useCreateRecurringEvents(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRecurringEventsRequest) => eventsApi.createRecurring(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all(orgId) })
      qc.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}

export function useCancelFutureInSeriesGroup(orgId: string, seriesGroupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CancelFutureInSeriesGroupRequest) =>
      eventsApi.cancelFutureInSeriesGroup(orgId, seriesGroupId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all(orgId) })
      qc.invalidateQueries({ queryKey: eventKeys.seriesGroup(orgId, seriesGroupId) })
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
      qc.invalidateQueries({ queryKey: ['availability'] })
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
      qc.invalidateQueries({ queryKey: ['availability'] })
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
      qc.invalidateQueries({ queryKey: ['availability'] })
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

/** Day names matching .NET DayOfWeek (Mon–Sun order for UI index 0–6). */
export const DOTNET_WEEKDAY_NAMES = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const

export type DotNetDayOfWeek = typeof DOTNET_WEEKDAY_NAMES[number]

/** Count matching weekdays in [dateFrom, dateTo] for selected Mon–Sun flags. */
export function countMatchingDays(
  dateFrom: string,
  dateTo: string,
  daysMonSun: boolean[],
): number {
  if (!dateFrom || !dateTo) return 0
  const from = new Date(dateFrom + 'T00:00:00')
  const to = new Date(dateTo + 'T00:00:00')
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) return 0

  let count = 0
  const cur = new Date(from)
  while (cur <= to) {
    const jsDay = cur.getDay() // 0=Sun … 6=Sat
    const monSunIdx = jsDay === 0 ? 6 : jsDay - 1
    if (daysMonSun[monSunIdx]) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export function selectedDaysToDotNet(daysMonSun: boolean[]): DotNetDayOfWeek[] {
  return DOTNET_WEEKDAY_NAMES.filter((_, i) => daysMonSun[i])
}

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
