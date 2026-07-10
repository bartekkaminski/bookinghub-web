// Auto-generated from BookingHub.Api OpenAPI schema — do not edit manually
// Run `npm run generate-api` to regenerate from running API server

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthMeResponse {
  userId: string
  personId: string
  email: string
  firstName?: string
  lastName?: string
  fullName?: string
  photoUrl?: string
  isActive: boolean
  preferredLanguage: string
  memberships: AuthMembershipInfo[]
}

export interface AuthMembershipInfo {
  organizationId: string
  organizationName: string
  isActive: boolean
  roles: string[]
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface UserDetailResponse {
  id: string
  externalId: string
  authProvider: string
  email: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  personId?: string
}

export interface SetUserActiveRequest {
  isActive: boolean
}

export interface SetPreferredLanguageRequest {
  language: string
}

export interface RegisterDeviceTokenRequest {
  token: string
  platform: 'Web' | 'Android' | 'iOS'
}

export interface DeviceTokenResponse {
  id: string
  platform: 'Web' | 'Android' | 'iOS'
  createdAt: string
}

// ── Person ────────────────────────────────────────────────────────────────────

export interface PersonSummaryResponse {
  id: string
  firstName?: string
  lastName?: string
  fullName?: string
  photoUrl?: string
  dateOfBirth?: string
  hasAccount: boolean
}

export interface PersonDetailResponse {
  id: string
  firstName?: string
  lastName?: string
  fullName?: string
  photoUrl?: string
  dateOfBirth?: string
  hasAccount: boolean
  userId?: string
  email?: string
  memberships: PersonMembershipInfo[]
  children: PersonSummaryResponse[]
  parents: PersonSummaryResponse[]
  createdAt: string
  updatedAt: string
}

export interface PersonMembershipInfo {
  memberId: string
  organizationId: string
  organizationName: string
  roles: string[]
  isActive: boolean
}

export interface UpdatePersonRequest {
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  photoUrl?: string
}

export interface AddParentChildRequest {
  parentPersonId: string
  childPersonId: string
}

// ── Organization ──────────────────────────────────────────────────────────────

export interface OrganizationSummaryResponse {
  id: string
  name: string
  description?: string
  membersCount: number
}

export interface OrganizationDetailResponse {
  id: string
  name: string
  description?: string
  membersCount: number
  activeGroupsCount: number
  activeTeamsCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateOrganizationRequest {
  name: string
  description?: string
}

export interface UpdateOrganizationRequest {
  name: string
  description?: string
}

// ── Member ────────────────────────────────────────────────────────────────────

export interface MemberSummaryResponse {
  id: string
  personId: string
  organizationId: string
  displayName: string
  photoUrl?: string
  color?: string
  priority?: number
  isActive: boolean
  roles: string[]
}

export interface MemberDetailResponse {
  id: string
  personId: string
  organizationId: string
  displayName: string
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  photoUrl?: string
  color?: string
  priority?: number
  isActive: boolean
  roles: string[]
  groups: MemberGroupInfo[]
  teams: MemberTeamInfo[]
  assignedTrainers: MemberTrainerInfo[]
  createdAt: string
  updatedAt: string
}

export interface MemberGroupInfo {
  groupId: string
  groupName: string
}

export interface MemberTeamInfo {
  teamId: string
  teamName?: string
}

export interface MemberTrainerInfo {
  trainerId: string
  trainerName: string
}

export interface AddMemberRequest {
  personId: string
  roles: string[]
  displayName?: string
  color?: string
  priority?: number
}

export interface CreateMemberWithAccountRequest {
  firstName: string
  lastName: string
  email: string
  roles: string[]
  displayName?: string
  color?: string
  priority?: number
  dateOfBirth?: string
}

export interface CreateMemberProfileRequest {
  firstName: string
  lastName: string
  roles: string[]
  dateOfBirth?: string
  displayName?: string
  color?: string
  priority?: number
}

export interface UpdateMemberRequest {
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  displayName?: string
  photoUrl?: string
  color?: string
  priority?: number
}

export interface AddMemberRoleRequest {
  role: string
}

export interface SetMemberActiveRequest {
  isActive: boolean
}

export interface AssignTrainerToParticipantRequest {
  trainerMemberId: string
}

// ── Group ─────────────────────────────────────────────────────────────────────

export interface GroupSummaryResponse {
  id: string
  organizationId: string
  name: string
  description?: string
  color?: string
  isActive: boolean
  membersCount: number
  teamsCount: number
  currentMonthlyCost?: number
  currentCostCurrency?: string
}

export interface GroupDetailResponse {
  id: string
  organizationId: string
  name: string
  description?: string
  color?: string
  isActive: boolean
  members: GroupMemberInfo[]
  teams: GroupTeamInfo[]
  createdAt: string
  updatedAt: string
}

export interface GroupMemberInfo {
  memberId: string
  displayName: string
  photoUrl?: string
  roles: string[]
}

export interface GroupTeamInfo {
  teamId: string
  teamName?: string
}

export interface CreateGroupRequest {
  name: string
  description?: string
  color?: string
}

export interface UpdateGroupRequest {
  name: string
  description?: string
  color?: string
  isActive: boolean
}

export interface AddMemberToGroupRequest {
  organizationMemberId: string
}

export interface AddTeamToGroupRequest {
  teamId: string
}

// ── Team ──────────────────────────────────────────────────────────────────────

export interface TeamSummaryResponse {
  id: string
  organizationId: string
  name?: string
  priority?: number
  notes?: string
  isActive: boolean
  membersCount: number
}

export interface TeamDetailResponse {
  id: string
  organizationId: string
  name?: string
  priority?: number
  notes?: string
  isActive: boolean
  members: TeamMemberInfo[]
  trainers: TeamTrainerInfo[]
  createdAt: string
  updatedAt: string
}

export interface TeamMemberInfo {
  memberId: string
  displayName: string
  photoUrl?: string
}

export interface TeamTrainerInfo {
  trainerId: string
  displayName: string
  photoUrl?: string
}

export interface CreateTeamRequest {
  name?: string
  priority?: number
  notes?: string
}

export interface UpdateTeamRequest {
  name?: string
  priority?: number
  notes?: string
  isActive: boolean
}

export interface AddMemberToTeamRequest {
  organizationMemberId: string
}

export interface AssignTrainerToTeamRequest {
  trainerMemberId: string
}

// ── Location ──────────────────────────────────────────────────────────────────

export interface LocationSummaryResponse {
  id: string
  organizationId: string
  name: string
  address?: string
  description?: string
  isActive: boolean
}

export interface LocationDetailResponse {
  id: string
  organizationId: string
  name: string
  address?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateLocationRequest {
  name: string
  address?: string
  description?: string
}

export interface UpdateLocationRequest {
  name: string
  address?: string
  description?: string
  isActive: boolean
}

// ── Message ───────────────────────────────────────────────────────────────────

export interface MessageSummaryResponse {
  id: string
  subject: string
  body: string
  senderMemberId: string
  senderDisplayName: string
  sentAt: string
  isAutomatic: boolean
  isRead?: boolean
  replyCount: number
}

export interface MessageDetailResponse {
  id: string
  subject: string
  body: string
  senderMemberId: string
  senderDisplayName: string
  sentAt: string
  isAutomatic: boolean
  recipients: MessageRecipientInfo[]
  replies: MessageSummaryResponse[]
  relatedEventId?: string
  parentMessageId?: string
}

export interface MessageRecipientInfo {
  memberId: string
  displayName: string
  isRead: boolean
  readAt?: string
}

export interface SendMessageRequest {
  subject: string
  body: string
  recipientMemberIds: string[]
  relatedEventId?: string
}

export interface ReplyMessageRequest {
  body: string
}

export interface UnreadCountResponse {
  unreadCount: number
}

// ── Availability ──────────────────────────────────────────────────────────────

export interface AvailabilitySlotResponse {
  id: string
  organizationMemberId: string
  dayOfWeek: string
  startTime: string
  endTime: string
}

export interface AddAvailabilitySlotRequest {
  dayOfWeek: string
  startTime: string
  endTime: string
}

export interface UpdateAvailabilitySlotRequest {
  dayOfWeek: string
  startTime: string
  endTime: string
}

// ── Event ─────────────────────────────────────────────────────────────────────

export type EventStatus = 'Scheduled' | 'Cancelled' | 'Completed'
export type EventType = 'GroupTraining' | 'IndividualSession' | 'Camp' | 'Other'
export type EventEnrollmentStatus = 'Enrolled' | 'Cancelled' | 'Attended' | 'Absent'
export type CancellationStatus = 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn'

export interface EventSummaryResponse {
  id: string
  title: string
  startTime: string
  endTime: string
  eventType: EventType
  status: EventStatus
  color?: string
  locationId?: string
  locationName?: string
  groupId?: string
  groupName?: string
  enrollmentCount: number
}

export interface EventCalendarResponse {
  id: string
  title: string
  startTime: string
  endTime: string
  eventType: EventType
  status: EventStatus
  color?: string
  locationName?: string
  groupName?: string
}

// ── Filter Params ─────────────────────────────────────────────────────────────

export interface FilterParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortDescending?: boolean
}

export interface OrganizationFilterParams extends FilterParams {
  search?: string
}

export interface OrganizationMemberFilterParams extends FilterParams {
  search?: string
  role?: string
  isActive?: boolean
}

export interface GroupFilterParams extends FilterParams {
  search?: string
  isActive?: boolean
}

export interface TeamFilterParams extends FilterParams {
  search?: string
  isActive?: boolean
}

export interface LocationFilterParams extends FilterParams {
  search?: string
  isActive?: boolean
}

export interface MessageFilterParams extends FilterParams {
  search?: string
}
