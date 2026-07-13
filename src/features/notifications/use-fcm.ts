import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useKindeAuth } from '@kinde-oss/kinde-auth-react'
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { usersApi } from '@/api/endpoints'
import { useAuthStore } from '@/features/auth/auth-store'
import { messageKeys } from '@/features/notifications/use-messages'

const STORAGE_KEY = 'bookinghub-fcm-token'

// ── Inicjalizacja Firebase (leniwa, singleton) ───────────────────────────────
let firebaseApp: FirebaseApp | null = null

function getFirebaseApp(): FirebaseApp | null {
  // Jeśli brak konfiguracji (np. środowisko developerskie), zwróć null
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

// ── Hook rejestracji FCM (wywoływany w App.tsx — globalnie) ──────────────────

/**
 * Rejestruje token FCM urządzenia i ustawia handler powiadomień na pierwszym planie.
 * Wywoływany globalnie w App.tsx — raz per sesja autoryzacji.
 *
 * Fallback: jeśli Firebase nie jest skonfigurowany lub użytkownik odrzucił
 * uprawnienia do powiadomień — hook kończy się cicho bez błędu.
 */
export function useFcmRegistration() {
  const { user } = useAuthStore()
  const { isAuthenticated } = useKindeAuth()
  const qc = useQueryClient()
  const registeredRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !user?.userId || registeredRef.current) return

    const registerToken = async () => {
      try {
        // Sprawdź obsługę FCM w przeglądarce
        const supported = await isSupported()
        if (!supported) return

        if (!('Notification' in window)) return
        if (!('serviceWorker' in navigator)) return

        const app = getFirebaseApp()
        if (!app) return // Firebase nieskonfigurowany — pomiń

        // Poproś o uprawnienia
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const messaging = getMessaging(app)

        // Zarejestruj Service Worker dla FCM (musi to być dedykowany SW)
        const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        })

        // Pobierz token FCM
        const token = await getToken(messaging, {
          vapidKey:                import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        })

        if (!token) {
          console.warn('[FCM] getToken() zwrócił pusty token.')
          return
        }

        // Uaktualnij token jeśli się zmienił (np. po odinstalowaniu/reinstalacji app)
        const storedToken = localStorage.getItem(STORAGE_KEY)
        if (storedToken !== token) {
          if (storedToken) {
            // Usuń stary token z backendu (best-effort, nie blokuj przy błędzie)
            await usersApi.deleteDeviceToken(user.userId, storedToken).catch(() => {})
          }
          await usersApi.registerDeviceToken(user.userId, { token, platform: 'Web' })
          localStorage.setItem(STORAGE_KEY, token)
        }

        registeredRef.current = true

        // ── Handler powiadomień na pierwszym planie ──────────────────────────
        // Gdy aplikacja jest otwarta, FCM nie pokazuje powiadomienia systemowego.
        // Zamiast tego invalidujemy query, żeby dane się odświeżyły.
        onMessage(messaging, (payload) => {
          const orgId = payload.data?.['organizationId']
          if (orgId) {
            qc.invalidateQueries({ queryKey: messageKeys.all(orgId) })
          }
        })
      } catch (err) {
        // FCM jest best-effort — nie blokuj aplikacji
        console.warn('[FCM] Rejestracja nie powiodła się:', err)
      }
    }

    registerToken()
  }, [isAuthenticated, user?.userId, qc])
}

// ── Hook wyrejestrowywania FCM (np. przy wylogowaniu) ────────────────────────

export function useUnregisterFcm() {
  const { user } = useAuthStore()

  return async () => {
    const token = localStorage.getItem(STORAGE_KEY)
    if (!token || !user?.userId) return

    try {
      await usersApi.deleteDeviceToken(user.userId, token)
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignoruj błędy przy czyszczeniu
    }
  }
}
