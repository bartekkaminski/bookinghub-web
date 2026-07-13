import { useTranslation } from 'react-i18next'
import { Bell, BellOff, X, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { type NotificationPermissionState } from '@/features/notifications/use-fcm'

interface Props {
  permissionState: NotificationPermissionState
  isRegistering: boolean
  onRequestPermission: () => void
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isAndroid() {
  return /android/i.test(navigator.userAgent)
}

export function NotificationPermissionBanner({ permissionState, isRegistering, onRequestPermission }: Props) {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(false)

  if (permissionState === 'unsupported') return null
  if (permissionState === 'granted') return null
  if (dismissed) return null

  if (permissionState === 'denied') {
    const ios = isIos()
    const android = isAndroid()

    let instructions: string
    if (ios) {
      instructions = t(
        'notifications.deniedIos',
        'Aby odblokować: Ustawienia telefonu → [nazwa strony/apki] → Powiadomienia → Zezwól.',
      )
    } else if (android) {
      instructions = t(
        'notifications.deniedAndroid',
        'Aby odblokować: dotknij ikony kłódki obok adresu URL → Uprawnienia → Powiadomienia → Zezwól. Lub: Ustawienia telefonu → Aplikacje → Chrome → Uprawnienia → Powiadomienia.',
      )
    } else {
      instructions = t(
        'notifications.deniedDesktop',
        'Aby odblokować: kliknij ikonę kłódki/informacji przy pasku adresu → Powiadomienia → Zezwól.',
      )
    }

    return (
      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/5 border-b border-destructive/20 text-sm">
        <BellOff className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">
            {t('notifications.deniedTitle', 'Powiadomienia są zablokowane')}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            {instructions}
          </p>
          {ios && (
            <a
              href="https://support.apple.com/pl-pl/guide/iphone/iph7c3d96bab/ios"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-xs text-primary underline-offset-2 hover:underline"
            >
              {t('notifications.learnMore', 'Pomoc Apple')}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded hover:bg-accent transition-colors"
          aria-label={t('common.dismiss', 'Zamknij')}
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    )
  }

  // permissionState === 'default'
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border-b border-primary/20 text-sm">
      <Bell className="h-4 w-4 shrink-0 text-primary" />
      <span className="flex-1 text-foreground">
        {t('notifications.enableBanner', 'Włącz powiadomienia, aby otrzymywać wiadomości w czasie rzeczywistym.')}
      </span>
      <button
        onClick={onRequestPermission}
        disabled={isRegistering}
        className="shrink-0 px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {isRegistering
          ? t('notifications.enabling', 'Włączanie…')
          : t('notifications.enable', 'Włącz')}
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 rounded hover:bg-accent transition-colors"
        aria-label={t('common.dismiss', 'Zamknij')}
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  )
}
