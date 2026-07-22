export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { canCreateEvaluation } from '@/lib/access-control'
import { getCurrentProfile } from '@/lib/current-profile'
import { buildConsultantOptions } from '@/lib/agents'

const FormStepper = nextDynamic(
  () => import('@/components/form/FormStepper').then(m => m.FormStepper),
  { ssr: false }
)

export default async function NewEvaluationPage() {
  const { user, profile, supabase } = await getCurrentProfile()

  if (!user) redirect('/login')

  if (!profile) redirect('/login')

  if (!canCreateEvaluation(profile)) {
    redirect('/dashboard')
  }

  // Fetch dropdown data in parallel
  const [agentsResult, teamLeadersResult, teamsResult, evaluatorsResult] = await Promise.all([
    supabase
      .from('agents')
      .select('id, first_name, last_name, role, region')
      .order('first_name'),
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'team_leader')
      .eq('is_active', true)
      .order('full_name'),
    supabase.from('teams').select('id, name').order('name'),
    supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['manager', 'quality_team', 'team_leader'])
      .eq('is_active', true)
      .order('full_name'),
  ])

  // Consultant dropdown: only actual consultants, scoped to the user's region.
  // Managers see every region; a user without a region falls back to all.
  const teams = teamsResult.data ?? []
  const currentRegion =
    profile.role === 'manager'
      ? null
      : teams.find(t => t.id === profile.team_id)?.name ?? null
  const agents = buildConsultantOptions(agentsResult.data ?? [], { region: currentRegion })

  return (
    <FormStepper
      key={Date.now()}
      role={profile.role}
      evaluatorId={profile.id}
      evaluatorName={profile.full_name}
      agents={agents}
      teamLeaders={teamLeadersResult.data ?? []}
      teams={teams}
      evaluators={evaluatorsResult.data ?? []}
    />
  )
}
