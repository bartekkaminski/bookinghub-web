import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Wykrywa dostępność nowej wersji PWA i udostępnia funkcję do przeładowania.
 * Nowy Service Worker jest już pobrany i czeka — wywołanie `applyUpdate()` go aktywuje i przeładuje stronę.
 */
export function usePwaUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      setUpdateAvailable(true)
    },
  })

  useEffect(() => {
    // Sprawdzaj aktualizacje co 60 minut gdy aplikacja jest otwarta
    const interval = setInterval(() => {
      updateServiceWorker(false)
    }, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [updateServiceWorker])

  return {
    updateAvailable,
    applyUpdate: () => updateServiceWorker(true),
  }
}
