import i18n from '@/i18n'

export type OrgRole = 'Admin' | 'Manager' | 'Trainer' | 'Participant'

export const roleColors: Record<OrgRole, string> = {
  Admin: 'bg-purple-600',
  Manager: 'bg-blue-600',
  Trainer: 'bg-emerald-600',
  Participant: 'bg-zinc-600',
}

const roleKeyMap: Record<OrgRole, string> = {
  Admin: 'members.roleAdmin',
  Manager: 'members.roleManager',
  Trainer: 'members.roleTrainer',
  Participant: 'members.roleParticipant',
}

export function getRoleLabel(role: string): string {
  const key = roleKeyMap[role as OrgRole]
  if (key) return i18n.t(key)
  return role
}

export function hasRole(roles: string[], role: OrgRole): boolean {
  return roles.includes(role)
}

export function isAdmin(roles: string[]): boolean {
  return hasRole(roles, 'Admin')
}

export function isManager(roles: string[]): boolean {
  return hasRole(roles, 'Manager')
}

export function isTrainer(roles: string[]): boolean {
  return hasRole(roles, 'Trainer')
}

export function isParticipant(roles: string[]): boolean {
  return hasRole(roles, 'Participant')
}

export function isAdminOrManager(roles: string[]): boolean {
  return isAdmin(roles) || isManager(roles)
}

export function canManageOrg(roles: string[]): boolean {
  return isAdmin(roles) || isManager(roles)
}
