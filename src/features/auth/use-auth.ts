import { useKindeAuth } from '@kinde-oss/kinde-auth-react'
import { useEffect, useCallback } from 'react'
import { authApi } from '@/api/endpoints'
import { setTokenGetter, setOnUnauthorized } from '@/api/client'
import { useAuthStore } from './auth-store'

export function useProvisionUser() {
  const { getToken, isAuthenticated, isLoading } = useKindeAuth()
  const { setUser, setProvisioned, isProvisioned, reset } = useAuthStore()

  useEffect(() => {
    if (!getToken || !setTokenGetter) return

    // Set token getter for API client
    setTokenGetter(async () => {
      const token = await getToken()
      return token ?? null
    })

    setOnUnauthorized(() => {
      reset()
    })
  }, [getToken, reset])

  const provision = useCallback(async () => {
    if (!isAuthenticated || isProvisioned || isLoading) return
    try {
      const user = await authApi.me()
      setUser(user)
      setProvisioned(true)
    } catch (err) {
      console.error('Provisioning failed:', err)
    }
  }, [isAuthenticated, isProvisioned, isLoading, setUser, setProvisioned])

  useEffect(() => {
    provision()
  }, [provision])

  return { isProvisioned }
}

export function useCurrentUser() {
  const { user, currentOrgId, getCurrentMembership, getCurrentRoles } = useAuthStore()
  return {
    user,
    currentOrgId,
    membership: getCurrentMembership(),
    roles: getCurrentRoles(),
  }
}
