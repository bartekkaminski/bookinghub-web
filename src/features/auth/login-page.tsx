import { useKindeAuth } from '@kinde-oss/kinde-auth-react'
import { LogIn, UserPlus, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'

export function LoginPage() {
  const { login, register, isLoading } = useKindeAuth()
  const { t } = useTranslation()

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

        {/* Buttons */}
        <div className="w-full space-y-3">
          <Button className="w-full h-12 text-base gap-2" onClick={() => login()} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
            {t('auth.login')}
          </Button>

          <Button variant="outline" className="w-full h-12 text-base gap-2" onClick={() => register()} disabled={isLoading}>
            <UserPlus className="h-5 w-5" />
            {t('auth.register')}
          </Button>

          <p className="text-center text-xs text-muted-foreground">{t('auth.loginSecure')}</p>
        </div>

        {/* Features */}
        <div className="w-full space-y-2">
          {([t('auth.feature1'), t('auth.feature2'), t('auth.feature3')] as string[]).map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
