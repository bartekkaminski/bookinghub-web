import { useEffect } from 'react'
import { useKindeAuth } from '@kinde-oss/kinde-auth-react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useProvisionUser } from './use-auth'

export function CallbackPage() {
  const { isAuthenticated, isLoading } = useKindeAuth()
  const { isProvisioned } = useProvisionUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated && isProvisioned) {
      navigate({ to: '/app/org-select' })
    }
  }, [isLoading, isAuthenticated, isProvisioned, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Logowanie...</p>
      </div>
    </div>
  )
}
