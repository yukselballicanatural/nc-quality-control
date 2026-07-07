import { redirect } from 'next/navigation'
import { RecheckContent } from '@/components/recheck/RecheckContent'
import { isRestrictedQualityUser } from '@/lib/access-control'
import { getCurrentProfile } from '@/lib/current-profile'

export const dynamic = 'force-dynamic'

export default async function RecheckPage() {
  const { user, profile, supabase } = await getCurrentProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')

  if (profile.role === 'consultant') {
    redirect('/dashboard')
  }

  let query = supabase
    .from('evaluations')
    .select(`
      id,
      customer_name,
      lead_id,
      final_score,
      dev_recheck_date,
      conversation_date,
      status,
      recheck_done,
      recheck_done_at,
      recheck_done_by,
      consultant:profiles!evaluations_consultant_id_fkey(id, full_name),
      evaluator:profiles!evaluations_evaluator_id_fkey(id, full_name),
      doneBy:profiles!evaluations_recheck_done_by_fkey(id, full_name)
    `)
    .not('dev_recheck_date', 'is', null)
    .order('recheck_done', { ascending: true })
    .order('dev_recheck_date', { ascending: true })

  if (profile.role === 'team_leader' && profile.team_id) {
    query = query.eq('team_id', profile.team_id)
  } else if (isRestrictedQualityUser(profile)) {
    query = query.eq('evaluator_id', profile.id)
  }

  const { data: items } = await query

  return (
    <RecheckContent
      items={(items ?? []) as unknown as RecheckItem[]}
      currentUserId={profile.id}
      role={profile.role}
    />
  )
}

export interface RecheckItem {
  id: string
  customer_name: string
  lead_id: string | null
  final_score: number
  dev_recheck_date: string
  conversation_date: string
  status: string
  recheck_done: boolean
  recheck_done_at: string | null
  recheck_done_by: string | null
  consultant: { id: string; full_name: string }
  evaluator: { id: string; full_name: string }
  doneBy: { id: string; full_name: string } | null
}
