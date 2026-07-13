import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useKindeAuth } from '@kinde-oss/kinde-auth-react'
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { toast } from 'sonner'
import { usersApi } from '@/api/endpoints'
import { useAuthStore } from '@/features/auth/auth-store'
import { messageKeys } from '@/features/notifications/use-messages'

export const FCM_TOKEN_STORAGE_KEY = 'bookinghub-fcm-token'

// ── Inicjalizacja Firebase (leniwa, singleton) ───────────────────────────────
let firebaseApp: FirebaseApp | null = null

function getFirebaseApp(): FirebaseApp | null {
  if (!import.meta.env.VITE_FIREBASE_APP_ID) return null
  if (getApps().length > 0) return getApps()[0]!

  firebaseApp = initializeApp({
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  })

  return firebaseApp
}

export type NotificationPermissionState = 'unsupported' | 'default' | 'granted' | 'denied'

// ── Główny hook FCM ──────────────────────────────────────────────────────────

/**
 * Zarządza stanem zgody na powiadomienia push i rejestracją tokenu FCM.
 *
 * Nie prosi automatycznie o zgodę — użytkownik musi kliknąć przycisk (UX + wymóg przeglądarki).
 * Eksportuje:
 *   - `permissionState` — aktualny stan zgody
 *   - `requestPermission` — wywołaj z onClick przycisku
 */
export function useFcmRegistration() {
  const { user } = useAuthStore()
  const { isAuthenticated } = useKindeAuth()
  const qc = useQueryClient()
  const registeredRef = useRef(false)
  const listenerRef = useRef(false)

  const [permissionState, setPermissionState] = useState<NotificationPermissionState>('default')
  const [isRegistering, setIsRegistering] = useState(false)

  // Odczytaj aktualny stan zgody przy montowaniu
  useEffect(() => {
    if (!('Notification' in window)) {
      setPermissionState('unsupported')
      return
    }
    // Jeśli już 'granted' — od razu zarejestruj token (np. po odświeżeniu strony)
    setPermissionState(Notification.permission as NotificationPermissionState)
  }, [])

  // ── Rejestracja tokenu FCM (po udzieleniu zgody) ─────────────────────────
  const registerToken = useCallback(async () => {
    if (!isAuthenticated || !user?.userId) return
    if (registeredRef.current) return

    try {
      const supported = await isSupported()
      if (!supported) {
        console.warn('[FCM] Przeglądarka nie obsługuje FCM.')
        return
      }

      const app = getFirebaseApp()
      if (!app) {
        console.warn('[FCM] Firebase nie jest skonfigurowany (brak VITE_FIREBASE_APP_ID).')
        return
      }

      const messaging = getMessaging(app)

      let swRegistration: ServiceWorkerRegistration
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/firebase-push/',
        })
        console.info('[FCM] Service Worker zarejestrowany:', swRegistration.scope)

        // Poczekaj na pełną aktywację SW — getToken() wymaga active SW.
        // Przy pierwszej rejestracji SW przechodzi Install → Wait → Activate,
        // co może zająć chwilę. Bez oczekiwania PushManager.subscribe() rzuca AbortError.
        if (swRegistration.installing) {
          await new Promise<void>((resolve, reject) => {
            swRegistration.installing!.addEventListener('statechange', function () {
              if (this.state === 'activated') resolve()
              if (this.state === 'redundant') reject(new Error('Firebase SW stał się redundantny'))
            })
          })
          console.info('[FCM] Service Worker aktywowany.')
        }
      } catch (swErr) {
        console.error('[FCM] Błąd rejestracji Service Workera:', swErr)
        return
      }

      let token: string
      try {
        token = await getToken(messaging, {
          vapidKey:                  import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        })
      } catch (tokenErr) {
        console.error('[FCM] Błąd getToken():', tokenErr)
        return
      }

      if (!token) {
        console.warn('[FCM] getToken() zwrócił pusty token — sprawdź VAPID key i konfigurację Firebase.')
        return
      }

      console.info('[FCM] Token uzyskany:', token.slice(0, 20) + '…')

      const storedToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY)
      if (storedToken !== token) {
        if (storedToken) {
          await usersApi.deleteDeviceToken(user.userId, storedToken).catch(() => {})
        }
        await usersApi.registerDeviceToken(user.userId, { token, platform: 'Web' })
        localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token)
        console.info('[FCM] Token zarejestrowany w backendzie.')
      } else {
        console.info('[FCM] Token bez zmian — rejestracja pominięta.')
      }

      registeredRef.current = true

      // Handler powiadomień na pierwszym planie (rejestruj tylko raz)
      if (!listenerRef.current) {
        listenerRef.current = true
        onMessage(messaging, (payload) => {
          console.info('[FCM] Powiadomienie na pierwszym planie:', payload)
          const orgId = payload.data?.['organizationId']
          if (orgId) {
            qc.invalidateQueries({ queryKey: messageKeys.all(orgId) })
          }
          // Pokaż toast gdy aplikacja jest otwarta (SW nie pokaże systenowej notyfikacji)
          const title = payload.notification?.title ?? payload.data?.['title']
          const body  = payload.notification?.body  ?? payload.data?.['body']
          if (title || body) {
            toast.info(body ?? title ?? 'Nowa wiadomość', { description: body ? title : undefined })
          }
        })
      }
    } catch (err) {
      console.error('[FCM] Nieoczekiwany błąd rejestracji:', err)
    }
  }, [isAuthenticated, user?.userId, qc])

  // Gdy zgoda jest już 'granted' (np. po odświeżeniu strony) — zarejestruj token automatycznie
  useEffect(() => {
    if (permissionState === 'granted' && isAuthenticated && user?.userId) {
      registerToken()
    }
  }, [permissionState, isAuthenticated, user?.userId, registerToken])

  // ── Publiczna funkcja: wywoływana kliknięciem przycisku ──────────────────
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return
    if (isRegistering) return

    setIsRegistering(true)
    try {
      const result = await Notification.requestPermission()
      setPermissionState(result as NotificationPermissionState)

      if (result === 'granted') {
        await registerToken()
        toast.success('Powiadomienia włączone')
      } else if (result === 'denied') {
        toast.error('Powiadomienia zablokowane — odblokuj je w ustawieniach przeglądarki')
      }
    } catch (err) {
      console.warn('[FCM] requestPermission() nie powiodło się:', err)
    } finally {
      setIsRegistering(false)
    }
  }, [isRegistering, registerToken])

  return { permissionState, requestPermission, isRegistering }
}

// ── Hook wyrejestrowywania FCM (np. przy wylogowaniu) ────────────────────────

export function useUnregisterFcm() {
  const { user } = useAuthStore()

  return async () => {
    const token = localStorage.getItem(FCM_TOKEN_STORAGE_KEY)
    if (!token || !user?.userId) return

    try {
      await usersApi.deleteDeviceToken(user.userId, token)
      localStorage.removeItem(FCM_TOKEN_STORAGE_KEY)
    } catch {
      // Ignoruj błędy przy czyszczeniu
    }
  }
}
