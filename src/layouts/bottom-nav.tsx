import { useNavigate, useMatchRoute } from '@tanstack/react-router'
import { Home, CalendarDays, MessageSquare, User, ClipboardList, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/features/auth/auth-store'
import { usePendingCancellationRequests } from '@/features/enrollments/use-cancellation-requests'
import { usePendingEnrollmentRequests } from '@/features/enrollments/use-enrollments'
import { useUnreadCount } from '@/features/notifications/use-messages'
import { cn } from '@/shared/utils/cn'

export function BottomNav({ orgId }: { orgId: string }) {
  const navigate = useNavigate()
  const matchRoute = useMatchRoute()
  const { t } = useTranslation()
  const { isAdminOrManager, isTrainer } = useAuthStore()

  const canSeeOrgLists = isAdminOrManager() || isTrainer()
  const isParticipantOnly = !canSeeOrgLists

  const { data: pendingCancellations } = usePendingCancellationRequests(canSeeOrgLists ? orgId : '')
  const { data: pendingEnrollments } = usePendingEnrollmentRequests(canSeeOrgLists ? orgId : '')
  const pendingCount = (pendingCancellations?.length ?? 0) + (pendingEnrollments?.length ?? 0)

  const { data: unreadData } = useUnreadCount(orgId)
  const unreadCount = unreadData?.unreadCount ?? 0

  const baseItems = isParticipantOnly
    ? [
        {
          key: 'calendar',
          label: t('nav.calendar'),
          icon: <CalendarDays className="h-5 w-5" />,
          href: `/app/org/${orgId}/calendar`,
        },
        {
          key: 'locations',
          label: t('nav.locations'),
          icon: <MapPin className="h-5 w-5" />,
          href: `/app/org/${orgId}/locations`,
        },
        {
          key: 'messages',
          label: t('nav.messages'),
          icon: <MessageSquare className="h-5 w-5" />,
          href: `/app/org/${orgId}/messages`,
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        {
          key: 'profile',
          label: t('nav.profile'),
          icon: <User className="h-5 w-5" />,
          href: `/app/org/${orgId}/profile`,
        },
      ]
    : [
        {
          key: 'home',
          label: t('nav.home'),
          icon: <Home className="h-5 w-5" />,
          href: `/app/org/${orgId}/dashboard`,
        },
        {
          key: 'calendar',
          label: t('nav.calendar'),
          icon: <CalendarDays className="h-5 w-5" />,
          href: `/app/org/${orgId}/calendar`,
        },
        {
          key: 'messages',
          label: t('nav.messages'),
          icon: <MessageSquare className="h-5 w-5" />,
          href: `/app/org/${orgId}/messages`,
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        ...(canSeeOrgLists ? [{
          key: 'requests',
          label: t('nav.requests'),
          icon: <ClipboardList className="h-5 w-5" />,
          href: `/app/org/${orgId}/pending-requests`,
          badge: pendingCount > 0 ? pendingCount : undefined,
        }] : []),
        {
          key: 'profile',
          label: t('nav.profile'),
          icon: <User className="h-5 w-5" />,
          href: `/app/org/${orgId}/profile`,
        },
      ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-sidebar border-t border-sidebar-border bottom-nav-safe">
      <div className="flex items-center justify-around h-16">
        {baseItems.map((item) => {
          const isActive = !!matchRoute({ to: item.href, fuzzy: true })
          return (
            <button
              key={item.key}
              onClick={() => navigate({ to: item.href })}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0 flex-1',
                isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground'
              )}
            >
              <span className={cn('relative transition-transform', isActive && 'scale-110')}>
                {item.icon}
                {'badge' in item && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center leading-none">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
