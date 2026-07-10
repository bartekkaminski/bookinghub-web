import { cn } from '@/shared/utils/cn'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  back?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, back, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 min-h-14', className)}>
      {back && <div className="flex-shrink-0">{back}</div>}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold truncate">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
