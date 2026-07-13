import { Outlet, useParams } from '@tanstack/react-router'
import { BottomNav } from './bottom-nav'
import { useAppHub } from '@/lib/signalr/use-app-hub'
import { ConnectionStatusBar } from '@/shared/components/connection-status-bar'
import { NotificationPermissionBanner } from '@/shared/components/notification-permission-banner'
import { useFcmRegistration } from '@/features/notifications/use-fcm'

/**
 * Layout wszystkich stron w kontekście organizacji.
 * Inicjalizuje połączenie SignalR (useAppHub), rejestrację FCM i pokazuje paski statusu.
 */
export function OrgLayout() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const { connectionState } = useAppHub(orgId)
  const { permissionState, requestPermission, isRegistering } = useFcmRegistration()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <NotificationPermissionBanner
        permissionState={permissionState}
        isRegistering={isRegistering}
        onRequestPermission={requestPermission}
      />
      <ConnectionStatusBar state={connectionState} />
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomNav orgId={orgId} />
    </div>
  )
}
