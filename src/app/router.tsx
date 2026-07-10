import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
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

// Protected routes
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: ProtectedLayout,
})

const appIndexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/app',
  component: () => <OrgSelectPage />,
})

const orgSelectRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/app/org-select',
  component: OrgSelectPage,
})

// Org-scoped routes
const orgRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/app/org/$orgId',
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
      navigate({ to: `/app/org/${currentOrgId}/dashboard` })
    } else {
      navigate({ to: '/app/org-select' })
    }
  }, [navigate, currentOrgId])

  return null
}

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  callbackRoute,
  protectedRoute.addChildren([
    appIndexRoute,
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
    ]),
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
