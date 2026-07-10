import { useNavigate, useMatchRoute } from '@tanstack/react-router'
import { Home, MessageSquare, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/cn'

export function BottomNav({ orgId }: { orgId: string }) {
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  const { t } = useTranslation()

  const navItems = [
    {
      label: t('nav.home'),
      icon: <Home className="h-5 w-5" />,
      href: `/app/org/${orgId}/dashboard`,
    },
    {
      label: t('nav.messages'),
      icon: <MessageSquare className="h-5 w-5" />,
      href: `/app/org/${orgId}/messages`,
    },
    {
      label: t('nav.profile'),
      icon: <User className="h-5 w-5" />,
      href: `/app/org/${orgId}/profile`,
    },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-sidebar border-t border-sidebar-border bottom-nav-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = !!matchRoute({ to: item.href, fuzzy: true })
          return (
            <button
              key={item.label}
              onClick={() => navigate({ to: item.href })}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0 flex-1',
                isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground'
              )}
            >
              <span className={cn('transition-transform', isActive && 'scale-110')}>{item.icon}</span>
              <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
