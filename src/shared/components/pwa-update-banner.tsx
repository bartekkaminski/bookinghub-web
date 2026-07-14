import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { usePwaUpdate } from '@/shared/hooks/use-pwa-update'

/**
 * Baner pojawiający się na środku ekranu gdy dostępna jest nowa wersja aplikacji.
 * Użytkownik musi ręcznie kliknąć "Odśwież" — nie robimy automatycznego reloadu
 * żeby nie przerywać pracy (np. wypełniania formularza).
 */
export function PwaUpdateBanner() {
  const { t } = useTranslation()
  const { updateAvailable, applyUpdate } = usePwaUpdate()

  if (!updateAvailable) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      <div
        className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-2xl shadow-black/30"
        role="alert"
      >
        <RefreshCw className="size-5 shrink-0 text-primary" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">
            {t('pwa.updateAvailable', 'Dostępna nowa wersja')}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('pwa.updateDescription', 'Kliknij aby załadować aktualizację')}
          </span>
        </div>
        <Button size="sm" className="ml-2 shrink-0" onClick={applyUpdate}>
          {t('pwa.updateButton', 'Odśwież')}
        </Button>
      </div>
    </div>
  )
}
