import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventSeriesApi } from '@/api/endpoints'
import type {
  CreateEventSeriesRequest,
  UpdateEventSeriesRequest,
  EventSeriesFilterParams,
  GenerateEventsRequest,
} from '@/api/types'
import { eventKeys } from '@/features/events/use-events'

export const seriesKeys = {
  all: (orgId: string) => ['event-series', orgId] as const,
  lists: (orgId: string) => [...seriesKeys.all(orgId), 'list'] as const,
  list: (orgId: string, params?: EventSeriesFilterParams) => [...seriesKeys.lists(orgId), params] as const,
  detail: (orgId: string, seriesId: string) => [...seriesKeys.all(orgId), 'detail', seriesId] as const,
}

export function useEventSeriesList(orgId: string, params?: EventSeriesFilterParams) {
  return useQuery({
    queryKey: seriesKeys.list(orgId, params),
    queryFn: () => eventSeriesApi.list(orgId, params),
    enabled: !!orgId,
  })
}

export function useAllEventSeries(orgId: string) {
  return useQuery({
    queryKey: [...seriesKeys.all(orgId), 'all'],
    queryFn: () => eventSeriesApi.listAll(orgId),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useEventSeries(orgId: string, seriesId: string) {
  return useQuery({
    queryKey: seriesKeys.detail(orgId, seriesId),
    queryFn: () => eventSeriesApi.getById(orgId, seriesId),
    enabled: !!orgId && !!seriesId,
  })
}

export function useCreateEventSeries(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEventSeriesRequest) => eventSeriesApi.create(orgId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: seriesKeys.all(orgId) }),
  })
}

export function useUpdateEventSeries(orgId: string, seriesId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateEventSeriesRequest) => eventSeriesApi.update(orgId, seriesId, data),
    onSuccess: (data) => {
      qc.setQueryData(seriesKeys.detail(orgId, seriesId), data)
      qc.invalidateQueries({ queryKey: seriesKeys.all(orgId) })
    },
  })
}

export function useDeleteEventSeries(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (seriesId: string) => eventSeriesApi.delete(orgId, seriesId),
    onSuccess: () => qc.invalidateQueries({ queryKey: seriesKeys.all(orgId) }),
  })
}

export function useGenerateEvents(orgId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ seriesId, data }: { seriesId: string; data: GenerateEventsRequest }) =>
      eventSeriesApi.generate(orgId, seriesId, data),
    onSuccess: (_result, { seriesId }) => {
      qc.invalidateQueries({ queryKey: seriesKeys.detail(orgId, seriesId) })
      qc.invalidateQueries({ queryKey: seriesKeys.all(orgId) })
      qc.invalidateQueries({ queryKey: eventKeys.all(orgId) })
    },
  })
}

// ── RRULE helpers ─────────────────────────────────────────────────────────────

const DAY_MAP: Record<string, number> = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 }
const DAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

/** Parse "WEEKLY;BYDAY=TU,TH" → selected boolean[7] (Mon–Sun) */
export function parseRrule(rule?: string): boolean[] {
  const result = Array(7).fill(false) as boolean[]
  if (!rule) return result
  const byDay = rule.match(/BYDAY=([A-Z,]+)/)?.[1]
  if (!byDay) return result
  byDay.split(',').forEach((code) => {
    const idx = DAY_MAP[code]
    if (idx !== undefined) result[idx] = true
  })
  return result
}

/** Build "WEEKLY;BYDAY=TU,TH" from selected boolean[7] */
export function buildRrule(days: boolean[]): string | undefined {
  const codes = DAY_CODES.filter((_, i) => days[i])
  if (codes.length === 0) return undefined
  return `WEEKLY;BYDAY=${codes.join(',')}`
}

/** Display-friendly recurrence label */
export function formatRrule(rule: string | undefined, dayLabels: string[]): string {
  if (!rule) return ''
  const days = parseRrule(rule)
  const names = dayLabels.filter((_, i) => days[i])
  return names.join(', ')
}
