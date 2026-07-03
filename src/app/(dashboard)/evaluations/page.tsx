import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EvaluationsContent } from '@/components/evaluations/EvaluationsContent'
import type { ChannelType, ConversationResult, EvaluationStatus } from '@/types/supabase'
import type { EvaluationListItem } from '@/types'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

const VALID_SORT_COLS = ['conversation_date', 'customer_name', 'final_score'] as const
type ValidSortCol = (typeof VALID_SORT_COLS)[number]

// ─── Page ─────────────────────────────────────────────────────────

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function EvaluationsPage({ searchParams }: PageProps) {
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

  // ── Parse URL params ────────────────────────────────────────────

  const sp = searchParams
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''
  const channel = typeof sp.channel === 'string' ? sp.channel : ''
  const status = typeof sp.status === 'string' ? sp.status : ''
  const result = typeof sp.result === 'string' ? sp.result : ''
  const startDate = typeof sp.startDate === 'string' ? sp.startDate : ''
  const endDate = typeof sp.endDate === 'string' ? sp.endDate : ''
  const page = typeof sp.page === 'string' ? Math.max(1, parseInt(sp.page) || 1) : 1

  const rawSortBy = typeof sp.sortBy === 'string' ? sp.sortBy : ''
  const sortBy: ValidSortCol = VALID_SORT_COLS.includes(rawSortBy as ValidSortCol)
    ? (rawSortBy as ValidSortCol)
    : 'conversation_date'
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
      conversation_result,
      final_score,
      is_auto_failed,
      status,
      consultant:profiles!evaluations_consultant_id_fkey(id, full_name),
      evaluator:profiles!evaluations_evaluator_id_fkey(id, full_name)
    `,
      { count: 'exact' }
    )

  // Role-based scope
  if (profile.role === 'consultant') {
    query = query.eq('consultant_id', profile.id)
  } else if (profile.role === 'team_leader' && profile.team_id) {
    query = query.eq('team_id', profile.team_id)
  }

  // Filters
  if (q) query = query.ilike('customer_name', `%${q}%`)
  if (channel) query = query.eq('channel', channel as ChannelType)
  if (status) query = query.eq('status', status as EvaluationStatus)
  if (result) query = query.eq('conversation_result', result as ConversationResult)
  if (startDate) query = query.gte('conversation_date', startDate)
  if (endDate) query = query.lte('conversation_date', endDate)

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
      canCreate={profile.role === 'quality_team' || profile.role === 'team_leader'}
      filterChannel={channel}
      filterStatus={status}
      filterResult={result}
      filterStartDate={startDate}
      filterEndDate={endDate}
      searchQuery={q}
      sortBy={sortBy}
      sortDir={ascending ? 'asc' : 'desc'}
    />
  )
}
