import { cn } from '@/shared/utils/cn'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <p className="text-sm text-muted-foreground">{message ?? t('errorState.message')}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          {t('errorState.retry')}
        </Button>
      )}
    </div>
  )
}
