import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Plus, MapPin, ChevronRight, Search, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { useLocations, useCreateLocation } from './use-locations'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import { ListSkeleton } from '@/shared/components/loading-skeletons'
import { EmptyState } from '@/shared/components/empty-state'
import { ErrorState } from '@/shared/components/error-state'
import { PageHeader } from '@/shared/components/page-header'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/shared/components/ui/drawer'
import type { CreateLocationRequest } from '@/api/types'
import { useDebounce } from '@/shared/hooks/use-debounce'

export function LocationsListPage() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const navigate = useNavigate()
  const { isAdminOrManager } = useAuthStore()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError, refetch } = useLocations(orgId, { search: debouncedSearch || undefined, pageSize: 50 })
  const createMutation = useCreateLocation(orgId)

  const handleCreate = async (data: CreateLocationRequest) => {
    try {
      await createMutation.mutateAsync(data)
      setCreateOpen(false)
      toast.success(t('locations.added'))
    } catch {
      toast.error(t('locations.addFailed'))
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <PageHeader
          title={t('locations.title')}
          back={<Button variant="outline" size="sm" onClick={() => navigate({ to: `/app/org/${orgId}/dashboard` })}><ArrowLeft className="h-4 w-4" /></Button>}
          action={isAdminOrManager() ? (
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />{t('common.add')}
            </Button>
          ) : undefined}
        />
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('locations.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
      </div>

      {isLoading ? <ListSkeleton /> : isError ? <ErrorState onRetry={refetch} /> :
        data?.items.length === 0 ? (
          <EmptyState icon={<MapPin className="h-8 w-8" />} title={t('locations.noLocations')}
            action={isAdminOrManager() ? <Button size="sm" onClick={() => setCreateOpen(true)}>{t('locations.addLocation')}</Button> : undefined}
          />
        ) : (
          <div className="divide-y divide-border">
            {data?.items.map((loc) => (
              <button key={loc.id} onClick={() => navigate({ to: `/app/org/${orgId}/locations/${loc.id}` })}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{loc.name}</span>
                    {!loc.isActive && <Badge variant="secondary" className="text-xs">{t('locations.inactiveBadge')}</Badge>}
                  </div>
                  {loc.address && <p className="text-xs text-muted-foreground truncate">{loc.address}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )
      }

      <LocationFormDrawer open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreate}
        isLoading={createMutation.isPending} title={t('locations.newLocation')} />
    </div>
  )
}

export function LocationFormDrawer({ open, onClose, onSubmit, isLoading, title, initialData }: {
  open: boolean; onClose: () => void; onSubmit: (data: CreateLocationRequest) => void; isLoading: boolean
  title: string; initialData?: { name: string; address?: string; description?: string }
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialData?.name ?? '')
  const [address, setAddress] = useState(initialData?.address ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), address: address.trim() || undefined, description: description.trim() || undefined })
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>{title}</DrawerTitle></DrawerHeader>
        <form onSubmit={handleSubmit} className="px-4 space-y-3">
          <div className="space-y-2">
            <Label>{t('locations.nameLabel')}</Label>
            <Input placeholder={t('locations.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-2">
            <Label>{t('locations.addressLabel')}</Label>
            <Input placeholder={t('locations.addressPlaceholder')} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('locations.descLabel')}</Label>
            <Textarea placeholder={t('locations.descPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </form>
        <DrawerFooter>
          <Button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={!name.trim() || isLoading} className="w-full">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {initialData ? t('common.save') : t('locations.addBtn')}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">{t('common.cancel')}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
