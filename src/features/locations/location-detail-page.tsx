import { useRef, useState, type ReactNode } from 'react'
import { useParams, useRouter, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Edit, MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useLocation, useUpdateLocation, useDeleteLocation } from './use-locations'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { DetailSkeleton } from '@/shared/components/loading-skeletons'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import { LocationFormDrawer } from './locations-list-page'
import { LocationMonthCalendar } from './location-month-calendar'
import { LocationDayView } from './location-day-view'
import type { UpdateLocationRequest } from '@/api/types'

export function LocationDetailPage() {
  const { orgId, locationId } = useParams({ strict: false }) as { orgId: string; locationId: string }
  const router = useRouter()
  const navigate = useNavigate()
  const { isAdminOrManager } = useAuthStore()
  const { t } = useTranslation()

  const [editOpen, setEditOpen]         = useState(false)
  const [deleteOpen, setDeleteOpen]     = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date())
  const scheduleRef                     = useRef<HTMLDivElement>(null)

  const { data: location, isLoading, isError, refetch } = useLocation(orgId, locationId)
  const updateMutation = useUpdateLocation(orgId, locationId)
  const deleteMutation = useDeleteLocation(orgId)

  const handleUpdate = async (data: { name: string; address?: string; description?: string }) => {
    try {
      await updateMutation.mutateAsync({ ...data, isActive: location?.isActive ?? true } as UpdateLocationRequest)
      setEditOpen(false)
      toast.success(t('locations.updated'))
    } catch {
      toast.error(t('locations.updateFailed'))
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(locationId)
      toast.success(t('locations.deleted'))
      navigate({ to: `/org/${orgId}/locations`, replace: true })
    } catch {
      toast.error(t('locations.deleteFailed'))
    }
  }

  const handleDaySelect = (date: Date) => {
    setSelectedDate(date)
    setTimeout(() => {
      scheduleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  if (isLoading) return <DetailSkeleton />
  if (isError)   return <ErrorState onRetry={refetch} />

  return (
    <div className="pb-8">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={location?.name ?? t('locations.title')}
          back={
            <Button variant="outline" size="sm" onClick={() => router.history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          }
          action={
            isAdminOrManager() ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="gap-1.5"
              >
                <Edit className="h-4 w-4" />
                {t('common.edit')}
              </Button>
            ) : undefined
          }
        />
      </div>

      {/* Info */}
      <div className="px-4">
        <div className="flex flex-col items-center gap-2 pt-4 pb-6">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <MapPin className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-center">{location?.name}</h2>
          {!location?.isActive && (
            <Badge variant="secondary">{t('locations.inactiveBadge')}</Badge>
          )}
          {location?.address && (
            <p className="text-sm text-muted-foreground text-center">{location.address}</p>
          )}
          {location?.description && (
            <p className="text-sm text-muted-foreground text-center">{location.description}</p>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div className="border-t border-border px-4 pt-4">
        <LocationMonthCalendar
          orgId={orgId}
          locationId={locationId}
          onDaySelect={handleDaySelect}
          selectedDate={selectedDate}
        />
      </div>

      {selectedDate && (
        <div ref={scheduleRef}>
          <LocationDayView
            orgId={orgId}
            locationId={locationId}
            date={selectedDate}
            onClose={() => setSelectedDate(null)}
          />
        </div>
      )}

      {/* Edit drawer */}
      {isAdminOrManager() && location && (
        <LocationFormDrawer
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
          title={t('locations.editTitle')}
          initialData={{
            name:        location.name,
            address:     location.address,
            description: location.description,
          }}
          onDelete={() => { setEditOpen(false); setDeleteOpen(true) }}
        />
      )}

      {/* Delete confirm drawer */}
      <DeleteConfirmDrawer
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title={t('locations.deleteConfirmTitle')}
        description={t('locations.deleteConfirmDesc', { name: location?.name ?? '' })}
        icon={<MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
        itemName={location?.name ?? ''}
        deleteLabel={t('locations.deleteBtn')}
      />
    </div>
  )
}

function DeleteConfirmDrawer({
  open, onClose, onConfirm, isLoading, title, description, icon, itemName, deleteLabel,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void; isLoading: boolean
  title: string; description: string; icon: ReactNode; itemName: string; deleteLabel: string
}) {
  const { t } = useTranslation()
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{title}</DrawerTitle></DrawerHeader>
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-3">
            {icon}
            <span className="text-sm font-medium">{itemName}</span>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <DrawerFooter>
          <Button variant="destructive" className="w-full" disabled={isLoading} onClick={onConfirm}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {deleteLabel}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
