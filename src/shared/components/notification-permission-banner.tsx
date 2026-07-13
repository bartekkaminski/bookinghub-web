import { useTranslation } from 'react-i18next'
import { Bell, BellOff, X } from 'lucide-react'
import { useState } from 'react'
import { type NotificationPermissionState } from '@/features/notifications/use-fcm'

interface Props {
  permissionState: NotificationPermissionState
  isRegistering: boolean
  onRequestPermission: () => void
}

/**
 * Banner zachęcający użytkownika do włączenia powiadomień push.
 * Pojawia się gdy zgoda nie została jeszcze udzielona ('default')
 * lub gdy użytkownik ją zablokował ('denied').
 */
export function NotificationPermissionBanner({ permissionState, isRegistering, onRequestPermission }: Props) {
  const { t } = useTranslation()
  const [dismissed, setDismissed] = useState(false)

  // Nie pokazuj bannera gdy: brak wsparcia, zgoda udzielona, banner zamknięty
  if (permissionState === 'unsupported') return null
  if (permissionState === 'granted') return null
  if (dismissed) return null

  if (permissionState === 'denied') {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-muted border-b border-border text-sm text-muted-foreground">
        <BellOff className="h-4 w-4 shrink-0 text-destructive" />
        <span className="flex-1">
          {t('notifications.deniedBanner', 'Powiadomienia są zablokowane. Odblokuj je w ustawieniach przeglądarki (ikona kłódki obok adresu URL).')}
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded hover:bg-accent transition-colors"
          aria-label={t('common.dismiss', 'Zamknij')}
        >
          <X className="h-3.5 w-3.5" />
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
