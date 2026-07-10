import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthMeResponse, AuthMembershipInfo } from '@/api/types'
import i18n from '@/i18n'

export interface AuthState {
  user: AuthMeResponse | null
  currentOrgId: string | null
  isProvisioned: boolean

  // Setters
  setUser: (user: AuthMeResponse | null) => void
  setCurrentOrg: (orgId: string | null) => void
  setProvisioned: (value: boolean) => void
  reset: () => void

  // Helpers
  getCurrentMembership: () => AuthMembershipInfo | null
  getCurrentRoles: () => string[]
  hasRole: (role: string) => boolean
  isAdmin: () => boolean
  isManager: () => boolean
  isTrainer: () => boolean
  isParticipant: () => boolean
  isAdminOrManager: () => boolean
}

const initialState = {
  user: null as AuthMeResponse | null,
  currentOrgId: null as string | null,
  isProvisioned: false,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => {
        set({ user })
        // Synchronizuj język z preferencją użytkownika
        if (user?.preferredLanguage) {
          const lang = user.preferredLanguage
          localStorage.setItem('bookinghub-lang', lang)
          if (i18n.language !== lang) {
            i18n.changeLanguage(lang)
          }
        }
        // Auto-select first active org if none selected
        if (user && !get().currentOrgId) {
          const firstActive = user.memberships.find(m => m.isActive)
          if (firstActive) {
            set({ currentOrgId: firstActive.organizationId })
          }
        }
      },

      setCurrentOrg: (orgId) => set({ currentOrgId: orgId }),
      setProvisioned: (value) => set({ isProvisioned: value }),

      reset: () => set({ ...initialState }),

      getCurrentMembership: () => {
        const { user, currentOrgId } = get()
        if (!user || !currentOrgId) return null
        return user.memberships.find(m => m.organizationId === currentOrgId) ?? null
      },

      getCurrentRoles: () => {
        const membership = get().getCurrentMembership()
        return membership?.roles ?? []
      },

      hasRole: (role) => get().getCurrentRoles().includes(role),
      isAdmin: () => get().hasRole('Admin'),
      isManager: () => get().hasRole('Manager'),
      isTrainer: () => get().hasRole('Trainer'),
      isParticipant: () => get().hasRole('Participant'),
      isAdminOrManager: () => get().isAdmin() || get().isManager(),
    }),
    {
      name: 'bookinghub-auth',
      partialize: (state) => ({
        currentOrgId: state.currentOrgId,
      }),
    }
  )
)
