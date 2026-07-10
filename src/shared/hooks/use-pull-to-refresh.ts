import { useCallback, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
}

export function usePullToRefresh({ onRefresh, threshold = 80 }: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current
    if (diff > 0 && !isRefreshing) {
      setIsPulling(diff > threshold / 2)
    }
  }, [isRefreshing, threshold])

  const handleTouchEnd = useCallback(async () => {
    const diff = currentY.current - startY.current
    if (diff > threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setIsPulling(false)
  }, [isRefreshing, onRefresh, threshold])

  return { isPulling, isRefreshing, handleTouchStart, handleTouchMove, handleTouchEnd }
}
