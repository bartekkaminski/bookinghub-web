/**
 * Firebase Messaging Service Worker
 *
 * UWAGA: Wersja musi być zsynchronizowana z pakietem firebase w package.json.
 * Sprawdź bieżącą wersję: npm list firebase
 */
const FIREBASE_VERSION = '12.16.0'

importScripts(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`)
importScripts(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-messaging-compat.js`)

// Konfiguracja Firebase ładowana przez plik firebase-sw-config.js wygenerowany przez Vite.
// Nie możemy użyć import.meta.env w Service Workerze.
importScripts('/firebase-sw-config.js')

// __FIREBASE_CONFIG__ jest ustawiany przez firebase-sw-config.js
// eslint-disable-next-line no-undef
firebase.initializeApp(self.__FIREBASE_CONFIG__)

// eslint-disable-next-line no-undef
const messaging = firebase.messaging()

// ── Powiadomienia w tle / gdy aplikacja jest zamknięta ───────────────────────
// onBackgroundMessage fires ONLY when the app is not in the foreground.
// Firebase SDK handles the foreground/background split automatically for data-only messages:
//   - App in foreground → onMessage() fires in the main thread, this callback does NOT fire
//   - App in background or closed → this callback fires, onMessage() does NOT fire
// No need to manually check for open windows — that check breaks PWAs in the background.
messaging.onBackgroundMessage((payload) => {
  const title     = payload.data?.title     ?? payload.notification?.title ?? 'BookingHub'
  const body      = payload.data?.body      ?? payload.notification?.body  ?? ''
  const actionUrl = payload.data?.actionUrl ?? '/'

  self.registration.showNotification(title, {
    body,
    icon:  '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    data:  { actionUrl },
    tag:   payload.data?.messageId ?? 'bookinghub-notification',
    renotify: true,
  })
})

// ── Obsługa kliknięcia powiadomienia ────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.actionUrl ?? '/'

  event.waitUntil(
    // Jeśli jest otwarta karta z aplikacją — skieruj ją na właściwy URL
    // W przeciwnym razie otwórz nową kartę
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        const existing = windowClients.find((c) =>
          c.url.startsWith(self.location.origin)
        )
        if (existing) {
          existing.focus()
          return existing.navigate(url)
        }
        return clients.openWindow(url)
      })
  )
})
