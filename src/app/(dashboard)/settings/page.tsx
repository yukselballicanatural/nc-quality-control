import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsContent from '@/components/settings/SettingsContent'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const [usersResult, teamsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, role, team_id, is_active, created_at')
      .order('full_name'),
    supabase.from('teams').select('id, name').order('name'),
  ])

  return (
    <SettingsContent
      currentProfile={profile}
      users={usersResult.data ?? []}
      teams={teamsResult.data ?? []}
    />
  )
}
