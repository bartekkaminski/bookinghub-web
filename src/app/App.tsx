import { KindeProvider } from '@kinde-oss/kinde-auth-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { router } from './router'
import '@/i18n'
import { PwaUpdateBanner } from '@/shared/components/pwa-update-banner'

function AppInner() {
  return (
    <>
      <RouterProvider router={router} />
      <PwaUpdateBanner />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          },
        }}
        richColors
      />
    </>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status
          if (status === 401 || status === 403 || status === 404) return false
        }
        return failureCount < 2
      },
    },
  },
})

const KINDE_DOMAIN = import.meta.env.VITE_KINDE_DOMAIN
const KINDE_CLIENT_ID = import.meta.env.VITE_KINDE_CLIENT_ID
const KINDE_REDIRECT_URI = import.meta.env.VITE_KINDE_REDIRECT_URI ?? `${window.location.origin}/auth/callback`
const KINDE_LOGOUT_URI = import.meta.env.VITE_KINDE_LOGOUT_URI ?? `${window.location.origin}/login`
const KINDE_AUDIENCE = import.meta.env.VITE_KINDE_AUDIENCE

export function App() {
  return (
    <KindeProvider
      clientId={KINDE_CLIENT_ID}
      domain={KINDE_DOMAIN}
      redirectUri={KINDE_REDIRECT_URI}
      logoutUri={KINDE_LOGOUT_URI}
      audience={KINDE_AUDIENCE}
    >
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </KindeProvider>
  )
}

export { queryClient }
