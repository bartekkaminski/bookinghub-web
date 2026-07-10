import { api } from './client'
import type {
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
  MessageSummaryResponse,
  MessageDetailResponse,
  SendMessageRequest,
  ReplyMessageRequest,
  UnreadCountResponse,
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
}

// ── Messages ──────────────────────────────────────────────────────────────────

export const messagesApi = {
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
