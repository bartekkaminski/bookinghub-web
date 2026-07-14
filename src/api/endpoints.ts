import { api } from './client'
import type {
  AvailabilitySlotResponse,
  AddAvailabilitySlotRequest,
  UpdateAvailabilitySlotRequest,
  MemberScheduleResponse,
  AvailabilityCheckResponse,
  AuthMeResponse,
  UserDetailResponse,
  SetUserActiveRequest,
  RegisterDeviceTokenRequest,
  DeviceTokenResponse,
  PersonDetailResponse,
  PersonSummaryResponse,
  UpdatePersonRequest,
  AddParentChildRequest,
  OrganizationSummaryResponse,
  OrganizationDetailResponse,
  OrganizationCreationLimitsResponse,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  MemberSummaryResponse,
  MemberDetailResponse,
  MemberLookupResponse,
  AddMemberRequest,
  CreateMemberWithAccountRequest,
  CreateMemberProfileRequest,
  UpdateMemberRequest,
  AddMemberRoleRequest,
  SetMemberActiveRequest,
  AssignTrainerToParticipantRequest,
  GroupSummaryResponse,
  GroupDetailResponse,
  CreateGroupRequest,
  UpdateGroupRequest,
  AddMemberToGroupRequest,
  AddTeamToGroupRequest,
  TeamSummaryResponse,
  TeamDetailResponse,
  CreateTeamRequest,
  UpdateTeamRequest,
  AddMemberToTeamRequest,
  AssignTrainerToTeamRequest,
  LocationSummaryResponse,
  LocationDetailResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  LocationMonthSummaryResponse,
  LocationDayScheduleResponse,
  MessageSummaryResponse,
  ConversationSummaryResponse,
  MessageDetailResponse,
  SendMessageRequest,
  ReplyMessageRequest,
  UnreadCountResponse,
  EventSummaryResponse,
  EventCalendarResponse,
  EventDetailResponse,
  CreateEventRequest,
  UpdateEventRequest,
  CancelEventRequest,
  AssignTrainerToEventRequest,
  CalendarRequest,
  EventFilterParams,
  EventSeriesSummaryResponse,
  EventSeriesDetailResponse,
  CreateEventSeriesRequest,
  UpdateEventSeriesRequest,
  EventSeriesFilterParams,
  GenerateEventsRequest,
  GenerateEventsResponse,
  EnrollmentSummaryResponse,
  EnrollmentDetailResponse,
  TeamEnrollmentSummaryResponse,
  EnrollMemberRequest,
  EnrollTeamRequest,
  SetEnrollmentStatusRequest,
  BulkAttendanceRequest,
  EventEnrollmentFilterParams,
  RequestEnrollmentRequest,
  ReviewEnrollmentRequestRequest,
  EnrollmentRequestSummaryResponse,
  CancellationRequestSummaryResponse,
  CancellationRequestDetailResponse,
  CreateCancellationRequest,
  ReviewCancellationRequest,
  CancellationRequestFilterParams,
  PagedResult,
  OrganizationFilterParams,
  OrganizationMemberFilterParams,
  GroupFilterParams,
  TeamFilterParams,
  LocationFilterParams,
  MessageFilterParams,
} from './types'

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  me: () => api.post<AuthMeResponse>('/api/auth/me'),
  getMe: () => api.get<AuthMeResponse>('/api/auth/me'),
  setLanguage: (language: string) => api.patch<void>('/api/auth/me/language', { language }),
}

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  getById: (id: string) =>
    api.get<UserDetailResponse>(`/api/users/${id}`),

  setActive: (id: string, data: SetUserActiveRequest) =>
    api.patch<UserDetailResponse>(`/api/users/${id}/active`, data),

  delete: (id: string) =>
    api.delete(`/api/users/${id}`),

  registerDeviceToken: (id: string, data: RegisterDeviceTokenRequest) =>
    api.post<DeviceTokenResponse>(`/api/users/${id}/device-tokens`, data),

  deleteDeviceToken: (id: string, token: string) =>
    api.delete(`/api/users/${id}/device-tokens/${encodeURIComponent(token)}`),
}

// ── Persons ───────────────────────────────────────────────────────────────────

export const personsApi = {
  getMe: () =>
    api.get<PersonDetailResponse>('/api/persons/me'),

  getById: (personId: string) =>
    api.get<PersonDetailResponse>(`/api/persons/${personId}`),

  update: (personId: string, data: UpdatePersonRequest) =>
    api.put<PersonDetailResponse>(`/api/persons/${personId}`, data),

  getChildren: (personId: string) =>
    api.get<PersonSummaryResponse[]>(`/api/persons/${personId}/children`),

  addChild: (personId: string, data: AddParentChildRequest) =>
    api.post<void>(`/api/persons/${personId}/children`, data),

  removeChild: (personId: string, childPersonId: string) =>
    api.delete(`/api/persons/${personId}/children/${childPersonId}`),
}

// ── Organizations ─────────────────────────────────────────────────────────────

export const organizationsApi = {
  list: (params?: OrganizationFilterParams) =>
    api.get<PagedResult<OrganizationSummaryResponse>>('/api/organizations', params as Record<string, string | number | boolean | undefined>),

  getById: (organizationId: string) =>
    api.get<OrganizationDetailResponse>(`/api/organizations/${organizationId}`),

  getCreationLimits: () =>
    api.get<OrganizationCreationLimitsResponse>('/api/organizations/limits'),

  create: (data: CreateOrganizationRequest) =>
    api.post<OrganizationDetailResponse>('/api/organizations', data),

  update: (organizationId: string, data: UpdateOrganizationRequest) =>
    api.put<OrganizationDetailResponse>(`/api/organizations/${organizationId}`, data),

  delete: (organizationId: string) =>
    api.delete(`/api/organizations/${organizationId}`),
}

// ── Members ───────────────────────────────────────────────────────────────────

export const membersApi = {
  list: (organizationId: string, params?: OrganizationMemberFilterParams) =>
    api.get<PagedResult<MemberSummaryResponse>>(
      `/api/organizations/${organizationId}/members`,
      params as Record<string, string | number | boolean | undefined>
    ),

  listAll: (organizationId: string) =>
    api.get<MemberSummaryResponse[]>(`/api/organizations/${organizationId}/members/all`),

  listTrainers: (organizationId: string) =>
    api.get<MemberSummaryResponse[]>(`/api/organizations/${organizationId}/members/trainers`),

  listParticipants: (organizationId: string) =>
    api.get<MemberSummaryResponse[]>(`/api/organizations/${organizationId}/members/participants`),

  getById: (organizationId: string, memberId: string) =>
    api.get<MemberDetailResponse>(`/api/organizations/${organizationId}/members/${memberId}`),

  findByCode: (organizationId: string, code: string) =>
    api.get<MemberLookupResponse>(
      `/api/organizations/${organizationId}/members/find-by-code`,
      { code: code.trim().toUpperCase() }
    ),

  addExisting: (organizationId: string, data: AddMemberRequest) =>
    api.post<MemberDetailResponse>(`/api/organizations/${organizationId}/members/add-existing`, data),

  createWithAccount: (organizationId: string, data: CreateMemberWithAccountRequest) =>
    api.post<MemberDetailResponse>(`/api/organizations/${organizationId}/members/create-with-account`, data),

  createProfile: (organizationId: string, data: CreateMemberProfileRequest) =>
    api.post<MemberDetailResponse>(`/api/organizations/${organizationId}/members/create-profile`, data),

  update: (organizationId: string, memberId: string, data: UpdateMemberRequest) =>
    api.put<MemberDetailResponse>(`/api/organizations/${organizationId}/members/${memberId}`, data),

  setActive: (organizationId: string, memberId: string, data: SetMemberActiveRequest) =>
    api.patch<MemberDetailResponse>(`/api/organizations/${organizationId}/members/${memberId}/active`, data),

  addRole: (organizationId: string, memberId: string, data: AddMemberRoleRequest) =>
    api.post<MemberDetailResponse>(`/api/organizations/${organizationId}/members/${memberId}/roles`, data),

  removeRole: (organizationId: string, memberId: string, role: string) =>
    api.delete<MemberDetailResponse>(`/api/organizations/${organizationId}/members/${memberId}/roles/${role}`),

  assignTrainer: (organizationId: string, memberId: string, data: AssignTrainerToParticipantRequest) =>
    api.post<void>(`/api/organizations/${organizationId}/members/${memberId}/trainers`, data),

  removeTrainer: (organizationId: string, memberId: string, trainerId: string) =>
    api.delete(`/api/organizations/${organizationId}/members/${memberId}/trainers/${trainerId}`),

  delete: (organizationId: string, memberId: string) =>
    api.delete(`/api/organizations/${organizationId}/members/${memberId}`),
}

// ── Groups ────────────────────────────────────────────────────────────────────

export const groupsApi = {
  list: (organizationId: string, params?: GroupFilterParams) =>
    api.get<PagedResult<GroupSummaryResponse>>(
      `/api/organizations/${organizationId}/groups`,
      params as Record<string, string | number | boolean | undefined>
    ),

  listAll: (organizationId: string) =>
    api.get<GroupSummaryResponse[]>(`/api/organizations/${organizationId}/groups/all`),

  getById: (organizationId: string, groupId: string) =>
    api.get<GroupDetailResponse>(`/api/organizations/${organizationId}/groups/${groupId}`),

  create: (organizationId: string, data: CreateGroupRequest) =>
    api.post<GroupDetailResponse>(`/api/organizations/${organizationId}/groups`, data),

  update: (organizationId: string, groupId: string, data: UpdateGroupRequest) =>
    api.put<GroupDetailResponse>(`/api/organizations/${organizationId}/groups/${groupId}`, data),

  delete: (organizationId: string, groupId: string) =>
    api.delete(`/api/organizations/${organizationId}/groups/${groupId}`),

  addMember: (organizationId: string, groupId: string, data: AddMemberToGroupRequest) =>
    api.post<void>(`/api/organizations/${organizationId}/groups/${groupId}/members`, data),

  removeMember: (organizationId: string, groupId: string, memberId: string) =>
    api.delete(`/api/organizations/${organizationId}/groups/${groupId}/members/${memberId}`),

  addTeam: (organizationId: string, groupId: string, data: AddTeamToGroupRequest) =>
    api.post<void>(`/api/organizations/${organizationId}/groups/${groupId}/teams`, data),

  removeTeam: (organizationId: string, groupId: string, teamId: string) =>
    api.delete(`/api/organizations/${organizationId}/groups/${groupId}/teams/${teamId}`),
}

// ── Teams ─────────────────────────────────────────────────────────────────────

export const teamsApi = {
  list: (organizationId: string, params?: TeamFilterParams) =>
    api.get<PagedResult<TeamSummaryResponse>>(
      `/api/organizations/${organizationId}/teams`,
      params as Record<string, string | number | boolean | undefined>
    ),

  listAll: (organizationId: string) =>
    api.get<TeamSummaryResponse[]>(`/api/organizations/${organizationId}/teams/all`),

  getById: (organizationId: string, teamId: string) =>
    api.get<TeamDetailResponse>(`/api/organizations/${organizationId}/teams/${teamId}`),

  create: (organizationId: string, data: CreateTeamRequest) =>
    api.post<TeamDetailResponse>(`/api/organizations/${organizationId}/teams`, data),

  update: (organizationId: string, teamId: string, data: UpdateTeamRequest) =>
    api.put<TeamDetailResponse>(`/api/organizations/${organizationId}/teams/${teamId}`, data),

  delete: (organizationId: string, teamId: string) =>
    api.delete(`/api/organizations/${organizationId}/teams/${teamId}`),

  addMember: (organizationId: string, teamId: string, data: AddMemberToTeamRequest) =>
    api.post<void>(`/api/organizations/${organizationId}/teams/${teamId}/members`, data),

  removeMember: (organizationId: string, teamId: string, memberId: string) =>
    api.delete(`/api/organizations/${organizationId}/teams/${teamId}/members/${memberId}`),

  assignTrainer: (organizationId: string, teamId: string, data: AssignTrainerToTeamRequest) =>
    api.post<void>(`/api/organizations/${organizationId}/teams/${teamId}/trainers`, data),

  removeTrainer: (organizationId: string, teamId: string, trainerId: string) =>
    api.delete(`/api/organizations/${organizationId}/teams/${teamId}/trainers/${trainerId}`),
}

// ── Locations ─────────────────────────────────────────────────────────────────

export const locationsApi = {
  list: (organizationId: string, params?: LocationFilterParams) =>
    api.get<PagedResult<LocationSummaryResponse>>(
      `/api/organizations/${organizationId}/locations`,
      params as Record<string, string | number | boolean | undefined>
    ),

  listAll: (organizationId: string) =>
    api.get<LocationSummaryResponse[]>(`/api/organizations/${organizationId}/locations/all`),

  getById: (organizationId: string, locationId: string) =>
    api.get<LocationDetailResponse>(`/api/organizations/${organizationId}/locations/${locationId}`),

  create: (organizationId: string, data: CreateLocationRequest) =>
    api.post<LocationDetailResponse>(`/api/organizations/${organizationId}/locations`, data),

  update: (organizationId: string, locationId: string, data: UpdateLocationRequest) =>
    api.put<LocationDetailResponse>(`/api/organizations/${organizationId}/locations/${locationId}`, data),

  delete: (organizationId: string, locationId: string) =>
    api.delete(`/api/organizations/${organizationId}/locations/${locationId}`),

  monthSchedule: (organizationId: string, locationId: string, year: number, month: number) =>
    api.get<LocationMonthSummaryResponse>(
      `/api/organizations/${organizationId}/locations/${locationId}/schedule/month`,
      { year, month }
    ),

  daySchedule: (organizationId: string, locationId: string, date: string) =>
    api.get<LocationDayScheduleResponse>(
      `/api/organizations/${organizationId}/locations/${locationId}/schedule/day`,
      { date }
    ),
}

// ── Events ────────────────────────────────────────────────────────────────────

export const eventsApi = {
  list: (organizationId: string, params?: EventFilterParams) =>
    api.get<PagedResult<EventSummaryResponse>>(
      `/api/organizations/${organizationId}/events`,
      params as Record<string, string | number | boolean | undefined>
    ),

  calendar: (organizationId: string, params: CalendarRequest) =>
    api.get<EventCalendarResponse[]>(
      `/api/organizations/${organizationId}/events/calendar`,
      params as unknown as Record<string, string | number | boolean | undefined>
    ),

  myCalendar: (organizationId: string, params: CalendarRequest) =>
    api.get<EventCalendarResponse[]>(
      `/api/organizations/${organizationId}/events/my-calendar`,
      params as unknown as Record<string, string | number | boolean | undefined>
    ),

  getById: (organizationId: string, eventId: string) =>
    api.get<EventDetailResponse>(`/api/organizations/${organizationId}/events/${eventId}`),

  create: (organizationId: string, data: CreateEventRequest) =>
    api.post<EventDetailResponse>(`/api/organizations/${organizationId}/events`, data),

  update: (organizationId: string, eventId: string, data: UpdateEventRequest) =>
    api.put<EventDetailResponse>(`/api/organizations/${organizationId}/events/${eventId}`, data),

  cancel: (organizationId: string, eventId: string, data: CancelEventRequest) =>
    api.post<EventDetailResponse>(`/api/organizations/${organizationId}/events/${eventId}/cancel`, data),

  complete: (organizationId: string, eventId: string) =>
    api.post<EventDetailResponse>(`/api/organizations/${organizationId}/events/${eventId}/complete`),

  delete: (organizationId: string, eventId: string) =>
    api.delete(`/api/organizations/${organizationId}/events/${eventId}`),

  assignTrainer: (organizationId: string, eventId: string, data: AssignTrainerToEventRequest) =>
    api.post<EventDetailResponse>(`/api/organizations/${organizationId}/events/${eventId}/trainers`, data),

  removeTrainer: (organizationId: string, eventId: string, trainerId: string) =>
    api.delete<EventDetailResponse>(`/api/organizations/${organizationId}/events/${eventId}/trainers/${trainerId}`),
}

// ── Event Series ──────────────────────────────────────────────────────────────

export const eventSeriesApi = {
  list: (organizationId: string, params?: EventSeriesFilterParams) =>
    api.get<PagedResult<EventSeriesSummaryResponse>>(
      `/api/organizations/${organizationId}/event-series`,
      params as Record<string, string | number | boolean | undefined>
    ),

  listAll: (organizationId: string) =>
    api.get<EventSeriesSummaryResponse[]>(`/api/organizations/${organizationId}/event-series/all`),

  getById: (organizationId: string, seriesId: string) =>
    api.get<EventSeriesDetailResponse>(`/api/organizations/${organizationId}/event-series/${seriesId}`),

  create: (organizationId: string, data: CreateEventSeriesRequest) =>
    api.post<EventSeriesDetailResponse>(`/api/organizations/${organizationId}/event-series`, data),

  update: (organizationId: string, seriesId: string, data: UpdateEventSeriesRequest) =>
    api.put<EventSeriesDetailResponse>(`/api/organizations/${organizationId}/event-series/${seriesId}`, data),

  delete: (organizationId: string, seriesId: string) =>
    api.delete(`/api/organizations/${organizationId}/event-series/${seriesId}`),

  generate: (organizationId: string, seriesId: string, data: GenerateEventsRequest) =>
    api.post<GenerateEventsResponse>(
      `/api/organizations/${organizationId}/event-series/${seriesId}/generate`,
      data
    ),
}

// ── Messages ──────────────────────────────────────────────────────────────────

export const messagesApi = {
  conversations: (organizationId: string, params?: MessageFilterParams) =>
    api.get<PagedResult<ConversationSummaryResponse>>(
      `/api/organizations/${organizationId}/messages/conversations`,
      params as Record<string, string | number | boolean | undefined>
    ),

  inbox: (organizationId: string, params?: MessageFilterParams) =>
    api.get<PagedResult<MessageSummaryResponse>>(
      `/api/organizations/${organizationId}/messages/inbox`,
      params as Record<string, string | number | boolean | undefined>
    ),

  outbox: (organizationId: string, params?: MessageFilterParams) =>
    api.get<PagedResult<MessageSummaryResponse>>(
      `/api/organizations/${organizationId}/messages/outbox`,
      params as Record<string, string | number | boolean | undefined>
    ),

  unreadCount: (organizationId: string) =>
    api.get<UnreadCountResponse>(`/api/organizations/${organizationId}/messages/unread-count`),

  getById: (organizationId: string, messageId: string) =>
    api.get<MessageDetailResponse>(`/api/organizations/${organizationId}/messages/${messageId}`),

  send: (organizationId: string, data: SendMessageRequest) =>
    api.post<MessageDetailResponse>(`/api/organizations/${organizationId}/messages`, data),

  reply: (organizationId: string, messageId: string, data: ReplyMessageRequest) =>
    api.post<MessageDetailResponse>(`/api/organizations/${organizationId}/messages/${messageId}/reply`, data),

  markRead: (organizationId: string, messageId: string) =>
    api.post<void>(`/api/organizations/${organizationId}/messages/${messageId}/read`),

  markAllRead: (organizationId: string) =>
    api.post<void>(`/api/organizations/${organizationId}/messages/read-all`),

  delete: (organizationId: string, messageId: string) =>
    api.delete(`/api/organizations/${organizationId}/messages/${messageId}`),
}

// ── Enrollments ───────────────────────────────────────────────────────────────

const enrollmentsBase = (orgId: string, eventId: string) =>
  `/api/organizations/${orgId}/events/${eventId}/enrollments`

export const enrollmentsApi = {
  listForEvent: (orgId: string, eventId: string, params?: EventEnrollmentFilterParams) =>
    api.get<PagedResult<EnrollmentSummaryResponse>>(
      enrollmentsBase(orgId, eventId),
      params as Record<string, string | number | boolean | undefined>
    ),

  listTeamsForEvent: (orgId: string, eventId: string) =>
    api.get<TeamEnrollmentSummaryResponse[]>(`${enrollmentsBase(orgId, eventId)}/teams`),

  getById: (orgId: string, eventId: string, enrollmentId: string) =>
    api.get<EnrollmentDetailResponse>(`${enrollmentsBase(orgId, eventId)}/${enrollmentId}`),

  enrollMember: (orgId: string, eventId: string, data: EnrollMemberRequest) =>
    api.post<EnrollmentDetailResponse>(`${enrollmentsBase(orgId, eventId)}/enroll-member`, data),

  enrollTeam: (orgId: string, eventId: string, data: EnrollTeamRequest) =>
    api.post<TeamEnrollmentSummaryResponse>(`${enrollmentsBase(orgId, eventId)}/enroll-team`, data),

  unenroll: (orgId: string, eventId: string, enrollmentId: string) =>
    api.delete(`${enrollmentsBase(orgId, eventId)}/${enrollmentId}`),

  unenrollTeam: (orgId: string, eventId: string, teamEnrollmentId: string) =>
    api.delete(`${enrollmentsBase(orgId, eventId)}/teams/${teamEnrollmentId}`),

  setStatus: (orgId: string, eventId: string, enrollmentId: string, data: SetEnrollmentStatusRequest) =>
    api.patch<EnrollmentDetailResponse>(`${enrollmentsBase(orgId, eventId)}/${enrollmentId}/status`, data),

  bulkAttendance: (orgId: string, eventId: string, data: BulkAttendanceRequest) =>
    api.post<void>(`${enrollmentsBase(orgId, eventId)}/bulk-attendance`, data),

  listForMember: (orgId: string, memberId: string, params?: EventEnrollmentFilterParams) =>
    api.get<PagedResult<EnrollmentSummaryResponse>>(
      `/api/organizations/${orgId}/members/${memberId}/enrollments`,
      params as Record<string, string | number | boolean | undefined>
    ),

  requestEnrollment: (orgId: string, eventId: string, data: RequestEnrollmentRequest) =>
    api.post<EnrollmentDetailResponse>(`${enrollmentsBase(orgId, eventId)}/request-enrollment`, data),

  approveEnrollmentRequest: (orgId: string, eventId: string, enrollmentId: string, data: ReviewEnrollmentRequestRequest) =>
    api.post<EnrollmentDetailResponse>(`${enrollmentsBase(orgId, eventId)}/${enrollmentId}/approve`, data),

  rejectEnrollmentRequest: (orgId: string, eventId: string, enrollmentId: string, data: ReviewEnrollmentRequestRequest) =>
    api.post<EnrollmentDetailResponse>(`${enrollmentsBase(orgId, eventId)}/${enrollmentId}/reject`, data),
}

// ── Enrollment Requests (org-level) ──────────────────────────────────────────

export const enrollmentRequestsApi = {
  listPending: (orgId: string) =>
    api.get<EnrollmentRequestSummaryResponse[]>(
      `/api/organizations/${orgId}/enrollment-requests/pending`
    ),
}

// ── Availability ──────────────────────────────────────────────────────────────

export const availabilityApi = {
  /** Pobiera wszystkie sloty dostępności (tygodniowe wzorce) danego członka */
  getSlots: (orgId: string, memberId: string) =>
    api.get<AvailabilitySlotResponse[]>(
      `/api/organizations/${orgId}/members/${memberId}/availability`
    ),

  /** Dodaje slot dostępności */
  addSlot: (orgId: string, memberId: string, data: AddAvailabilitySlotRequest) =>
    api.post<AvailabilitySlotResponse>(
      `/api/organizations/${orgId}/members/${memberId}/availability`,
      data
    ),

  /** Aktualizuje slot dostępności */
  updateSlot: (
    orgId: string,
    memberId: string,
    slotId: string,
    data: UpdateAvailabilitySlotRequest,
  ) =>
    api.put<AvailabilitySlotResponse>(
      `/api/organizations/${orgId}/members/${memberId}/availability/${slotId}`,
      data
    ),

  /** Usuwa slot dostępności */
  deleteSlot: (orgId: string, memberId: string, slotId: string) =>
    api.delete(`/api/organizations/${orgId}/members/${memberId}/availability/${slotId}`),

  /**
   * Scalony grafik członka (sloty + zajęcia → Available/Busy).
   * from/to format: "yyyy-MM-dd" (DateOnly). Zakres max 90 dni.
   */
  getSchedule: (orgId: string, memberId: string, from: string, to: string) =>
    api.get<MemberScheduleResponse[]>(
      `/api/organizations/${orgId}/members/${memberId}/availability/schedule`,
      { from, to }
    ),

  /**
   * Sprawdzenie dostępności jednego lub wielu członków w danym terminie.
   * from/to format: ISO DateTime string np. "2026-07-14T09:00:00".
   * Dla pojedynczego memberId działa bez problemów (typowy use-case: EventFormDrawer).
   */
  checkAvailability: (orgId: string, memberId: string, from: string, to: string) =>
    api.get<AvailabilityCheckResponse>(
      `/api/organizations/${orgId}/availability/check`,
      { memberIds: memberId, from, to }
    ),
}

// ── Cancellation Requests ─────────────────────────────────────────────────────

const cancBase = (orgId: string) => `/api/organizations/${orgId}/cancellation-requests`

export const cancellationRequestsApi = {
  listPaged: (orgId: string, params?: CancellationRequestFilterParams) =>
    api.get<PagedResult<CancellationRequestSummaryResponse>>(
      cancBase(orgId),
      params as Record<string, string | number | boolean | undefined>
    ),

  listPending: (orgId: string) =>
    api.get<CancellationRequestSummaryResponse[]>(`${cancBase(orgId)}/pending`),

  listMy: (orgId: string) =>
    api.get<CancellationRequestSummaryResponse[]>(`${cancBase(orgId)}/my`),

  getById: (orgId: string, requestId: string) =>
    api.get<CancellationRequestDetailResponse>(`${cancBase(orgId)}/${requestId}`),

  submit: (orgId: string, enrollmentId: string, data: CreateCancellationRequest) =>
    api.post<CancellationRequestDetailResponse>(
      `${cancBase(orgId)}/enrollments/${enrollmentId}`,
      data
    ),

  review: (orgId: string, requestId: string, data: ReviewCancellationRequest) =>
    api.post<CancellationRequestDetailResponse>(`${cancBase(orgId)}/${requestId}/review`, data),

  withdraw: (orgId: string, requestId: string) =>
    api.post<void>(`${cancBase(orgId)}/${requestId}/withdraw`),
}
