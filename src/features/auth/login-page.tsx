import { useState } from 'react'
import { useKindeAuth } from '@kinde-oss/kinde-auth-react'
import { LogIn, UserPlus, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/shared/components/ui/drawer'

export function LoginPage() {
  const { login, register, isLoading } = useKindeAuth()
  const { t } = useTranslation()
  const [registerOpen, setRegisterOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <span className="text-2xl font-black text-white">BH</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">BookingHub</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('auth.subtitle')}</p>
          </div>
        </div>

        {/* Przycisk logowania */}
        <div className="w-full space-y-4">
          <Button className="w-full h-12 text-base gap-2" onClick={() => login()} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
            {t('auth.login')}
          </Button>

          <p className="text-center text-xs text-muted-foreground">{t('auth.loginSecure')}</p>

          {/* Link do rejestracji */}
          <p className="text-center text-sm text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <button
              onClick={() => setRegisterOpen(true)}
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              {t('auth.registerLink')}
            </button>
          </p>
        </div>

        {/* Cechy aplikacji */}
        <div className="w-full space-y-2">
          {([t('auth.feature1'), t('auth.feature2'), t('auth.feature3')] as string[]).map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Drawer rejestracji */}
      <Drawer open={registerOpen} onOpenChange={(v) => !v && setRegisterOpen(false)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('auth.registerDrawerTitle')}</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-2 space-y-5">
            {/* Logo w drawerze */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary flex-shrink-0">
                <span className="text-lg font-black text-white">BH</span>
              </div>
              <div>
                <p className="font-semibold">BookingHub</p>
                <p className="text-xs text-muted-foreground">{t('auth.subtitle')}</p>
              </div>
            </div>

            {/* Opis */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('auth.registerDrawerDesc')}
            </p>

            {/* Zakładasz organizację */}
            <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
              <p className="text-sm font-medium text-primary">{t('auth.registerOwnerNote')}</p>
            </div>

            {/* Notatka o dołączaniu */}
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3">
              <p className="text-sm font-medium text-destructive leading-relaxed">{t('auth.registerJoinNote')}</p>
            </div>

            {/* Regulamin */}
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {t('auth.registerTerms')}{' '}
              <span className="text-primary font-medium">{t('auth.registerTermsLink')}</span>
              {' '}{t('auth.registerPrivacy')}{' '}
              <span className="text-primary font-medium">{t('auth.registerPrivacyLink')}</span>.
            </p>

            {/* Przycisk */}
            <Button
              className="w-full h-12 text-base gap-2"
              onClick={() => { setRegisterOpen(false); register() }}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
              {t('auth.registerBtn')}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
