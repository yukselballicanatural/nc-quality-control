export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { getCurrentProfile } from '@/lib/current-profile'
import { isRestrictedQualityUser } from '@/lib/access-control'
import type {
  RecentEval,
  ConsultantStat,
  EvaluatorStat,
  ChannelStat,
  AdminStats,
  ConsultantViewData,
  ScoreRange,
  ResultDist,
  StageDist,
  WeeklyTrend,
  TrainingExamSummary,
} from '@/components/dashboard/DashboardContent'
import type { ChannelType, ConversationResult, EvaluationStatus } from '@/types/supabase'

const DashboardContent = nextDynamic(
  () => import('@/components/dashboard/DashboardContent').then(m => m.DashboardContent),
  { ssr: false }
)

const STAGE_LABELS_TR: Record<string, string> = {
  fresh_lead:              'Fresh Lead',
  new_sales_opportunities: 'New Sales Opp.',
  warm_lead:               'Warm Lead',
  offer_created:           'Offer Created',
  offer_shared:            'Offer Shared',
  platform_agents:         'Platform Agents',
  deal:                    'Deal',
  second_visit:            'Second Visit',
}

export default async function DashboardPage() {
  const { user, profile, supabase } = await getCurrentProfile()

  if (!user) redirect('/login')

  if (!profile) redirect('/login')

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  // ─── Consultant view ─────────────────────────────────────────────

  if (profile.role === 'consultant') {
    const { data: evals } = await supabase
      .from('evaluations')
      .select(
        'id, customer_name, channel, final_score, conversation_result, status, conversation_date, dev_areas_to_improve, lead_id'
      )
      .eq('consultant_id', user.id)
      .in('status', ['submitted', 'approved'])
      .order('conversation_date', { ascending: false })
      .limit(10)

    const list = evals ?? []

    const myAverageScore =
      list.length > 0
        ? Math.round(list.reduce((s, e) => s + e.final_score, 0) / list.length)
        : 0

    const areaSet = new Set<string>()
    list.forEach(e => {
      if (e.dev_areas_to_improve) {
        e.dev_areas_to_improve.split(/[\n,]/).forEach((a: string) => {
          const trimmed = a.trim()
          if (trimmed) areaSet.add(trimmed)
        })
      }
    })

    const consultantData: ConsultantViewData = {
      myAverageScore,
      recentEvaluations: list.map(e => ({
        id: e.id,
        consultant_name: profile.full_name,
        customer_name: e.customer_name,
        channel: e.channel as ChannelType,
        final_score: e.final_score,
        conversation_result: e.conversation_result as ConversationResult,
        status: e.status as EvaluationStatus,
        conversation_date: e.conversation_date,
        stage: e.lead_id ?? null,
      })),
      improvementAreas: Array.from(areaSet).slice(0, 5),
    }

    return <DashboardContent role={profile.role} consultantData={consultantData} />
  }

  // ─── Admin / team_leader / manager view ──────────────────────────

  const isTeamLeader = profile.role === 'team_leader' && !!profile.team_id
  const restrictedQuality = isRestrictedQualityUser(profile)

  let allEvalsQuery = supabase
    .from('evaluations')
    .select(
      'id, consultant_id, consultant_name, evaluator_id, final_score, critical_error_count, conversation_result, channel, customer_name, status, conversation_date, lead_id'
    )
    .gte('conversation_date', since)

  if (isTeamLeader) allEvalsQuery = allEvalsQuery.eq('team_id', profile.team_id!)
  if (restrictedQuality) allEvalsQuery = allEvalsQuery.eq('evaluator_id', profile.id)

  // Recent evaluations (last 10)
  let recentQuery = supabase
    .from('evaluations')
    .select(
      'id, consultant_id, consultant_name, evaluator_id, customer_name, channel, final_score, conversation_result, status, conversation_date, lead_id'
    )
    .in('status', ['submitted', 'approved'])
    .order('created_at', { ascending: false })
    .limit(10)

  if (isTeamLeader) recentQuery = recentQuery.eq('team_id', profile.team_id!)
  if (restrictedQuality) recentQuery = recentQuery.eq('evaluator_id', profile.id)

  const [{ data: allEvalsRaw }, { data: recentRaw }] = await Promise.all([
    allEvalsQuery,
    recentQuery,
  ])

  const allEvals = allEvalsRaw ?? []
  const draftCount = allEvals.filter(e => e.status === 'draft').length
  const pendingCount = allEvals.filter(e => e.status === 'submitted').length

  const evals = allEvals.filter(
    e => e.status === 'submitted' || e.status === 'approved'
  )

  // Aggregate stats
  const total = evals.length
  const avgScore =
    total > 0 ? Math.round(evals.reduce((s, e) => s + e.final_score, 0) / total) : 0
  const critErrors = evals.reduce((s, e) => s + e.critical_error_count, 0)
  const wonCount = evals.filter(e => e.conversation_result === 'won').length
  const wonRate = total > 0 ? Math.round((wonCount / total) * 100) : 0
  const passedCount = evals.filter(e => e.final_score >= 60).length
  const failedCount = evals.filter(e => e.final_score < 60 && e.final_score >= 0).length

  const stats: AdminStats = {
    totalEvaluations: total,
    averageScore: avgScore,
    totalCriticalErrors: critErrors,
    wonRate,
    passedCount,
    failedCount,
    draftCount,
    pendingCount,
  }

  // Channel stats
  const waEvals = evals.filter(e => e.channel === 'whatsapp')
  const clEvals = evals.filter(e => e.channel === 'call')
  const channelStats: ChannelStat[] = [
    {
      channel: 'whatsapp',
      averageScore:
        waEvals.length > 0
          ? Math.round(waEvals.reduce((s, e) => s + e.final_score, 0) / waEvals.length)
          : 0,
      count: waEvals.length,
    },
    {
      channel: 'call',
      averageScore:
        clEvals.length > 0
          ? Math.round(clEvals.reduce((s, e) => s + e.final_score, 0) / clEvals.length)
          : 0,
      count: clEvals.length,
    },
  ]

  // Score distribution (5 ranges)
  const scoreRanges: ScoreRange[] = [
    { range: '0–20',   count: evals.filter(e => e.final_score <= 20).length,                              color: '#EF4444' },
    { range: '21–40',  count: evals.filter(e => e.final_score > 20 && e.final_score <= 40).length,        color: '#F97316' },
    { range: '41–59',  count: evals.filter(e => e.final_score > 40 && e.final_score < 60).length,         color: '#EAB308' },
    { range: '60–79',  count: evals.filter(e => e.final_score >= 60 && e.final_score <= 79).length,       color: '#3B82F6' },
    { range: '80–100', count: evals.filter(e => e.final_score >= 80).length,                              color: '#22C55E' },
  ]

  // Result distribution
  const resultKeys: ConversationResult[] = ['won', 'open', 'follow_up', 'lost', 'no_answer']
  const resultDist: ResultDist[] = resultKeys.map(r => ({
    result: r,
    count: evals.filter(e => e.conversation_result === r).length,
  }))

  // Stage distribution
  const stageMap = new Map<string, { count: number; total: number }>()
  evals.forEach(e => {
    const stage = e.lead_id && STAGE_LABELS_TR[e.lead_id] ? e.lead_id : 'other'
    const ex = stageMap.get(stage)
    if (ex) { ex.count++; ex.total += e.final_score }
    else stageMap.set(stage, { count: 1, total: e.final_score })
  })
  const stageDist: StageDist[] = Array.from(stageMap.entries())
    .map(([stage, d]) => ({
      stage,
      label: STAGE_LABELS_TR[stage] ?? (stage === 'other' ? 'Diğer' : stage),
      count: d.count,
      avgScore: Math.round(d.total / d.count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Weekly trend (last 6 weeks)
  const weeklyMap = new Map<string, { total: number; count: number }>()
  evals.forEach(e => {
    const d = new Date(e.conversation_date)
    const dayOfWeek = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7))
    const weekKey = monday.toISOString().split('T')[0]
    const ex = weeklyMap.get(weekKey)
    if (ex) { ex.total += e.final_score; ex.count++ }
    else weeklyMap.set(weekKey, { total: e.final_score, count: 1 })
  })
  const weeklyTrend: WeeklyTrend[] = Array.from(weeklyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([week, d]) => {
      const dt = new Date(week)
      const label = `${dt.getDate()}/${dt.getMonth() + 1}`
      return { week: label, avgScore: Math.round(d.total / d.count), count: d.count }
    })

  // Training exams summary
  let examRows: Array<{
    id: string
    consultant_id: string | null
    consultant_name?: string | null
    evaluator_id: string
    level: 'junior' | 'senior'
    total_score: number
    passed: boolean
    created_at: string
  }> = []

  let examQuery = supabase
    .from('training_exams')
    .select('*')
    .gte('created_at', `${since}T00:00:00.000Z`)
    .order('created_at', { ascending: false })

  if (restrictedQuality) examQuery = examQuery.eq('evaluator_id', profile.id)

  if (isTeamLeader) {
    const { data: teamMembers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'consultant')
      .eq('team_id', profile.team_id!)

    const teamMemberIds = (teamMembers ?? []).map(member => member.id)
    if (teamMemberIds.length > 0) {
      examQuery = examQuery.in('consultant_id', teamMemberIds)
      const { data: exams } = await examQuery
      examRows = (exams ?? []) as typeof examRows
    }
  } else {
    const { data: exams } = await examQuery
    examRows = (exams ?? []) as typeof examRows
  }

  // Fetch profile name map for evaluations and training exams
  const profileIds = Array.from(
    new Set(
      [
        ...evals.flatMap(e => [e.consultant_id, e.evaluator_id]),
        ...(recentRaw ?? []).flatMap(e => [e.consultant_id, e.evaluator_id]),
        ...examRows.flatMap(e => [e.consultant_id ?? null, e.evaluator_id]),
      ].filter((id): id is string => Boolean(id))
    )
  )

  const profileMap = new Map<string, string>()
  if (profileIds.length > 0) {
    const { data: ps } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', profileIds)
    ;(ps ?? []).forEach(p => profileMap.set(p.id, p.full_name))
  }

  // Consultant stats aggregated and ranked
  const cAgg = new Map<string, { total: number; count: number; name: string }>()
  evals.forEach(e => {
    const key = e.consultant_id ?? e.consultant_name ?? 'unknown'
    const existing = cAgg.get(key)
    if (existing) {
      existing.total += e.final_score
      existing.count += 1
    } else {
      cAgg.set(key, {
        total: e.final_score,
        count: 1,
        name: (e.consultant_id ? profileMap.get(e.consultant_id) : e.consultant_name) ?? '—',
      })
    }
  })

  const consultantStats: ConsultantStat[] = Array.from(cAgg.values())
    .map(d => ({
      full_name: d.name,
      evaluationCount: d.count,
      averageScore: Math.round(d.total / d.count),
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 8)

  // Evaluator stats aggregated and ranked
  const eAgg = new Map<string, { total: number; count: number; passed: number; name: string }>()
  evals.forEach(e => {
    const existing = eAgg.get(e.evaluator_id)
    if (existing) {
      existing.total += e.final_score
      existing.count += 1
      existing.passed += e.final_score >= 60 ? 1 : 0
    } else {
      eAgg.set(e.evaluator_id, {
        total: e.final_score,
        count: 1,
        passed: e.final_score >= 60 ? 1 : 0,
        name: profileMap.get(e.evaluator_id) ?? '—',
      })
    }
  })

  const evaluatorStats: EvaluatorStat[] = Array.from(eAgg.values())
    .map(d => ({
      full_name: d.name,
      evaluationCount: d.count,
      averageScore: Math.round(d.total / d.count),
      passRate: Math.round((d.passed / d.count) * 100),
    }))
    .sort((a, b) => b.evaluationCount - a.evaluationCount)
    .slice(0, 8)

  const recentEvaluations: RecentEval[] = (recentRaw ?? []).map(e => ({
    id: e.id,
    consultant_name: (e.consultant_id ? profileMap.get(e.consultant_id) : e.consultant_name) ?? '—',
    customer_name: e.customer_name,
    channel: e.channel as ChannelType,
    final_score: e.final_score,
    conversation_result: e.conversation_result as ConversationResult,
    status: e.status as EvaluationStatus,
    conversation_date: e.conversation_date,
    stage: e.lead_id ?? null,
  }))

  const trainingExamSummary: TrainingExamSummary = {
    total: examRows.length,
    passed: examRows.filter(e => e.passed).length,
    failed: examRows.filter(e => !e.passed).length,
    passRate: examRows.length > 0
      ? Math.round((examRows.filter(e => e.passed).length / examRows.length) * 100)
      : 0,
    averageScore: examRows.length > 0
      ? Math.round(examRows.reduce((sum, e) => sum + e.total_score, 0) / examRows.length)
      : 0,
    juniorCount: examRows.filter(e => e.level === 'junior').length,
    seniorCount: examRows.filter(e => e.level === 'senior').length,
    recent: examRows.slice(0, 8).map(e => ({
      id: e.id,
      consultantName: e.consultant_name || (e.consultant_id ? profileMap.get(e.consultant_id) : null) || '—',
      evaluatorName: profileMap.get(e.evaluator_id) ?? '—',
      level: e.level,
      totalScore: e.total_score,
      passed: e.passed,
      createdAt: e.created_at,
    })),
  }

  return (
    <DashboardContent
      role={profile.role}
      stats={stats}
      channelStats={channelStats}
      consultantStats={consultantStats}
      evaluatorStats={evaluatorStats}
      showEvaluatorAnalytics={profile.role === 'manager'}
      recentEvaluations={recentEvaluations}
      scoreRanges={scoreRanges}
      resultDist={resultDist}
      stageDist={stageDist}
      weeklyTrend={weeklyTrend}
      trainingExamSummary={trainingExamSummary}
    />
  )
}
