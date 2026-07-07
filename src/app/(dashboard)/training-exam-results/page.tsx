import { redirect } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { getCurrentProfile } from '@/lib/current-profile'
import { isRestrictedQualityUser } from '@/lib/access-control'
import type { TrainingExam, UserRole } from '@/types/supabase'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20
const TrainingExamResultsContent = nextDynamic(
  () => import('@/components/training-exam/TrainingExamResultsContent').then(m => m.TrainingExamResultsContent),
  { ssr: false }
)

const VALID_SORT_COLS = ['created_at', 'total_score', 'level'] as const
type ValidSortCol = (typeof VALID_SORT_COLS)[number]

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

type ProfileSummary = {
  id: string
  full_name: string | null
  email?: string | null
  team_leader_id?: string | null
}

export type TrainingExamResultItem = TrainingExam & {
  consultant: ProfileSummary | null
  evaluator: ProfileSummary | null
}

function emptyResultProps(params: {
  page: number
  q: string
  level: string
  result: string
  evaluator: string
  startDate: string
  endDate: string
  sortBy: ValidSortCol
  sortDir: 'asc' | 'desc'
}) {
  return {
    results: [] as TrainingExamResultItem[],
    totalCount: 0,
    currentPage: params.page,
    pageSize: PAGE_SIZE,
    searchQuery: params.q,
    filterLevel: params.level,
    filterResult: params.result,
    filterEvaluator: params.evaluator,
    filterStartDate: params.startDate,
    filterEndDate: params.endDate,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    role: 'consultant' as UserRole,
    consultants: [] as ProfileSummary[],
    evaluatorOptions: [] as ProfileSummary[],
  }
}

export default async function TrainingExamResultsPage({ searchParams }: PageProps) {
  const { user, profile, supabase } = await getCurrentProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')
  if (profile.role === 'consultant') redirect('/dashboard')

  const sp = searchParams
  const q = typeof sp.q === 'string' ? sp.q.trim() : ''
  const level = typeof sp.level === 'string' ? sp.level : ''
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
  const sortDir = ascending ? 'asc' : 'desc'

  let consultantScopeIds: string[] | null = null

  if (profile.role === 'team_leader' && profile.team_id) {
    const { data: teamMembers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'consultant')
      .eq('team_id', profile.team_id)

    consultantScopeIds = (teamMembers ?? []).map(member => member.id)
  }

  if (q) {
    const { data: matchedProfiles } = await supabase
      .from('profiles')
      .select('id')
      .ilike('full_name', `%${q}%`)

    const matchedIds = new Set((matchedProfiles ?? []).map(item => item.id))
    consultantScopeIds = consultantScopeIds
      ? consultantScopeIds.filter(id => matchedIds.has(id))
      : Array.from(matchedIds)
  }

  const emptyProps = emptyResultProps({
    page,
    q,
    level,
    result,
    evaluator: evaluatorId,
    startDate,
    endDate,
    sortBy,
    sortDir,
  })

  let consultantsQuery = supabase
    .from('profiles')
    .select('id, full_name, team_leader_id')
    .eq('role', 'consultant')
    .order('full_name', { ascending: true })

  if (profile.role === 'team_leader' && profile.team_id) {
    consultantsQuery = consultantsQuery.eq('team_id', profile.team_id)
  }

  const consultantsResult = await consultantsQuery
  const evaluatorsResult = profile.role === 'manager'
    ? await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('role', ['quality_team', 'team_leader', 'manager'])
        .eq('is_active', true)
        .order('full_name')
    : { data: [] }

  if (consultantScopeIds && consultantScopeIds.length === 0) {
    return (
      <TrainingExamResultsContent
        {...emptyProps}
        role={profile.role}
        consultants={(consultantsResult.data ?? []) as ProfileSummary[]}
        evaluatorOptions={(evaluatorsResult.data ?? []) as ProfileSummary[]}
      />
    )
  }

  let query = supabase
    .from('training_exams')
    .select('*', { count: 'exact' })

  if (consultantScopeIds) query = query.in('consultant_id', consultantScopeIds)
  if (isRestrictedQualityUser(profile)) query = query.eq('evaluator_id', profile.id)
  if (evaluatorId && profile.role === 'manager') query = query.eq('evaluator_id', evaluatorId)
  if (level === 'junior' || level === 'senior') query = query.eq('level', level)
  if (result === 'passed') query = query.eq('passed', true)
  if (result === 'failed') query = query.eq('passed', false)
  if (startDate) query = query.gte('created_at', `${startDate}T00:00:00.000Z`)
  if (endDate) query = query.lte('created_at', `${endDate}T23:59:59.999Z`)

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: exams, count } = await query
    .order(sortBy, { ascending })
    .range(from, to)

  const rows = exams ?? []
  const profileIds = Array.from(
    new Set(
      rows
        .flatMap(row => [row.consultant_id, row.evaluator_id])
        .filter((id): id is string => Boolean(id))
    )
  )

  const { data: profiles } = profileIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, email, team_leader_id')
        .in('id', profileIds)
    : { data: [] as ProfileSummary[] }

  const profileMap = new Map((profiles ?? []).map(item => [item.id, item] as const))

  const results = rows.map(row => ({
    ...row,
    consultant: row.consultant_id ? profileMap.get(row.consultant_id) ?? null : null,
    evaluator: profileMap.get(row.evaluator_id) ?? null,
  }))

  return (
    <TrainingExamResultsContent
      results={results}
      totalCount={count ?? 0}
      currentPage={page}
      pageSize={PAGE_SIZE}
      searchQuery={q}
      filterLevel={level}
      filterResult={result}
      filterEvaluator={evaluatorId}
      filterStartDate={startDate}
      filterEndDate={endDate}
      sortBy={sortBy}
      sortDir={sortDir}
      role={profile.role}
      consultants={(consultantsResult.data ?? []) as ProfileSummary[]}
      evaluatorOptions={(evaluatorsResult.data ?? []) as ProfileSummary[]}
    />
  )
}
