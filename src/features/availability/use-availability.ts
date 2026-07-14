import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { availabilityApi } from '@/api/endpoints'
import type {
  AddAvailabilitySlotRequest,
  UpdateAvailabilitySlotRequest,
} from '@/api/types'

// ── Query keys ────────────────────────────────────────────────────────────────

export const availabilityKeys = {
  all:      (orgId: string, memberId: string) =>
              ['availability', orgId, memberId] as const,
  slots:    (orgId: string, memberId: string) =>
              [...availabilityKeys.all(orgId, memberId), 'slots'] as const,
  schedule: (orgId: string, memberId: string, from: string, to: string) =>
              [...availabilityKeys.all(orgId, memberId), 'schedule', from, to] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Pobiera wszystkie sloty (tygodniowe wzorce) danego członka */
export function useAvailabilitySlots(orgId: string, memberId: string) {
  return useQuery({
    queryKey: availabilityKeys.slots(orgId, memberId),
    queryFn:  () => availabilityApi.getSlots(orgId, memberId),
    enabled:  !!orgId && !!memberId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Scalony grafik dla konkretnego dnia (Available/Busy).
 * Wywołuje GET /schedule?from=date&to=date (single-day range).
 */
export function useMemberDaySchedule(
  orgId: string,
  memberId: string,
  date: Date | null,
) {
  const dateStr = date ? format(date, 'yyyy-MM-dd') : null
  return useQuery({
    queryKey: availabilityKeys.schedule(orgId, memberId, dateStr ?? '', dateStr ?? ''),
    queryFn:  () => availabilityApi.getSchedule(orgId, memberId, dateStr!, dateStr!),
    enabled:  !!orgId && !!memberId && !!dateStr,
    staleTime: 60 * 1000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useAddAvailabilitySlot(orgId: string, memberId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AddAvailabilitySlotRequest) =>
      availabilityApi.addSlot(orgId, memberId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: availabilityKeys.all(orgId, memberId) })
    },
  })
}

export function useUpdateAvailabilitySlot(
  orgId: string,
  memberId: string,
  slotId: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateAvailabilitySlotRequest) =>
      availabilityApi.updateSlot(orgId, memberId, slotId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: availabilityKeys.all(orgId, memberId) })
    },
  })
}

export function useDeleteAvailabilitySlot(orgId: string, memberId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slotId: string) =>
      availabilityApi.deleteSlot(orgId, memberId, slotId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: availabilityKeys.all(orgId, memberId) })
    },
  })
}
