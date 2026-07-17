import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { LoginPage } from '@/features/auth/login-page'
import { CallbackPage } from '@/features/auth/callback-page'
import { ProtectedLayout } from '@/layouts/protected-layout'
import { OrgLayout } from '@/layouts/org-layout'
import { OrgSelectPage } from '@/features/organizations/org-select-page'
import { DashboardPage } from '@/features/organizations/dashboard-page'
import { MembersListPage } from '@/features/members/members-list-page'
import { MemberDetailPage } from '@/features/members/member-detail-page'
import { GroupsListPage } from '@/features/groups/groups-list-page'
import { GroupDetailPage } from '@/features/groups/group-detail-page'
import { TeamsListPage } from '@/features/teams/teams-list-page'
import { TeamDetailPage } from '@/features/teams/team-detail-page'
import { LocationsListPage } from '@/features/locations/locations-list-page'
import { LocationDetailPage } from '@/features/locations/location-detail-page'
import { ProfilePage } from '@/features/profile/profile-page'
import { ChildrenPage } from '@/features/children/children-page'
import { MessagesInboxPage } from '@/features/notifications/messages-inbox-page'
import { MessageDetailPage } from '@/features/notifications/message-detail-page'
import { CalendarPage } from '@/features/events/calendar-page'
import { EventDetailPage } from '@/features/events/event-detail-page'
import { PendingRequestsPage } from '@/features/enrollments/pending-requests-page'
import { AvailabilityPage } from '@/features/availability/availability-page'
import { DisciplinesListPage } from '@/features/disciplines/disciplines-list-page'
import { DisciplineDetailPage } from '@/features/disciplines/discipline-detail-page'
import { RankDetailPage } from '@/features/ranks/rank-detail-page'
import { useAuthStore } from '@/features/auth/auth-store'

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="relative w-full max-w-xl bg-background min-h-screen">
        <Outlet />
      </div>
    </div>
  ),
})

// Public routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const callbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: CallbackPage,
})

// Legacy /app prefix → strip and redirect (bookmarks / old push links)
function legacyAppRedirectHref(pathname: string, searchStr: string, hash: string) {
  const nextPath =
    pathname === '/app' || pathname === '/app/'
      ? '/'
      : pathname.replace(/^\/app/, '') || '/'
  return `${nextPath}${searchStr}${hash}`
}

const legacyAppExactRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  beforeLoad: ({ location }) => {
    throw redirect({
      href: legacyAppRedirectHref(location.pathname, location.searchStr, location.hash),
      replace: true,
    })
  },
})

const legacyAppSplatRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app/$',
  beforeLoad: ({ location }) => {
    throw redirect({
      href: legacyAppRedirectHref(location.pathname, location.searchStr, location.hash),
      replace: true,
    })
  },
})

// Protected routes
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: ProtectedLayout,
})

const orgSelectRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/org-select',
  component: OrgSelectPage,
})

// Org-scoped routes
const orgRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/org/$orgId',
  component: OrgLayout,
})

const dashboardRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/dashboard',
  component: DashboardPage,
})

const membersRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/members',
  component: MembersListPage,
})

const memberDetailRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/members/$memberId',
  component: MemberDetailPage,
})

const groupsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/groups',
  component: GroupsListPage,
})

const groupDetailRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/groups/$groupId',
  component: GroupDetailPage,
})

const teamsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/teams',
  component: TeamsListPage,
})

const teamDetailRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/teams/$teamId',
  component: TeamDetailPage,
})

const locationsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/locations',
  component: LocationsListPage,
})

const locationDetailRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/locations/$locationId',
  component: LocationDetailPage,
})

const profileRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/profile',
  component: ProfilePage,
})

const childrenRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/children',
  component: ChildrenPage,
})

const messagesRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/messages',
  component: MessagesInboxPage,
})

const messageDetailRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/messages/$messageId',
  component: MessageDetailPage,
})

const calendarRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/calendar',
  component: CalendarPage,
})

const eventDetailRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/events/$eventId',
  component: EventDetailPage,
})

const pendingRequestsRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/pending-requests',
  component: PendingRequestsPage,
})

const availabilityRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/availability',
  component: AvailabilityPage,
})

const memberAvailabilityRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/members/$memberId/availability',
  component: AvailabilityPage,
})

const disciplinesRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/disciplines',
  component: DisciplinesListPage,
})

const disciplineDetailRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/disciplines/$disciplineId',
  component: DisciplineDetailPage,
})

const rankDetailRoute = createRoute({
  getParentRoute: () => orgRoute,
  path: '/disciplines/$disciplineId/ranks/$rankId',
  component: RankDetailPage,
})

// Index redirect
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRedirect,
})

function IndexRedirect() {
  const navigate = useNavigate()
  const { currentOrgId } = useAuthStore()

  useEffect(() => {
    if (currentOrgId) {
      navigate({ to: `/org/${currentOrgId}/dashboard` })
    } else {
      navigate({ to: '/org-select' })
    }
  }, [navigate, currentOrgId])

  return null
}

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  callbackRoute,
  legacyAppExactRedirectRoute,
  legacyAppSplatRedirectRoute,
  protectedRoute.addChildren([
    orgSelectRoute,
    orgRoute.addChildren([
      dashboardRoute,
      membersRoute,
      memberDetailRoute,
      groupsRoute,
      groupDetailRoute,
      teamsRoute,
      teamDetailRoute,
      locationsRoute,
      locationDetailRoute,
      profileRoute,
      childrenRoute,
      messagesRoute,
      messageDetailRoute,
      calendarRoute,
      eventDetailRoute,
      pendingRequestsRoute,
      availabilityRoute,
      memberAvailabilityRoute,
      disciplinesRoute,
      disciplineDetailRoute,
      rankDetailRoute,
    ]),
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
