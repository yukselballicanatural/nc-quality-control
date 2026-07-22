export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { canCreateEvaluation, isRestrictedQualityUser } from '@/lib/access-control'
import { getCurrentProfile } from '@/lib/current-profile'
import { buildConsultantOptions } from '@/lib/agents'
import type { EvaluationWithRelations } from '@/types'

const FormStepper = nextDynamic(
  () => import('@/components/form/FormStepper').then(m => m.FormStepper),
  { ssr: false }
)

export default async function EditEvaluationPage({
  params,
}: {
  params: { id: string }
}) {
  const { user, profile, supabase } = await getCurrentProfile()

  if (!user) redirect('/login')

  if (!profile) redirect('/login')

  // Only roles that can create evaluations can edit them.
  if (!canCreateEvaluation(profile)) {
    redirect('/dashboard')
  }

  // Fetch evaluation with all relations
  const { data: ev, error } = await supabase
    .from('evaluations')
    .select(
      `
      *,
      consultant:profiles!evaluations_consultant_id_fkey(id, full_name),
      team_leader:profiles!evaluations_team_leader_id_fkey(id, full_name),
      team:teams(id, name),
      evaluator:profiles!evaluations_evaluator_id_fkey(id, full_name),
      criteria_scores(*),
      channel_checks(*),
      critical_errors(*)
      `
    )
    .eq('id', params.id)
    .single()

  if (error || !ev) notFound()

  // Team leader can only edit evaluations from their own team
  if (profile.role === 'team_leader' && ev.team_id !== profile.team_id) {
    redirect('/evaluations')
  }

  if (isRestrictedQualityUser(profile) && ev.evaluator_id !== profile.id) {
    redirect('/evaluations')
  }

  const evaluation = ev as unknown as EvaluationWithRelations

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

  // Same consultant scoping as the new-evaluation page, but always keep the
  // evaluation's already-selected consultant in the list so editing never
  // drops it (even if from another region or filtered out).
  const teams = teamsResult.data ?? []
  const currentRegion =
    profile.role === 'manager'
      ? null
      : teams.find(t => t.id === profile.team_id)?.name ?? null
  const agents = buildConsultantOptions(agentsResult.data ?? [], {
    region: currentRegion,
    keepId: ev.agent_id,
  })

  return (
    <FormStepper
      role={profile.role}
      evaluatorId={profile.id}
      evaluatorName={profile.full_name}
      agents={agents}
      teamLeaders={teamLeadersResult.data ?? []}
      teams={teams}
      evaluators={evaluatorsResult.data ?? []}
      initialEvaluation={evaluation}
    />
  )
}
