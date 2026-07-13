import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr'
import { useKindeAuth } from '@kinde-oss/kinde-auth-react'
import { messageKeys } from '@/features/notifications/use-messages'
import { FCM_TOKEN_STORAGE_KEY } from '@/features/notifications/use-fcm'

const HUB_URL = `${import.meta.env.VITE_API_BASE_URL}/hubs/app`
const HEARTBEAT_INTERVAL_MS = 60_000

export type AppHubState = HubConnectionState | null

/**
 * Hook zarządzający połączeniem SignalR.
 *
 * - Tworzy połączenie przy zalogowaniu, rozłącza przy wylogowaniu.
 * - Dołącza do grupy org-{orgId} przy zmianie organizacji.
 * - Wysyła Heartbeat co 60 s (aktualizuje LastSeenAt tokenów FCM).
 * - Przy odebraniu zdarzenia NewMessage/NewReply/MessageDeleted: invaliduje query.
 * - Zwraca `connectionState` do wyświetlenia ConnectionStatusBar.
 */
export function useAppHub(orgId: string | undefined) {
  const { getToken, isAuthenticated } = useKindeAuth()
  const qc = useQueryClient()
  const [connectionState, setConnectionState] = useState<AppHubState>(null)

  const connectionRef  = useRef<HubConnection | null>(null)
  const heartbeatRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  // Ref do odczytu bieżącego orgId wewnątrz zamknięć (closures) bez re-tworzenia efektu
  const orgIdRef       = useRef(orgId)
  // Ref do wykrywania React Strict Mode double-invoke: cleanup wywołany przed zakończeniem start()
  const isCleanedUpRef = useRef(false)

  useEffect(() => {
    orgIdRef.current = orgId
  }, [orgId])

  // ── Efekt 1: tworzenie połączenia przy zmianie stanu autoryzacji ──────────
  useEffect(() => {
    if (!isAuthenticated) return

    // React Strict Mode w dev wywołuje efekty dwukrotnie (mount→cleanup→mount).
    // Resetujemy flagę na początku każdego cyklu.
    isCleanedUpRef.current = false

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        // Klient SignalR wysyła token jako ?access_token= dla WebSocket
        // i jako nagłówek Authorization dla SSE/Long Polling
        accessTokenFactory: async () => {
          const token = await getToken()
          return token ?? ''
        },
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning)
      .build()

    connectionRef.current = connection

    // ── Handlery zdarzeń serwera → klienta ──────────────────────────────────
    // qc jest stable (singleton QueryClient), więc closure jest bezpieczne.

    connection.on('NewMessage', (payload: { organizationId: string }) => {
      qc.invalidateQueries({ queryKey: messageKeys.all(payload.organizationId) })
    })

    connection.on('NewReply', (payload: { organizationId: string }) => {
      qc.invalidateQueries({ queryKey: messageKeys.all(payload.organizationId) })
    })

    connection.on('MessageDeleted', (payload: { organizationId: string }) => {
      qc.invalidateQueries({ queryKey: messageKeys.all(payload.organizationId) })
    })

    // ── Lifecycle połączenia ─────────────────────────────────────────────────
    connection.onclose(() => {
      setConnectionState(HubConnectionState.Disconnected)
    })

    connection.onreconnecting(() => {
      setConnectionState(HubConnectionState.Reconnecting)
    })

    connection.onreconnected(async () => {
      setConnectionState(HubConnectionState.Connected)
      // Po powrocie połączenia — dołącz ponownie do grupy aktualnej org
      const currentOrgId = orgIdRef.current
      if (currentOrgId) {
        try { await connection.invoke('JoinOrganization', currentOrgId) } catch { /* ignoruj */ }
      }
    })

    // ── Startuj połączenie ───────────────────────────────────────────────────
    const start = async () => {
      try {
        await connection.start()

        // React Strict Mode: cleanup mógł być wywołany podczas await — jeśli tak,
        // natychmiast zatrzymujemy połączenie (nie ustawiamy state, nie startujemy heartbeat)
        if (isCleanedUpRef.current) {
          connection.stop().catch(() => {})
          return
        }

        setConnectionState(HubConnectionState.Connected)

        // Dołącz do grupy aktualnej org
        const currentOrgId = orgIdRef.current
        if (currentOrgId) {
          try { await connection.invoke('JoinOrganization', currentOrgId) } catch { /* ignoruj */ }
        }

        // Heartbeat — informuje backend że użytkownik jest online (aktualizuje LastSeenAt)
        // Przekazujemy token FCM tego urządzenia — backend aktualizuje TYLKO ten token,
        // dzięki czemu desktop nie "ożywia" tokenu telefonu.
        heartbeatRef.current = setInterval(async () => {
          if (connection.state === HubConnectionState.Connected) {
            const fcmToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY) ?? null
            try { await connection.invoke('Heartbeat', fcmToken) } catch { /* ignoruj */ }
          }
        }, HEARTBEAT_INTERVAL_MS)
      } catch (err) {
        // AbortError podczas negotiation = React Strict Mode double-invoke (cleanup zatrzymał
        // połączenie zanim start() się skończył). Drugi efekt uruchomi nowe połączenie — ignoruj.
        if (isCleanedUpRef.current) return
        console.warn('[SignalR] Błąd połączenia:', err)
        setConnectionState(HubConnectionState.Disconnected)
      }
    }

    start()

    // ── Czyszczenie ──────────────────────────────────────────────────────────
    return () => {
      isCleanedUpRef.current = true
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
      connection.stop().catch(() => { /* ignoruj błędy przy zamykaniu */ })
      connectionRef.current = null
      setConnectionState(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]) // Celowo: połączenie tworzone raz per sesja autoryzacji

  // ── Efekt 2: dołącz do nowej grupy org przy zmianie orgId ────────────────
  useEffect(() => {
    const connection = connectionRef.current
    if (!connection || connection.state !== HubConnectionState.Connected || !orgId) return
    connection.invoke('JoinOrganization', orgId).catch((err) => {
      console.warn('[SignalR] JoinOrganization error:', err)
    })
  }, [orgId])

  return { connectionState }
}

export { HubConnectionState }
