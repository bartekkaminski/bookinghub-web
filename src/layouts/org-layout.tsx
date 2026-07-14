import { useEffect, useState } from 'react'
import { Outlet, useParams } from '@tanstack/react-router'
import { BottomNav } from './bottom-nav'
import { useAppHub } from '@/lib/signalr/use-app-hub'
import { ConnectionStatusBar } from '@/shared/components/connection-status-bar'
import { NotificationPermissionBanner } from '@/shared/components/notification-permission-banner'
import { useFcmRegistration } from '@/features/notifications/use-fcm'

/** Detects whether the virtual keyboard is open by comparing visualViewport height to window height. */
function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const check = () => {
      // Keyboard is considered open when visual viewport is >150px shorter than window
      setVisible(window.innerHeight - vv.height > 150)
    }

    vv.addEventListener('resize', check)
    return () => vv.removeEventListener('resize', check)
  }, [])

  return visible
}

/**
 * Layout wszystkich stron w kontekście organizacji.
 * Inicjalizuje połączenie SignalR (useAppHub), rejestrację FCM i pokazuje paski statusu.
 */
export function OrgLayout() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const { connectionState } = useAppHub(orgId)
  const { permissionState, requestPermission, isRegistering } = useFcmRegistration()
  const keyboardVisible = useKeyboardVisible()

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <NotificationPermissionBanner
        permissionState={permissionState}
        isRegistering={isRegistering}
        onRequestPermission={requestPermission}
      />
      <ConnectionStatusBar state={connectionState} />
      <main className={keyboardVisible ? 'flex-1 min-h-0 overflow-y-auto' : 'flex-1 min-h-0 overflow-y-auto pb-20'}>
        <Outlet />
      </main>
      {!keyboardVisible && <BottomNav orgId={orgId} />}
    </div>
  )
}
