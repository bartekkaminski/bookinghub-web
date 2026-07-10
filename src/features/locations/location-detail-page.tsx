import { useState } from 'react'
import { useParams, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Edit, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useLocation, useUpdateLocation } from './use-locations'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { DetailSkeleton } from '@/shared/components/loading-skeletons'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { LocationFormDrawer } from './locations-list-page'
import type { UpdateLocationRequest } from '@/api/types'

export function LocationDetailPage() {
  const { orgId, locationId } = useParams({ strict: false }) as { orgId: string; locationId: string }
  const router = useRouter()
  const { isAdminOrManager } = useAuthStore()
  const { t } = useTranslation()
  const [editOpen, setEditOpen] = useState(false)

  const { data: location, isLoading, isError, refetch } = useLocation(orgId, locationId)
  const updateMutation = useUpdateLocation(orgId, locationId)

  const handleUpdate = async (data: { name: string; address?: string; description?: string }) => {
    try {
      await updateMutation.mutateAsync({ ...data, isActive: location?.isActive ?? true } as UpdateLocationRequest)
      setEditOpen(false)
      toast.success(t('locations.updated'))
    } catch {
      toast.error(t('locations.updateFailed'))
    }
  }

  if (isLoading) return <DetailSkeleton />
  if (isError) return <ErrorState onRetry={refetch} />

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={location?.name ?? t('locations.title')}
          back={<Button variant="outline" size="sm" onClick={() => router.history.back()}><ArrowLeft className="h-4 w-4" /></Button>}
          action={isAdminOrManager() ? (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5">
              <Edit className="h-4 w-4" />{t('common.edit')}
            </Button>
          ) : undefined}
        />
      </div>

      <div className="p-4">
        <div className="flex flex-col items-center gap-2 pt-4 pb-6">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <MapPin className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-center">{location?.name}</h2>
          {!location?.isActive && <Badge variant="secondary">{t('locations.inactiveBadge')}</Badge>}
          {location?.address && <p className="text-sm text-muted-foreground text-center">{location.address}</p>}
          {location?.description && <p className="text-sm text-muted-foreground text-center">{location.description}</p>}
        </div>
      </div>

      {isAdminOrManager() && location && (
        <LocationFormDrawer open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleUpdate}
          isLoading={updateMutation.isPending} title={t('locations.editTitle')}
          initialData={{ name: location.name, address: location.address, description: location.description }} />
      )}
    </div>
  )
}
