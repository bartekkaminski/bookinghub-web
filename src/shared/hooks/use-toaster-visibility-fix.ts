import { useRef, useState, useEffect } from 'react'

/**
 * Naprawia bug Sonnera na iOS Safari/PWA: `visibilitychange` niemal zawsze wywołuje się
 * przy wejściu apki w tło, ale bardzo często NIE wywołuje się ponownie przy powrocie —
 * WebKit zamiast tego odtwarza stronę z bfcache i wysyła `pageshow` (persisted: true).
 * Sonner słucha tylko `visibilitychange`, więc jego wewnętrzny stan `isDocumentHidden`
 * zostaje "zamrożony" na `true` i przestaje odliczać auto-zamknięcie każdego toasta —
 * toasty przestają znikać i się kumulują.
 *
 * Rozwiązanie: wykryj powrót z tła (visibilitychange, pageshow, focus) i wymuś remount
 * <Toaster> (przez zmianę `key`), żeby jego stan `isDocumentHidden` odczytał na nowo
 * aktualny (poprawny) `document.hidden`.
 */
export function useToasterVisibilityFix() {
  const [remountKey, setRemountKey] = useState(0)
  const wasHiddenRef = useRef(document.hidden)

  useEffect(() => {
    const remount = () => setRemountKey((k) => k + 1)

    const onVisibilityChange = () => {
      if (document.hidden) {
        wasHiddenRef.current = true
        return
      }
      if (wasHiddenRef.current) {
        wasHiddenRef.current = false
        remount()
      }
    }

    // iOS często odtwarza stronę z bfcache po powrocie z tła — wtedy visibilitychange
    // się nie wywołuje, tylko pageshow z persisted: true.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted || wasHiddenRef.current) {
        wasHiddenRef.current = false
        remount()
      }
    }

    const onFocus = () => {
      if (wasHiddenRef.current) {
        wasHiddenRef.current = false
        remount()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('focus', onFocus)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  return remountKey
}
