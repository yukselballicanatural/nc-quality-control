import { redirect } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { getCurrentProfile } from '@/lib/current-profile'
import { canCreateEvaluation, isRestrictedQualityUser } from '@/lib/access-control'
import type { ChannelType, ConversationResult, EvaluationStatus } from '@/types/supabase'
import type { EvaluationListItem } from '@/types'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20
const EvaluationsContent = nextDynamic(
  () => import('@/components/evaluations/EvaluationsContent').then(m => m.EvaluationsContent),
  { ssr: false }
)

const VALID_SORT_COLS = ['created_at', 'evaluation_date', 'conversation_date', 'customer_name', 'final_score'] as const
type ValidSortCol = (typeof VALID_SORT_COLS)[number]

// ─── Page ─────────────────────────────────────────────────────────

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function EvaluationsPage({ searchParams }: PageProps) {
  const { user, profile, supabase } = await getCurrentProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')

  // ── Parse URL params ────────────────────────────────────────────

  const sp = searchParams
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''
  const channel = typeof sp.channel === 'string' ? sp.channel : ''
  const status = typeof sp.status === 'string' ? sp.status : ''
  const result = typeof sp.result === 'string' ? sp.result : ''
  const evaluatorId = typeof sp.evaluator === 'string' ? sp.evaluator : ''
  const startDate = typeof sp.startDate === 'string' ? sp.startDate : ''
  const endDate = typeof sp.endDate === 'string' ? sp.endDate : ''
  const page = typeof sp.page === 'string' ? Math.max(1, parseInt(sp.page) || 1) : 1

  const rawSortBy = typeof sp.sortBy === 'string' ? sp.sortBy : ''
  const sortBy: ValidSortCol = VALID_SORT_COLS.includes(rawSortBy as ValidSortCol)
    ? (rawSortBy as ValidSortCol)
    : 'created_at'
  const ascending = typeof sp.sortDir === 'string' && sp.sortDir === 'asc'

  // ── Build query ─────────────────────────────────────────────────

  let query = supabase
    .from('evaluations')
    .select(
      `
      id,
      customer_name,
      channel,
      conversation_date,
      evaluation_date,
      created_at,
      conversation_result,
      final_score,
      is_auto_failed,
      status,
      consultant:profiles!evaluations_consultant_id_fkey(id, full_name),
      evaluator:profiles!evaluations_evaluator_id_fkey(id, full_name, email),
      channel_checks(channel)
    `,
      { count: 'exact' }
    )

  // Role-based scope
  if (profile.role === 'consultant') {
    query = query.eq('consultant_id', profile.id)
  } else if (profile.role === 'team_leader' && profile.team_id) {
    query = query.eq('team_id', profile.team_id)
  } else if (isRestrictedQualityUser(profile)) {
    query = query.eq('evaluator_id', profile.id)
  }

  // Filters
  if (q) query = query.ilike('customer_name', `%${q}%`)
  if (channel) query = query.eq('channel', channel as ChannelType)
  if (status) query = query.eq('status', status as EvaluationStatus)
  if (result) query = query.eq('conversation_result', result as ConversationResult)
  if (evaluatorId && profile.role === 'manager') query = query.eq('evaluator_id', evaluatorId)
  if (startDate) query = query.gte('conversation_date', startDate)
  if (endDate) query = query.lte('conversation_date', endDate)

  const evaluatorsResult = profile.role === 'manager'
    ? await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('role', ['quality_team', 'team_leader', 'manager'])
        .eq('is_active', true)
        .order('full_name')
    : { data: [] }

  // Pagination
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: evals, count } = await query
    .order(sortBy, { ascending })
    .range(from, to)

  return (
    <EvaluationsContent
      evaluations={(evals ?? []) as unknown as EvaluationListItem[]}
      totalCount={count ?? 0}
      currentPage={page}
      pageSize={PAGE_SIZE}
      role={profile.role}
      canCreate={canCreateEvaluation(profile)}
      filterChannel={channel}
      filterStatus={status}
      filterResult={result}
      filterEvaluator={evaluatorId}
      filterStartDate={startDate}
      filterEndDate={endDate}
      searchQuery={q}
      evaluatorOptions={evaluatorsResult.data ?? []}
      sortBy={sortBy}
      sortDir={ascending ? 'asc' : 'desc'}
    />
  )
}
