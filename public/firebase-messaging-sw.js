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

// Aktywuj nowy SW natychmiast po instalacji — bez czekania na zamknięcie wszystkich kart.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()))

// onBackgroundMessage jest WYMAGANY przez Firebase Messaging (bez niego library rzuca błąd).
// NIE wywołujemy showNotification() — przeglądarka auto-wyświetla powiadomienie z
// WebpushConfig.Notification ustawionego w backendzie (tytuł, treść, ikona, tag, actionUrl w data).
// Dodatkowe showNotification() stworzyłoby duplikat.
// eslint-disable-next-line no-undef
messaging.onBackgroundMessage((_payload) => {
  // intentionally empty — backend's WebpushConfig.Notification handles display
})

// ── Obsługa kliknięcia powiadomienia ────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.actionUrl ?? '/'

  event.waitUntil(
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
