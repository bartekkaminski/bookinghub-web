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
  memberId: string
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
  /** Unikalny kod profilu — widoczny tylko właścicielowi konta, null gdy osoba bez konta */
  profileCode?: string
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

export interface OrganizationCreationLimitsResponse {
  maxOrganizationsPerCreator: number
  createdByMeCount: number
  canCreate: boolean
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
  hasAccount: boolean
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
  color?: string
}

export interface MemberTeamInfo {
  teamId: string
  teamName?: string
}

export interface MemberTrainerInfo {
  trainerMemberId: string
  displayName: string
  color?: string
}

export interface MemberLookupResponse {
  personId: string
  fullName: string
  isAlreadyMember: boolean
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

export interface AttachAccountRequest {
  email: string
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
  trainerMemberId: string
  displayName: string
  color?: string
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

// ── Location Schedule ─────────────────────────────────────────────────────────

export type LocationOccupancy = 'None' | 'Partial' | 'Full'

export interface LocationDaySummary {
  date: string           // 'YYYY-MM-DD'
  eventCount: number
  coveredHours: number
  occupancy: LocationOccupancy
}

export interface LocationMonthSummaryResponse {
  year: number
  month: number
  days: LocationDaySummary[]
}

export interface LocationDayTeamInfo {
  teamId: string
  teamName?: string
  memberCount: number
}

export interface LocationDayEventResponse {
  id: string
  title: string
  startTime: string
  endTime: string
  eventType: EventType
  status: EventStatus
  color: string
  groupId?: string
  groupName?: string
  individualCount: number
  teams: LocationDayTeamInfo[]
}

export interface LocationDayScheduleResponse {
  date: string           // 'YYYY-MM-DD'
  events: LocationDayEventResponse[]
}

// ── Message ───────────────────────────────────────────────────────────────────

export interface MessageSummaryResponse {
  id: string
  subject: string
  bodyPreview: string
  senderMemberId: string
  senderName: string
  sentAt: string
  isAutomatic: boolean
  isRead?: boolean
  recipientsCount: number
  repliesCount: number
  relatedEventId?: string
  parentMessageId?: string
}

export interface ConversationSummaryResponse {
  id: string
  subject: string
  sentAt: string
  lastMessageAt: string
  lastMessagePreview: string
  lastSenderName: string
  hasUnread: boolean
  unreadCount: number
  repliesCount: number
  isAutomatic: boolean
  initiatedByMe: boolean
  otherPartyName: string
  otherPartyMemberId?: string
  participantsCount: number
  relatedEventId?: string
  relatedEventTitle?: string
}

export interface MessageDetailResponse {
  id: string
  organizationId: string
  subject: string
  body: string
  senderMemberId: string
  senderName: string
  senderPhotoUrl?: string
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

/** Nazwy dni tygodnia — serialization C# DayOfWeek z JsonStringEnumConverter */
export type DayOfWeekName =
  | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday'
  | 'Thursday' | 'Friday' | 'Saturday'

export interface AvailabilitySlotResponse {
  id: string
  organizationMemberId: string
  dayOfWeek: DayOfWeekName   // "Monday", "Tuesday" itd.
  timeFrom: string           // "HH:mm:ss" — TimeOnly
  timeTo: string             // "HH:mm:ss" — TimeOnly
  validFrom: string | null   // "yyyy-MM-dd" lub null (od zawsze)
  validTo: string | null     // "yyyy-MM-dd" lub null (bezterminowo)
}

export interface AddAvailabilitySlotRequest {
  dayOfWeek: DayOfWeekName
  timeFrom: string           // "HH:mm:ss"
  timeTo: string             // "HH:mm:ss"
  validFrom?: string | null  // "yyyy-MM-dd" lub null
  validTo?: string | null    // "yyyy-MM-dd" lub null
}

export interface UpdateAvailabilitySlotRequest {
  dayOfWeek: DayOfWeekName
  timeFrom: string
  timeTo: string
  validFrom?: string | null
  validTo?: string | null
}

/** Typ bloku w scalonym grafiku. Unavailable NIE jest zwracane przez API. */
export type ScheduleBlockType = 'Available' | 'Busy'

export interface ScheduleEventInfo {
  eventId: string
  title: string
  color: string | null
  eventType: string
}

export interface ScheduleBlock {
  timeFrom: string          // "HH:mm:ss"
  timeTo: string            // "HH:mm:ss"
  type: ScheduleBlockType
  /** Id slotu (MemberAvailability) — pozwala otworzyć edycję po kliknięciu bloku */
  slotId: string
  event: ScheduleEventInfo | null
}

export interface MemberScheduleResponse {
  date: string              // "yyyy-MM-dd"
  blocks: ScheduleBlock[]
}

export interface AvailabilityCheckResponse {
  checkFrom: string         // ISO DateTime
  checkTo: string           // ISO DateTime
  members: MemberAvailabilityInfo[]
}

export interface MemberAvailabilityInfo {
  memberId: string
  displayName: string
  isAvailable: boolean
  matchingSlots: AvailabilitySlotResponse[]
}

// ── Event ─────────────────────────────────────────────────────────────────────

export type EventStatus = 'Scheduled' | 'Cancelled' | 'Completed'
export type EventType = 'GroupTraining' | 'IndividualSession' | 'Camp' | 'Other'
export type EventEnrollmentStatus = 'PendingApproval' | 'Enrolled' | 'Cancelled' | 'Attended' | 'Absent'
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
  enrolledCount: number
  trainerNames: string[]
  eventSeriesId?: string
}

export interface EventDetailResponse {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  eventType: EventType
  status: EventStatus
  color?: string
  locationId?: string
  locationName?: string
  groupId?: string
  groupName?: string
  eventSeriesId?: string
  eventSeriesTitle?: string
  trainers: EventTrainerInfo[]
  enrollments: EventEnrollmentInfo[]
  teamEnrollments: EventTeamEnrollmentInfo[]
  unitCost?: number
  currency?: string
  createdAt: string
  updatedAt: string
}

export interface EventTrainerInfo {
  memberId: string
  displayName: string
  photoUrl?: string
}

export interface EventEnrollmentInfo {
  id: string
  memberId: string
  displayName: string
  photoUrl?: string
  status: EventEnrollmentStatus
}

export interface EventTeamEnrollmentInfo {
  id: string
  teamId: string
  teamName?: string
  status: EventEnrollmentStatus
  memberCount: number
}

export interface CreateEventRequest {
  title: string
  description?: string
  startTime: string
  endTime: string
  eventType: EventType
  locationId?: string
  groupId?: string
  eventSeriesId?: string
  color?: string
  unitCost?: number
  currency?: string
}

export interface UpdateEventRequest {
  title: string
  description?: string
  startTime: string
  endTime: string
  eventType: EventType
  locationId?: string
  groupId?: string
  color?: string
  unitCost?: number
  currency?: string
}

export interface CancelEventRequest {
  reason?: string
  notifyEnrolled?: boolean
}

export interface AssignTrainerToEventRequest {
  organizationMemberId: string
}

export interface CalendarRequest {
  from: string
  to: string
  groupId?: string
  locationId?: string
  eventType?: EventType
  status?: EventStatus
}

export interface EventSeriesSummaryResponse {
  id: string
  title: string
  description?: string
  recurrenceRule?: string
  defaultGroupId?: string
  defaultGroupName?: string
  defaultLocationId?: string
  defaultLocationName?: string
  defaultColor?: string
  defaultEventType: EventType
  isActive: boolean
}

export interface EventSeriesDetailResponse {
  id: string
  title: string
  description?: string
  recurrenceRule?: string
  defaultGroupId?: string
  defaultGroupName?: string
  defaultLocationId?: string
  defaultLocationName?: string
  defaultColor?: string
  defaultEventType: EventType
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateEventSeriesRequest {
  title: string
  description?: string
  recurrenceRule?: string
  defaultGroupId?: string
  defaultLocationId?: string
  defaultColor?: string
  defaultEventType?: EventType
}

export interface UpdateEventSeriesRequest {
  title: string
  description?: string
  recurrenceRule?: string
  defaultGroupId?: string
  defaultLocationId?: string
  defaultColor?: string
  defaultEventType: EventType
  isActive: boolean
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

export interface EventFilterParams extends FilterParams {
  eventSeriesId?: string
  groupId?: string
  locationId?: string
  eventType?: EventType
  status?: EventStatus
  startFrom?: string
  startTo?: string
  search?: string
}

export interface EventSeriesFilterParams extends FilterParams {
  search?: string
  defaultGroupId?: string
  defaultLocationId?: string
  defaultEventType?: EventType
  isActive?: boolean
}

// ── Generate Events ───────────────────────────────────────────────────────────

export interface GenerateEventsRequest {
  /** Data początkowa zakresu "YYYY-MM-DD" */
  dateFrom: string
  /** Data końcowa zakresu "YYYY-MM-DD" */
  dateTo: string
  /** Godzina rozpoczęcia "HH:mm" */
  startTime: string
  /** Godzina zakończenia "HH:mm" */
  endTime: string
  overrideLocationId?: string
  overrideGroupId?: string
  overrideColor?: string
}

export interface GenerateEventsResponse {
  generatedCount: number
  skippedCount: number
}

// ── Enrollments ───────────────────────────────────────────────────────────────

export type EventEnrollmentFilterStatus = 'PendingApproval' | 'Enrolled' | 'Cancelled' | 'Attended' | 'Absent'

export interface EventEnrollmentFilterParams extends FilterParams {
  status?: EventEnrollmentFilterStatus
}

export interface EnrollmentSummaryResponse {
  id: string
  eventId: string
  eventTitle: string
  eventStartTime: string
  organizationMemberId: string
  memberDisplayName: string
  status: EventEnrollmentStatus
  hasPendingCancellation: boolean
  createdAt: string
}

export interface CancellationRequestInfo {
  id: string
  reason?: string
  requestedAt: string
  status: string
  reviewNote?: string
  reviewedAt?: string
}

export interface EnrollmentDetailResponse {
  id: string
  eventId: string
  organizationId: string
  eventTitle: string
  eventStartTime: string
  eventEndTime: string
  organizationMemberId: string
  memberDisplayName: string
  status: EventEnrollmentStatus
  cancellationRequests: CancellationRequestInfo[]
  createdAt: string
}

export interface TeamEnrollmentSummaryResponse {
  id: string
  eventId: string
  eventTitle: string
  eventStartTime: string
  teamId: string
  teamName?: string
  status: EventEnrollmentStatus
  membersCount: number
  createdAt: string
}

export interface EnrollMemberRequest {
  organizationMemberId: string
}

export interface EnrollTeamRequest {
  teamId: string
}

export interface SetEnrollmentStatusRequest {
  status: EventEnrollmentStatus
}

export interface BulkAttendanceRequest {
  enrollmentIds: string[]
}

// ── Enrollment Requests (PendingApproval flow) ────────────────────────────────

export interface RequestEnrollmentRequest {
  reason?: string
}

export interface ReviewEnrollmentRequestRequest {
  approved: boolean
  reviewNote?: string
}

export interface EnrollmentRequestSummaryResponse {
  id: string
  eventId: string
  eventTitle: string
  eventStartTime: string
  organizationMemberId: string
  memberDisplayName: string
  reason?: string
  requestedAt: string
}

// ── Cancellation Requests ─────────────────────────────────────────────────────

export interface CancellationRequestFilterParams extends FilterParams {
  status?: CancellationStatus
  memberId?: string
}

export interface CancellationRequestSummaryResponse {
  id: string
  eventEnrollmentId: string
  eventId: string
  eventTitle: string
  eventStartTime: string
  requestedByMemberId: string
  requestedByName: string
  reason?: string
  requestedAt: string
  status: CancellationStatus
}

export interface CancellationRequestDetailResponse {
  id: string
  eventEnrollmentId: string
  eventId: string
  organizationId: string
  eventTitle: string
  eventStartTime: string
  requestedByMemberId: string
  requestedByName: string
  reason?: string
  requestedAt: string
  status: CancellationStatus
  reviewedByPersonId?: string
  reviewedByName?: string
  reviewedAt?: string
  reviewNote?: string
  createdAt: string
}

export interface CreateCancellationRequest {
  reason?: string
}

export interface ReviewCancellationRequest {
  decision: CancellationStatus
  reviewNote?: string
}
