import { Outlet, useParams } from '@tanstack/react-router'
import { BottomNav } from './bottom-nav'
import { useAppHub } from '@/lib/signalr/use-app-hub'
import { ConnectionStatusBar } from '@/shared/components/connection-status-bar'

/**
 * Layout wszystkich stron w kontekście organizacji.
 * Inicjalizuje połączenie SignalR (useAppHub) i pokazuje pasek statusu połączenia.
 */
export function OrgLayout() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }
  const { connectionState } = useAppHub(orgId)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <ConnectionStatusBar state={connectionState} />
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomNav orgId={orgId} />
    </div>
  )
}
