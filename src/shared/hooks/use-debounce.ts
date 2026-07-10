import { useCallback, useRef, useState } from 'react'

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const updateValue = useCallback((newValue: T) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedValue(newValue), delay)
  }, [delay])

  // Keep in sync when value changes
  if (value !== debouncedValue) {
    updateValue(value)
  }

  return debouncedValue
}
