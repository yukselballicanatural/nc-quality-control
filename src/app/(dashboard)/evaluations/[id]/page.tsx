import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FormStepper } from '@/components/form/FormStepper'
import type { EvaluationWithRelations } from '@/types'

export default async function EditEvaluationPage({
  params,
}: {
  params: { id: string }
}) {
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

  // Consultants cannot edit evaluations
  if (profile.role === 'consultant' || profile.role === 'manager') {
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

  const evaluation = ev as unknown as EvaluationWithRelations

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
      initialEvaluation={evaluation}
    />
  )
}
