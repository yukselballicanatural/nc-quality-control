import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FormStepper } from '@/components/form/FormStepper'

export default async function NewEvaluationPage() {
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

  // Only quality_team and team_leader can create evaluations
  if (profile.role === 'consultant' || profile.role === 'manager') {
    redirect('/dashboard')
  }

  // Fetch dropdown data in parallel
  const [consultantsResult, teamLeadersResult, teamsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'consultant')
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'team_leader')
      .eq('is_active', true)
      .order('full_name'),
    supabase.from('teams').select('id, name').order('name'),
  ])

  return (
    <FormStepper
      role={profile.role}
      evaluatorId={profile.id}
      consultants={consultantsResult.data ?? []}
      teamLeaders={teamLeadersResult.data ?? []}
      teams={teamsResult.data ?? []}
    />
  )
}
