import type { Profile, UserRole } from '@/types/supabase'

export const RESTRICTED_QUALITY_EMAILS = new Set([
  'kalite@naturalclinic.com',
  'ghaniya.ammour@naturalclinic.tr',
  'hamza.abdoulchakour@natural.clinic',
])

type AccessProfile = Pick<Profile, 'role' | 'email'> | { role: UserRole | string; email?: string | null }

export function isAdmin(profile: AccessProfile) {
  return profile.role === 'manager'
}

export function isRestrictedQualityUser(profile: AccessProfile) {
  return (
    profile.role === 'quality_team' &&
    RESTRICTED_QUALITY_EMAILS.has((profile.email ?? '').toLowerCase())
  )
}

export function canManageUsers(profile: AccessProfile) {
  return isAdmin(profile)
}

export function canCreateEvaluation(profile: AccessProfile) {
  return isAdmin(profile) || ['quality_team', 'team_leader'].includes(profile.role)
}

export function canTakeTrainingExam(profile: AccessProfile) {
  return isAdmin(profile) || ['quality_team', 'team_leader'].includes(profile.role)
}

export function canSeeAdminLogs(profile: AccessProfile) {
  return isAdmin(profile)
}
