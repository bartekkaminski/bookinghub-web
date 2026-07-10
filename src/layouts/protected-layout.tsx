import { useKindeAuth } from '@kinde-oss/kinde-auth-react'
import { Navigate, Outlet } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useProvisionUser } from '@/features/auth/use-auth'

export function ProtectedLayout() {
  const { isAuthenticated, isLoading } = useKindeAuth()
  const { isProvisioned } = useProvisionUser()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (!isProvisioned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Ładowanie profilu...</p>
        </div>
      </div>
    )
  }

  return <Outlet />}
