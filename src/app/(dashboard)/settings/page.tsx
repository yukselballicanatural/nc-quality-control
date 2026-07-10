import { redirect } from 'next/navigation'
import SettingsContent from '@/components/settings/SettingsContent'
import { getCurrentProfile } from '@/lib/current-profile'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { user, profile, supabase } = await getCurrentProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')

  const [usersResult, teamsResult, agentsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, role, team_id, is_active, created_at')
      .order('full_name'),
    supabase.from('teams').select('id, name').order('name'),
    supabase
      .from('agents')
      .select('id, first_name, last_name, role, region')
      .order('first_name'),
  ])

  return (
    <SettingsContent
      currentProfile={profile}
      users={usersResult.data ?? []}
      teams={teamsResult.data ?? []}
      agents={agentsResult.data ?? []}
    />
  )
}
