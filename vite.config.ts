import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

/**
 * Plugin generujący /firebase-sw-config.js na podstawie zmiennych środowiskowych.
 *
 * Service Worker nie może używać import.meta.env — ten plik jest importowany
 * przez firebase-messaging-sw.js przy użyciu importScripts('/firebase-sw-config.js').
 *
 * W trybie dev: plik jest serwowany dynamicznie przez middleware.
 * W trybie build: plik jest emitowany jako statyczny asset do katalogu dist.
 */
function firebaseSwConfigPlugin(env: Record<string, string>): Plugin {
  const config = {
    apiKey:            env['VITE_FIREBASE_API_KEY']            ?? '',
    authDomain:        env['VITE_FIREBASE_AUTH_DOMAIN']        ?? '',
    projectId:         env['VITE_FIREBASE_PROJECT_ID']         ?? '',
    storageBucket:     env['VITE_FIREBASE_STORAGE_BUCKET']     ?? '',
    messagingSenderId: env['VITE_FIREBASE_MESSAGING_SENDER_ID'] ?? '',
    appId:             env['VITE_FIREBASE_APP_ID']             ?? '',
  }
  const content = `self.__FIREBASE_CONFIG__ = ${JSON.stringify(config)};`

  return {
    name: 'firebase-sw-config',

    configureServer(server: ViteDevServer) {
      server.middlewares.use('/firebase-sw-config.js', (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        res.end(content)
      })
    },

    generateBundle() {
      // `this` w kontekście hooka generateBundle jest PluginContext — używamy unknown jako bridge
      const ctx = this as unknown as { emitFile: (o: object) => void }
      ctx.emitFile({
        type:     'asset',
        fileName: 'firebase-sw-config.js',
        source:   content,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: [
          'favicon.ico',
          'favicon.svg',
          'apple-touch-icon-180x180.png',
          'pwa-*.png',
          'maskable-icon-512x512.png',
        ],
        manifest: {
          id:               '/',
          name:             'BookingHub',
          short_name:       'BookingHub',
          description:      'Platforma do zarządzania szkołami tańca i klubami',
          lang:             'pl',
          dir:              'ltr',
          theme_color:      '#262626',
          background_color: '#863bff',
          display:          'standalone',
          orientation:      'portrait',
          scope:            '/',
          start_url:        '/',
          icons: [
            { src: 'pwa-64x64.png',             sizes: '64x64',   type: 'image/png' },
            { src: 'pwa-192x192.png',            sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png',            sizes: '512x512', type: 'image/png' },
            { src: 'maskable-icon-512x512.png',  sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // Serwuj index.html dla wszystkich nawigacji SPA gdy sieć jest niedostępna.
          // Dzięki temu działa offline-routing i ConnectionStatusBar wewnątrz aplikacji.
          navigateFallback: '/index.html',
          // Wyklucz API i SW Firebase z nawigacyjnego fallbacku
          navigateFallbackDenylist: [/^\/api\//, /^\/firebase-/],
          // Nie cachuj Service Workera Firebase — musi być zawsze świeży
          globIgnores: ['firebase-messaging-sw.js', 'firebase-sw-config.js'],
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/.*\/api\/.*/i,
              handler:    'NetworkFirst',
              options: {
                cacheName:            'api-cache',
                expiration:           { maxEntries: 100, maxAgeSeconds: 60 * 60 },
                networkTimeoutSeconds: 10,
              },
            },
          ],
        },
      }),
      firebaseSwConfigPlugin(env),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
