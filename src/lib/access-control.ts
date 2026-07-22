import type { Profile, UserRole } from '@/types/supabase'

type AccessProfile = Pick<Profile, 'role' | 'email'> | { role: UserRole | string; email?: string | null }

export function isAdmin(profile: AccessProfile) {
  return profile.role === 'manager'
}

// Every quality-control user sees only the evaluations/exams they created, so a
// new quality user starts with an empty panel and data stays isolated per user.
// (Managers/admins retain the full cross-user view.)
export function isRestrictedQualityUser(profile: AccessProfile) {
  return profile.role === 'quality_team'
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
