import { redirect } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { getCurrentProfile } from '@/lib/current-profile'
import { isRestrictedQualityUser } from '@/lib/access-control'
import type { ChannelType, ConversationResult, CriticalErrorType } from '@/types/supabase'
import type {
  ConsultantPerfRow,
  ChannelCompRow,
  CriticalErrorRow,
  SalesOutcomeRow,
} from '@/types'

export const dynamic = 'force-dynamic'
const ReportsContent = nextDynamic(
  () => import('@/components/reports/ReportsContent').then(m => m.ReportsContent),
  { ssr: false }
)

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const { user, profile, supabase } = await getCurrentProfile()
  if (!user) redirect('/login')
  if (!profile) redirect('/login')

  if (profile.role === 'consultant') redirect('/evaluations')

  // ── Parse URL params ─────────────────────────────────────────────

  const sp = searchParams
  const startDate = typeof sp.startDate === 'string' ? sp.startDate : ''
  const endDate = typeof sp.endDate === 'string' ? sp.endDate : ''
  const consultantId = typeof sp.consultantId === 'string' ? sp.consultantId : ''
  const teamId = typeof sp.teamId === 'string' ? sp.teamId : ''
  const channel = typeof sp.channel === 'string' ? sp.channel : ''
  const result = typeof sp.result === 'string' ? sp.result : ''
  const activeTab =
    typeof sp.tab === 'string' ? sp.tab : 'consultantPerformance'

  // ── Fetch filter dropdown data ────────────────────────────────────

  const [{ data: consultants }, { data: teams }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'consultant')
      .order('full_name'),
    supabase.from('teams').select('id, name').order('name'),
  ])

  // ── Build evaluations query (submitted + approved only) ───────────

  type EvalRow = {
    id: string
    consultant_id: string | null
    consultant_name: string | null
    team_id: string | null
    channel: ChannelType
    conversation_result: ConversationResult
    final_score: number
    is_auto_failed: boolean
    critical_error_count: number
    consultant: { id: string; full_name: string } | null
  }

  let evQuery = supabase
    .from('evaluations')
    .select(
      `
      id,
      consultant_id,
      consultant_name,
      team_id,
      channel,
      conversation_result,
      final_score,
      is_auto_failed,
      critical_error_count,
      consultant:profiles!evaluations_consultant_id_fkey(id, full_name)
    `
    )
    .in('status', ['submitted', 'approved'])

  if (profile.role === 'team_leader' && profile.team_id) {
    evQuery = evQuery.eq('team_id', profile.team_id)
  } else if (isRestrictedQualityUser(profile)) {
    evQuery = evQuery.eq('evaluator_id', profile.id)
  }

  if (startDate) evQuery = evQuery.gte('conversation_date', startDate)
  if (endDate) evQuery = evQuery.lte('conversation_date', endDate)
  if (consultantId) evQuery = evQuery.eq('consultant_id', consultantId)
  if (teamId) evQuery = evQuery.eq('team_id', teamId)
  if (channel) evQuery = evQuery.eq('channel', channel as ChannelType)
  if (result) evQuery = evQuery.eq('conversation_result', result as ConversationResult)

  const { data: evals } = await evQuery
  const evalRows = (evals ?? []) as unknown as EvalRow[]

  // ── Fetch critical_errors for these evaluations ───────────────────

  type CritRow = { evaluation_id: string; error_type: CriticalErrorType }
  let critRows: CritRow[] = []
  if (evalRows.length > 0) {
    const evalIds = evalRows.map(e => e.id)
    const { data: ce } = await supabase
      .from('critical_errors')
      .select('evaluation_id, error_type')
      .in('evaluation_id', evalIds)
    critRows = (ce ?? []) as CritRow[]
  }

  // ── Aggregate Tab 1: Consultant Performance ───────────────────────

  const consultantMap = new Map<
    string,
    {
      consultantId: string
      consultantName: string
      count: number
      totalScore: number
      critErrors: number
      wonCount: number
    }
  >()

  for (const ev of evalRows) {
    const cname = ev.consultant?.full_name ?? ev.consultant_name ?? '—'
    const cid = ev.consultant_id ?? cname
    if (!consultantMap.has(cid)) {
      consultantMap.set(cid, {
        consultantId: cid,
        consultantName: cname,
        count: 0,
        totalScore: 0,
        critErrors: 0,
        wonCount: 0,
      })
    }
    const r = consultantMap.get(cid)!
    r.count++
    r.totalScore += ev.is_auto_failed ? 0 : ev.final_score
    r.critErrors += ev.critical_error_count
    if (ev.conversation_result === 'won') r.wonCount++
  }

  const consultantPerf: ConsultantPerfRow[] = Array.from(consultantMap.values())
    .map(r => ({
      consultantId: r.consultantId,
      consultantName: r.consultantName,
      evaluationCount: r.count,
      avgScore: r.count ? Math.round(r.totalScore / r.count) : 0,
      criticalErrorCount: r.critErrors,
      wonRate: r.count ? Math.round((r.wonCount / r.count) * 100) : 0,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)

  // ── Aggregate Tab 2: Channel Comparison ──────────────────────────

  const channelMap = new Map<ChannelType, { count: number; totalScore: number; critErrors: number }>()
  for (const ev of evalRows) {
    if (!channelMap.has(ev.channel)) {
      channelMap.set(ev.channel, { count: 0, totalScore: 0, critErrors: 0 })
    }
    const r = channelMap.get(ev.channel)!
    r.count++
    r.totalScore += ev.is_auto_failed ? 0 : ev.final_score
    r.critErrors += ev.critical_error_count
  }

  const channelComp: ChannelCompRow[] = (['whatsapp', 'call'] as ChannelType[]).map(ch => {
    const r = channelMap.get(ch) ?? { count: 0, totalScore: 0, critErrors: 0 }
    return {
      channel: ch,
      evaluationCount: r.count,
      avgScore: r.count ? Math.round(r.totalScore / r.count) : 0,
      criticalErrorCount: r.critErrors,
    }
  })

  // ── Aggregate Tab 3: Critical Error Report ────────────────────────

  const evalConsultantMap = new Map<string, string>()
  for (const ev of evalRows) {
    evalConsultantMap.set(ev.id, ev.consultant?.full_name ?? ev.consultant_name ?? '—')
  }

  const errorMap = new Map<CriticalErrorType, Map<string, number>>()
  for (const ce of critRows) {
    if (!errorMap.has(ce.error_type)) {
      errorMap.set(ce.error_type, new Map())
    }
    const cname = evalConsultantMap.get(ce.evaluation_id) ?? '—'
    const byConsultant = errorMap.get(ce.error_type)!
    byConsultant.set(cname, (byConsultant.get(cname) ?? 0) + 1)
  }

  const criticalErrors: CriticalErrorRow[] = Array.from(errorMap.entries())
    .map(([errorType, byConsultant]) => {
      const consultantList = Array.from(byConsultant.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
      return {
        errorType,
        totalCount: consultantList.reduce((s, c) => s + c.count, 0),
        consultants: consultantList,
      }
    })
    .sort((a, b) => b.totalCount - a.totalCount)

  // ── Aggregate Tab 4: Sales Outcome ───────────────────────────────

  const resultOrder: ConversationResult[] = ['won', 'open', 'follow_up', 'lost', 'no_answer']
  const resultMap = new Map<ConversationResult, { count: number; totalScore: number }>()

  for (const ev of evalRows) {
    if (!resultMap.has(ev.conversation_result)) {
      resultMap.set(ev.conversation_result, { count: 0, totalScore: 0 })
    }
    const r = resultMap.get(ev.conversation_result)!
    r.count++
    r.totalScore += ev.is_auto_failed ? 0 : ev.final_score
  }

  const salesOutcome: SalesOutcomeRow[] = resultOrder
    .filter(r => resultMap.has(r))
    .map(r => {
      const row = resultMap.get(r)!
      return {
        result: r,
        evaluationCount: row.count,
        avgScore: row.count ? Math.round(row.totalScore / row.count) : 0,
      }
    })

  // ── Overall KPIs (from the same evalRows, no extra query) ─────────

  const overallAvgScore = evalRows.length
    ? Math.round(
        evalRows.reduce((sum, ev) => sum + (ev.is_auto_failed ? 0 : ev.final_score), 0) /
          evalRows.length
      )
    : 0
  const totalCriticalErrors = evalRows.reduce((sum, ev) => sum + ev.critical_error_count, 0)
  const overallWonCount = evalRows.filter(ev => ev.conversation_result === 'won').length
  const overallWonRate = evalRows.length ? Math.round((overallWonCount / evalRows.length) * 100) : 0

  // ── Render ────────────────────────────────────────────────────────

  return (
    <ReportsContent
      consultants={(consultants ?? []) as { id: string; full_name: string }[]}
      teams={(teams ?? []) as { id: string; name: string }[]}
      consultantPerf={consultantPerf}
      channelComp={channelComp}
      criticalErrors={criticalErrors}
      salesOutcome={salesOutcome}
      totalEvaluations={evalRows.length}
      overallAvgScore={overallAvgScore}
      totalCriticalErrors={totalCriticalErrors}
      overallWonRate={overallWonRate}
      filterStartDate={startDate}
      filterEndDate={endDate}
      filterConsultantId={consultantId}
      filterTeamId={teamId}
      filterChannel={channel}
      filterResult={result}
      activeTab={activeTab}
      role={profile.role}
    />
  )
}
