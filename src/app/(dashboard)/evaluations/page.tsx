import { redirect } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { getCurrentProfile } from '@/lib/current-profile'
import { canCreateEvaluation, isRestrictedQualityUser } from '@/lib/access-control'
import { isTeamLeaderRole } from '@/lib/agents'
import type { ChannelType, ConversationResult, EvaluationStatus } from '@/types/supabase'
import type { EvaluationListItem } from '@/types'

export const dynamic = 'force-dynamic'

// Strips characters that are significant in PostgREST's `.or()` filter
// grammar (commas separate conditions, parens group them) so user-supplied
// search text can't inject extra filter conditions.
function sanitizeForOrFilter(value: string) {
  return value.replace(/[,()]/g, '')
}

const VALID_CHANNELS = new Set(['whatsapp', 'call', 'both'])

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
  const rawChannel = typeof sp.channel === 'string' ? sp.channel : ''
  const channel = VALID_CHANNELS.has(rawChannel) ? rawChannel : ''
  const status = typeof sp.status === 'string' ? sp.status : ''
  const result = typeof sp.result === 'string' ? sp.result : ''
  const evaluatorId = typeof sp.evaluator === 'string' ? sp.evaluator : ''
  const filterAgentId = typeof sp.consultant === 'string' ? sp.consultant : ''
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
      channels,
      conversation_date,
      evaluation_date,
      created_at,
      conversation_result,
      final_score,
      is_auto_failed,
      status,
      consultant_name,
      region,
      team_leader_name,
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
  if (q) {
    const safeQ = sanitizeForOrFilter(q)
    query = query.or(`customer_name.ilike.%${safeQ}%,consultant_name.ilike.%${safeQ}%`)
  }
  if (channel === 'both') {
    // Evaluations where BOTH channels were selected — the full selection is
    // stored in the `channels` array.
    query = query.contains('channels', ['whatsapp', 'call'])
  } else if (channel === 'whatsapp' || channel === 'call') {
    // Match the channel anywhere in the selected-channels array. Also match the
    // legacy primary `channel` column for any row not yet backfilled.
    query = query.or(`channels.cs.{${channel}},channel.eq.${channel}`)
  }
  if (status) query = query.eq('status', status as EvaluationStatus)
  if (result) query = query.eq('conversation_result', result as ConversationResult)
  if (evaluatorId && profile.role === 'manager') query = query.eq('evaluator_id', evaluatorId)
  if (filterAgentId) query = query.eq('agent_id', filterAgentId)
  // Date-range filter targets evaluation_date (when the QC was performed),
  // consistent with the dashboard and reports.
  if (startDate) query = query.gte('evaluation_date', startDate)
  if (endDate) query = query.lte('evaluation_date', endDate)

  const [evaluatorsResult, agentsResult] = await Promise.all([
    profile.role === 'manager'
      ? supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('role', ['quality_team', 'team_leader', 'manager'])
          .eq('is_active', true)
          .order('full_name')
      : Promise.resolve({ data: [] }),
    profile.role !== 'consultant'
      ? supabase
          .from('agents')
          .select('id, first_name, last_name, role')
          .order('first_name')
      : Promise.resolve({ data: [] }),
  ])

  // Pagination
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: evals, count } = await query
    .order(sortBy, { ascending })
    .range(from, to)

  const consultantOptions = (agentsResult.data ?? [])
    .filter(a => !isTeamLeaderRole(a.role))
    .map(a => ({ id: a.id, fullName: [a.first_name, a.last_name].filter(Boolean).join(' ').trim() || a.id }))

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
      filterConsultant={filterAgentId}
      filterStartDate={startDate}
      filterEndDate={endDate}
      searchQuery={q}
      evaluatorOptions={evaluatorsResult.data ?? []}
      consultantOptions={consultantOptions}
      sortBy={sortBy}
      sortDir={ascending ? 'asc' : 'desc'}
    />
  )
}
