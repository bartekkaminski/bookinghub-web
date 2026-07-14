import { useEffect, useRef, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { pl, enUS } from 'date-fns/locale'
import { Calendar, Repeat2, CalendarDays, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  useMemberDaySchedule,
  useAvailabilitySlots,
  useDeleteAvailabilitySlot,
} from './use-availability'
import { AvailabilitySlotForm } from './availability-slot-form'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/shared/components/ui/drawer'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/utils/cn'
import type { ScheduleBlock, AvailabilitySlotResponse } from '@/api/types'
import { timeToMinutes, formatTime } from '@/shared/utils/availability'

interface Props {
  orgId: string
  memberId: string
  date: Date
  canEdit?: boolean
}

const HOUR_HEIGHT   = 64
const DEFAULT_START = 7
const DEFAULT_END   = 22

function computeHourRange(blocks: ScheduleBlock[]): { startHour: number; endHour: number } {
  if (blocks.length === 0) return { startHour: DEFAULT_START, endHour: DEFAULT_END }
  const fromMins = blocks.map(b => timeToMinutes(b.timeFrom))
  const toMins   = blocks.map(b => timeToMinutes(b.timeTo))

  const earliestHour = Math.floor(Math.min(...fromMins) / 60)
  const startHour    = Math.max(0, earliestHour)

  const latestMin  = Math.max(...toMins)
  const endHour    = latestMin > DEFAULT_END * 60 ? 24 : DEFAULT_END

  return { startHour, endHour }
}

interface BlockLayout {
  block: ScheduleBlock
  top: number
  height: number
}

function layoutBlocks(blocks: ScheduleBlock[], startHour: number): BlockLayout[] {
  const offsetMin = startHour * 60
  return blocks.map(b => {
    const fromMin = timeToMinutes(b.timeFrom)
    const toMin   = timeToMinutes(b.timeTo)
    return {
      block:  b,
      top:    ((fromMin - offsetMin) / 60) * HOUR_HEIGHT,
      height: Math.max(((toMin - fromMin) / 60) * HOUR_HEIGHT, 28),
    }
  })
}

export function AvailabilityDayView({ orgId, memberId, date, canEdit = false }: Props) {
  const { t, i18n } = useTranslation()
  const locale      = i18n.language === 'en' ? enUS : pl

  const { data: schedule, isLoading } = useMemberDaySchedule(orgId, memberId, date)
  const { data: slots }               = useAvailabilitySlots(orgId, memberId)
  const deleteMutation                = useDeleteAvailabilitySlot(orgId, memberId)
  const scrollRef = useRef<HTMLDivElement>(null)

  const slotMap = useMemo(() => {
    const map = new Map<string, AvailabilitySlotResponse>()
    slots?.forEach(s => map.set(s.id, s))
    return map
  }, [slots])

  const dateKey = format(date, 'yyyy-MM-dd')
  const dayData = schedule?.find(d => d.date === dateKey)
  const blocks  = dayData?.blocks ?? []

  const { startHour, endHour } = computeHourRange(blocks)
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)
  const laid  = layoutBlocks(blocks, startHour)

  // ── Drawer: detail / edit / delete ───────────────────────────────────────
  const [detailSlot, setDetailSlot]       = useState<AvailabilitySlotResponse | null>(null)
  const [detailOpen, setDetailOpen]       = useState(false)
  const [editOpen, setEditOpen]           = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  function handleBlockClick(block: ScheduleBlock) {
    if (!canEdit) return
    const slot = slotMap.get(block.slotId)
    if (!slot) return
    setDetailSlot(slot)
    setDeleteConfirm(false)
    setDetailOpen(true)
  }

  async function handleDelete() {
    if (!detailSlot) return
    try {
      await deleteMutation.mutateAsync(detailSlot.id)
      toast.success(t('availability.slotDeleted'))
      setDeleteConfirm(false)
      setDetailOpen(false)
      setDetailSlot(null)
    } catch {
      toast.error(t('availability.deleteFailed'))
    }
  }

  // Auto-scroll
  useEffect(() => {
    if (!scrollRef.current) return
    const now = new Date()
    const targetHour = format(now, 'yyyy-MM-dd') === dateKey
      ? Math.max(now.getHours() - 1, startHour)
      : blocks.length > 0
        ? Math.floor(timeToMinutes(blocks[0].timeFrom) / 60)
        : startHour
    scrollRef.current.scrollTop = Math.max(0, (targetHour - startHour) * HOUR_HEIGHT - 16)
  }, [dateKey, startHour])

  const isSingleSlot = (slot: AvailabilitySlotResponse) =>
    !!slot.validFrom && slot.validFrom === slot.validTo

  return (
    <div className="flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div>
          <p className="text-sm font-semibold capitalize">
            {format(date, 'EEEE', { locale })}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(date, 'd MMMM yyyy', { locale })}
          </p>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div ref={scrollRef} className="pl-2 pr-4 pt-4 pb-4">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="relative" style={{ height: `${(endHour - startHour) * HOUR_HEIGHT + 16}px`, marginTop: '10px' }}>

            {/* ── Hour rows ── */}
            {hours.map(hour => (
              <div
                key={hour}
                className="absolute w-full"
                style={{ top: `${(hour - startHour) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                {/* Pełna godzina */}
                <div className="flex items-start w-full">
                  <div className="w-10 flex-shrink-0 text-right pr-1">
                    <span className="text-[11px] text-muted-foreground leading-none block -translate-y-1/2">
                      {hour === 24 ? '00:00' : `${String(hour).padStart(2, '0')}:00`}
                    </span>
                  </div>
                  <div className="ml-3 flex-1 border-t border-border/50" />
                </div>

                {/* Półgodzina (przerywana) */}
                {hour < endHour && (
                  <div
                    className="flex items-start w-full absolute"
                    style={{ top: `${HOUR_HEIGHT / 2}px` }}
                  >
                    <div className="w-10 flex-shrink-0" />
                    <div className="ml-3 flex-1 border-t border-dashed border-border/30" />
                  </div>
                )}
              </div>
            ))}

            {/* ── Bloki dostępności ── */}
            <div className="absolute" style={{ left: 'calc(2.5rem + 0.75rem)', right: 0, top: 0, bottom: 0 }}>

              {blocks.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Calendar className="h-8 w-8 opacity-20" />
                  <p className="text-sm">{t('availability.noSchedule')}</p>
                </div>
              )}

              {laid.map((item, idx) => {
                const slot      = slotMap.get(item.block.slotId)
                const isSingle  = slot ? isSingleSlot(slot) : false
                const clickable = canEdit && !!slot

                return (
                  <BlockCard
                    key={idx}
                    item={item}
                    isSingle={isSingle}
                    clickable={clickable}
                    onClick={() => handleBlockClick(item.block)}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      {blocks.length > 0 && (
        <div className="flex items-center justify-center gap-4 px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-green-500/70" />
            {t('availability.legend.available')}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-blue-500/70" />
            {t('availability.legend.busy')}
          </span>
          {canEdit && (
            <span className="flex items-center gap-1.5 border-l border-border pl-3 ml-1">
              <Repeat2 className="h-3 w-3" /> cykl.
              <CalendarDays className="h-3 w-3 text-amber-500 ml-1" /> jedn.
            </span>
          )}
        </div>
      )}

      {/* ── Drawer: szczegóły terminu ── */}
      <Drawer open={detailOpen} onOpenChange={v => !v && setDetailOpen(false)}>
        <DrawerContent>
          {detailSlot && (
            <>
              <DrawerHeader>
                <DrawerTitle className="flex items-center gap-2">
                  {isSingleSlot(detailSlot)
                    ? <CalendarDays className="h-4 w-4 text-amber-500" />
                    : <Repeat2 className="h-4 w-4 text-primary/70" />
                  }
                  {formatTime(detailSlot.timeFrom)} – {formatTime(detailSlot.timeTo)}
                </DrawerTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {isSingleSlot(detailSlot)
                    ? `Jednorazowy · ${detailSlot.validFrom}`
                    : `Cykliczny · ${detailSlot.dayOfWeek}${
                        detailSlot.validFrom || detailSlot.validTo
                          ? ` · ${[detailSlot.validFrom && `od ${detailSlot.validFrom}`, detailSlot.validTo && `do ${detailSlot.validTo}`].filter(Boolean).join(' ')}`
                          : ' · co tydzień'
                      }`
                  }
                </p>
              </DrawerHeader>
              <DrawerFooter>
                {!deleteConfirm ? (
                  <>
                    <Button variant="outline" className="w-full gap-2"
                      onClick={() => { setDetailOpen(false); setEditOpen(true) }}>
                      <Pencil className="h-4 w-4" />
                      {t('availability.editSlot')}
                    </Button>
                    <Button variant="outline"
                      className="w-full gap-2 text-destructive border-destructive/40 hover:bg-destructive/10"
                      onClick={() => setDeleteConfirm(true)}>
                      <Trash2 className="h-4 w-4" />
                      {t('availability.deleteSlot')}
                    </Button>
                    <DrawerClose asChild>
                      <Button variant="ghost" className="w-full">{t('common.cancel')}</Button>
                    </DrawerClose>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-center text-muted-foreground px-4 pb-1">
                      {t('availability.deleteConfirm')}
                    </p>
                    <Button variant="destructive" className="w-full"
                      onClick={handleDelete} disabled={deleteMutation.isPending}>
                      {deleteMutation.isPending ? t('common.loading') : t('common.delete')}
                    </Button>
                    <Button variant="outline" className="w-full"
                      onClick={() => setDeleteConfirm(false)}>
                      {t('common.cancel')}
                    </Button>
                  </>
                )}
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* ── Drawer: edycja ── */}
      <AvailabilitySlotForm
        open={editOpen}
        onClose={() => { setEditOpen(false); setDetailSlot(null) }}
        orgId={orgId}
        memberId={memberId}
        slot={detailSlot}
      />
    </div>
  )
}

// ── BlockCard ─────────────────────────────────────────────────────────────────

function BlockCard({ item, isSingle, clickable, onClick }: {
  item: BlockLayout
  isSingle: boolean
  clickable: boolean
  onClick: () => void
}) {
  const { block, top, height } = item
  const isAvail = block.type === 'Available'
  const short   = height < 40

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? e => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'absolute border px-2 py-1 overflow-hidden text-left',
        'text-xs transition-opacity',
        isAvail
          ? 'bg-green-500/10 border-green-500/30 dark:bg-green-500/15'
          : 'bg-blue-600 border-blue-700 dark:bg-blue-700 dark:border-blue-800',
        clickable && 'cursor-pointer hover:opacity-80 active:opacity-60',
      )}
      style={{ top, height, left: 0, right: 0 }}
    >
      <div className="flex items-start justify-between gap-1">
        <p className={cn('font-semibold leading-tight truncate', isAvail ? 'text-green-700 dark:text-green-400' : 'text-white')}>
          {formatTime(block.timeFrom)}{!short && ` – ${formatTime(block.timeTo)}`}
        </p>
        {isAvail && clickable && (
          <span className="flex-shrink-0 opacity-50 mt-0.5">
            {isSingle
              ? <CalendarDays className="h-3 w-3 text-amber-500" />
              : <Repeat2 className="h-3 w-3" />
            }
          </span>
        )}
      </div>
      {!isAvail && block.event && !short && (
        <p className="truncate text-[10px] text-white/80 mt-0.5">{block.event.title}</p>
      )}
    </div>
  )
}
