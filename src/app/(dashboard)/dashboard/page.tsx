export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import nextDynamic from 'next/dynamic'
import type {
  RecentEval,
  ConsultantStat,
  ChannelStat,
  AdminStats,
  ConsultantViewData,
  ScoreRange,
  ResultDist,
  StageDist,
  WeeklyTrend,
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

  const { data: allEvalsRaw } = isTeamLeader
    ? await supabase
        .from('evaluations')
        .select(
          'id, consultant_id, final_score, critical_error_count, conversation_result, channel, customer_name, status, conversation_date, lead_id'
        )
        .gte('conversation_date', since)
        .eq('team_id', profile.team_id!)
    : await supabase
        .from('evaluations')
        .select(
          'id, consultant_id, final_score, critical_error_count, conversation_result, channel, customer_name, status, conversation_date, lead_id'
        )
        .gte('conversation_date', since)

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

  // Fetch consultant name map
  const uniqueIds = Array.from(new Set(evals.map(e => e.consultant_id)))
  const profileMap = new Map<string, string>()
  if (uniqueIds.length > 0) {
    const { data: ps } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', uniqueIds)
    ;(ps ?? []).forEach(p => profileMap.set(p.id, p.full_name))
  }

  // Consultant stats aggregated and ranked
  const cAgg = new Map<string, { total: number; count: number; name: string }>()
  evals.forEach(e => {
    const existing = cAgg.get(e.consultant_id)
    if (existing) {
      existing.total += e.final_score
      existing.count += 1
    } else {
      cAgg.set(e.consultant_id, {
        total: e.final_score,
        count: 1,
        name: profileMap.get(e.consultant_id) ?? '—',
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

  // Recent evaluations (last 10)
  const { data: recentRaw } = isTeamLeader
    ? await supabase
        .from('evaluations')
        .select(
          'id, consultant_id, customer_name, channel, final_score, conversation_result, status, conversation_date, lead_id'
        )
        .in('status', ['submitted', 'approved'])
        .eq('team_id', profile.team_id!)
        .order('created_at', { ascending: false })
        .limit(10)
    : await supabase
        .from('evaluations')
        .select(
          'id, consultant_id, customer_name, channel, final_score, conversation_result, status, conversation_date, lead_id'
        )
        .in('status', ['submitted', 'approved'])
        .order('created_at', { ascending: false })
        .limit(10)

  const recentEvaluations: RecentEval[] = (recentRaw ?? []).map(e => ({
    id: e.id,
    consultant_name: profileMap.get(e.consultant_id) ?? '—',
    customer_name: e.customer_name,
    channel: e.channel as ChannelType,
    final_score: e.final_score,
    conversation_result: e.conversation_result as ConversationResult,
    status: e.status as EvaluationStatus,
    conversation_date: e.conversation_date,
    stage: e.lead_id ?? null,
  }))

  return (
    <DashboardContent
      role={profile.role}
      stats={stats}
      channelStats={channelStats}
      consultantStats={consultantStats}
      recentEvaluations={recentEvaluations}
      scoreRanges={scoreRanges}
      resultDist={resultDist}
      stageDist={stageDist}
      weeklyTrend={weeklyTrend}
    />
  )
}
