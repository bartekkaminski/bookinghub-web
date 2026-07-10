import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/features/auth/auth-store'
import { usersApi } from '@/api/endpoints'
import { useKindeAuth } from '@kinde-oss/kinde-auth-react'

const STORAGE_KEY = 'bookinghub-fcm-token'

export function useFcmRegistration() {
  const { user } = useAuthStore()
  const { isAuthenticated } = useKindeAuth()
  const registeredRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !user?.userId || registeredRef.current) return

    // Check if Notification API is available
    if (!('Notification' in window)) return

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) return

    const registerToken = async () => {
      try {
        // Request permission
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        // In a real app, initialize Firebase here and get the FCM token
        // For now, we store the intent and the architecture is ready
        const existingToken = localStorage.getItem(STORAGE_KEY)
        if (!existingToken) {
          // Placeholder — in production replace with:
          // import { getMessaging, getToken } from 'firebase/messaging'
          // const messaging = getMessaging(firebaseApp)
          // const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY })
          const mockToken = `web-pwa-${user.userId}-${Date.now()}`

          await usersApi.registerDeviceToken(user.userId, {
            token: mockToken,
            platform: 'Web',
          })

          localStorage.setItem(STORAGE_KEY, mockToken)
        }

        registeredRef.current = true
      } catch (err) {
        // FCM registration is best-effort, don't block app
        console.warn('FCM registration failed:', err)
      }
    }

    registerToken()
  }, [isAuthenticated, user?.userId])
}

export function useUnregisterFcm() {
  const { user } = useAuthStore()

  return async () => {
    const token = localStorage.getItem(STORAGE_KEY)
    if (!token || !user?.userId) return

    try {
      await usersApi.deleteDeviceToken(user.userId, token)
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore cleanup errors
    }
  }
}
