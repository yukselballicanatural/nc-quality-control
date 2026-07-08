export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { canCreateEvaluation } from '@/lib/access-control'
import { getCurrentProfile } from '@/lib/current-profile'

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
      key={Date.now()}
      role={profile.role}
      evaluatorId={profile.id}
      evaluatorName={profile.full_name}
      consultants={consultantsResult.data ?? []}
      teamLeaders={teamLeadersResult.data ?? []}
      teams={teamsResult.data ?? []}
    />
  )
}
