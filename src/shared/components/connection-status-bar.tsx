import { HubConnectionState } from '@microsoft/signalr'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/cn'
import type { AppHubState } from '@/lib/signalr/use-app-hub'

interface Props {
  state: AppHubState
}

/**
 * Pasek informujący o stanie połączenia SignalR.
 * Widoczny tylko gdy połączenie jest zerwane lub trwa ponowne łączenie.
 */
export function ConnectionStatusBar({ state }: Props) {
  // useTranslation MUSI być wywołane przed jakimkolwiek early return — reguły hooków
  const { t } = useTranslation()

  if (state === HubConnectionState.Connected || state === null) return null

  const isReconnecting = state === HubConnectionState.Reconnecting
  const isDisconnected = state === HubConnectionState.Disconnected

  return (
    <div
      role="status"
      aria-live="polite"
        className={cn(
          'flex-shrink-0 z-50 py-1 px-4 text-center text-xs font-medium',
        isReconnecting && 'bg-yellow-500/90 text-yellow-950',
        isDisconnected && 'bg-destructive/90 text-destructive-foreground'
      )}
    >
      {isReconnecting && t('realtime.reconnecting', 'Ponowne łączenie...')}
      {isDisconnected && t('realtime.disconnected', 'Brak połączenia z serwerem')}
    </div>
  )
}
