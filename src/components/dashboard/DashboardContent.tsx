'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileEdit,
  GraduationCap,
  Gauge,
  Layers,
  MessageSquare,
  Phone,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { getScoreLevel } from '@/lib/scoring'
import type { ChannelType, ConversationResult, EvaluationStatus, UserRole } from '@/types/supabase'

export interface RecentEval {
  id: string
  consultant_name: string
  customer_name: string
  channel: ChannelType
  final_score: number
  conversation_result: ConversationResult
  status: EvaluationStatus
  conversation_date: string
  stage: string | null
}

export interface ConsultantStat {
  full_name: string
  evaluationCount: number
  averageScore: number
}

export interface EvaluatorStat {
  full_name: string
  evaluationCount: number
  averageScore: number
  passRate: number
}

export interface ChannelStat {
  channel: ChannelType
  averageScore: number
  count: number
}

export interface AdminStats {
  totalEvaluations: number
  averageScore: number
  totalCriticalErrors: number
  wonRate: number
  passedCount: number
  failedCount: number
  draftCount: number
  pendingCount: number
}

export interface ConsultantViewData {
  myAverageScore: number
  recentEvaluations: RecentEval[]
  improvementAreas: string[]
}

export interface ScoreRange {
  range: string
  count: number
  color: string
}

export interface ResultDist {
  result: ConversationResult
  count: number
}

export interface StageDist {
  stage: string
  label: string
  count: number
  avgScore: number
}

export interface WeeklyTrend {
  week: string
  avgScore: number
  count: number
}

export interface RecentTrainingExam {
  id: string
  consultantName: string
  evaluatorName: string
  level: 'junior' | 'senior'
  totalScore: number
  passed: boolean
  createdAt: string
}

export interface TrainingExamSummary {
  total: number
  passed: number
  failed: number
  passRate: number
  averageScore: number
  juniorCount: number
  seniorCount: number
  recent: RecentTrainingExam[]
}

interface DashboardContentProps {
  role: UserRole
  stats?: AdminStats
  channelStats?: ChannelStat[]
  consultantStats?: ConsultantStat[]
  evaluatorStats?: EvaluatorStat[]
  showEvaluatorAnalytics?: boolean
  recentEvaluations?: RecentEval[]
  consultantData?: ConsultantViewData
  scoreRanges?: ScoreRange[]
  resultDist?: ResultDist[]
  stageDist?: StageDist[]
  weeklyTrend?: WeeklyTrend[]
  trainingExamSummary?: TrainingExamSummary
}

const emptyStats: AdminStats = {
  totalEvaluations: 0,
  averageScore: 0,
  totalCriticalErrors: 0,
  wonRate: 0,
  passedCount: 0,
  failedCount: 0,
  draftCount: 0,
  pendingCount: 0,
}

const RESULT_STYLES: Record<ConversationResult, { bg: string; text: string; labelTr: string; labelEn: string; color: string }> = {
  won: { bg: 'bg-emerald-100', text: 'text-emerald-700', labelTr: 'Kazanıldı', labelEn: 'Won', color: '#22C55E' },
  open: { bg: 'bg-blue-100', text: 'text-blue-700', labelTr: 'Açık', labelEn: 'Open', color: '#3B82F6' },
  follow_up: { bg: 'bg-amber-100', text: 'text-amber-700', labelTr: 'Takip', labelEn: 'Follow Up', color: '#F59E0B' },
  lost: { bg: 'bg-red-100', text: 'text-red-700', labelTr: 'Kaybedildi', labelEn: 'Lost', color: '#EF4444' },
  no_answer: { bg: 'bg-gray-100', text: 'text-gray-600', labelTr: 'Cevap Yok', labelEn: 'No Answer', color: '#9CA3AF' },
}

function formatDate(value: string, lang: 'tr' | 'en') {
  return new Date(value).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')
}

function localText(lang: 'tr' | 'en', tr: string, en: string) {
  return lang === 'tr' ? tr : en
}

function scoreColor(score: number) {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#3B82F6'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
}

function ScoreBadge({ score, lang }: { score: number; lang: 'tr' | 'en' }) {
  const level = getScoreLevel(score)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-bold ${level.bgColor} ${level.textColor}`}>
      {score}
      <span className="text-xs font-normal opacity-75">{lang === 'tr' ? level.label : level.labelEn}</span>
    </span>
  )
}

function ExamBadge({ passed, lang }: { passed: boolean; lang: 'tr' | 'en' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
      passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
    }`}>
      {passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {passed ? localText(lang, 'Geçti', 'Passed') : localText(lang, 'Kaldı', 'Failed')}
    </span>
  )
}

function ResultBadge({ result, lang }: { result: ConversationResult; lang: 'tr' | 'en' }) {
  const style = RESULT_STYLES[result]
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
      {lang === 'tr' ? style.labelTr : style.labelEn}
    </span>
  )
}

function ChannelBadge({ channel, labels }: { channel: ChannelType; labels: { whatsapp: string; call: string } }) {
  const isWhatsapp = channel === 'whatsapp'
  const Icon = isWhatsapp ? MessageSquare : Phone
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${
      isWhatsapp ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-blue-100 bg-blue-50 text-blue-700'
    }`}>
      <Icon className="h-3 w-3" />
      {isWhatsapp ? labels.whatsapp : labels.call}
    </span>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'green',
}: {
  icon: LucideIcon
  label: string
  value: string | number
  sub?: string
  tone?: 'green' | 'blue' | 'amber' | 'red' | 'slate' | 'purple'
}) {
  const tones = {
    green: 'bg-[#1B4332]/10 text-[#1B4332]',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-gray-100 text-gray-600',
    purple: 'bg-violet-50 text-violet-600',
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-bold leading-tight text-gray-950">{value}</div>
          <div className="mt-1 text-sm font-medium text-gray-600">{label}</div>
          {sub && <div className="mt-1 text-xs text-gray-400">{sub}</div>}
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  icon?: LucideIcon
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-gray-50 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1B4332]/10 text-[#1B4332]">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-950">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex h-44 items-center justify-center text-sm text-gray-300">{text}</div>
}

function ProgressLine({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }} />
    </div>
  )
}

export function DashboardContent({
  role,
  stats,
  channelStats,
  consultantStats,
  evaluatorStats,
  showEvaluatorAnalytics = false,
  recentEvaluations,
  consultantData,
  scoreRanges,
  resultDist,
  stageDist,
  weeklyTrend,
  trainingExamSummary,
}: DashboardContentProps) {
  const { lang, t } = useLanguage()

  if (role === 'consultant' && consultantData) {
    const level = getScoreLevel(consultantData.myAverageScore)

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <div className={`mb-2 text-5xl font-bold ${level.textColor}`}>{consultantData.myAverageScore}</div>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${level.bgColor} ${level.textColor}`}>
              {lang === 'tr' ? level.label : level.labelEn}
            </span>
            <div className="mt-3 text-sm text-gray-500">{t.dashboard.myAverageScore}</div>
            <div className="mt-0.5 text-xs text-gray-400">{t.dashboard.last30Days}</div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:col-span-2">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Target className="h-4 w-4 text-[#52B788]" />
              {t.dashboard.improvementAreas}
            </h3>
            {consultantData.improvementAreas.length > 0 ? (
              <ul className="space-y-2">
                {consultantData.improvementAreas.map((area, index) => (
                  <li key={area} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-medium text-orange-600">
                      {index + 1}
                    </span>
                    {area}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">{t.dashboard.noImprovementData}</p>
            )}
          </div>
        </div>

        <RecentEvaluationsPanel recent={consultantData.recentEvaluations} lang={lang} t={t} compact />
      </div>
    )
  }

  const s = stats ?? emptyStats
  const cs = channelStats ?? []
  const cStats = consultantStats ?? []
  const eStats = evaluatorStats ?? []
  const recent = recentEvaluations ?? []
  const ranges = scoreRanges ?? []
  const results = resultDist ?? []
  const stages = stageDist ?? []
  const trend = weeklyTrend ?? []
  const exam = trainingExamSummary ?? {
    total: 0,
    passed: 0,
    failed: 0,
    passRate: 0,
    averageScore: 0,
    juniorCount: 0,
    seniorCount: 0,
    recent: [],
  }

  const avgLevel = getScoreLevel(s.averageScore)
  const passRate = s.totalEvaluations > 0 ? Math.round((s.passedCount / s.totalEvaluations) * 100) : 0
  const bestConsultant = cStats[0]
  const topEvaluator = eStats[0]
  const strongestStage = [...stages].sort((a, b) => b.avgScore - a.avgScore)[0]
  const weakestStage = [...stages].sort((a, b) => a.avgScore - b.avgScore)[0]
  const strongestChannel = [...cs].sort((a, b) => b.averageScore - a.averageScore)[0]

  const channelChartData = [
    {
      name: t.channel.whatsapp,
      score: cs.find(item => item.channel === 'whatsapp')?.averageScore ?? 0,
      count: cs.find(item => item.channel === 'whatsapp')?.count ?? 0,
    },
    {
      name: t.channel.call,
      score: cs.find(item => item.channel === 'call')?.averageScore ?? 0,
      count: cs.find(item => item.channel === 'call')?.count ?? 0,
    },
  ]

  const resultChartData = results
    .filter(item => item.count > 0)
    .map(item => ({
      name: lang === 'tr' ? RESULT_STYLES[item.result].labelTr : RESULT_STYLES[item.result].labelEn,
      value: item.count,
      color: RESULT_STYLES[item.result].color,
    }))

  const topCards = [
    { icon: ClipboardList, label: t.dashboard.totalEvaluations, value: s.totalEvaluations, sub: t.dashboard.last30Days, tone: 'green' as const },
    { icon: TrendingUp, label: t.dashboard.averageScore, value: s.averageScore, sub: lang === 'tr' ? avgLevel.label : avgLevel.labelEn, tone: 'blue' as const },
    { icon: CheckCircle2, label: localText(lang, 'Başarı Oranı', 'Pass Rate'), value: `${passRate}%`, sub: `${s.passedCount}/${s.totalEvaluations}`, tone: 'green' as const },
    { icon: Trophy, label: t.dashboard.wonRate, value: `${s.wonRate}%`, sub: t.dashboard.last30Days, tone: 'purple' as const },
    { icon: GraduationCap, label: localText(lang, 'Sınav Başarısı', 'Exam Pass Rate'), value: `${exam.passRate}%`, sub: `${exam.passed}/${exam.total}`, tone: 'amber' as const },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {topCards.map(card => <StatCard key={card.label} {...card} />)}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={AlertTriangle} label={t.dashboard.criticalErrors} value={s.totalCriticalErrors} sub={t.dashboard.last30Days} tone="red" />
        <StatCard icon={Clock} label={localText(lang, 'Onay Bekliyor', 'Pending Approval')} value={s.pendingCount} sub={localText(lang, 'Gönderilmiş kayıtlar', 'Submitted records')} tone="amber" />
        <StatCard icon={FileEdit} label={localText(lang, 'Taslak', 'Drafts')} value={s.draftCount} sub={localText(lang, 'Henüz gönderilmedi', 'Not submitted yet')} tone="slate" />
        <StatCard icon={XCircle} label={localText(lang, 'Başarısız Kayıt', 'Failed Records')} value={s.failedCount} sub={`${100 - passRate}% ${localText(lang, 'başarısızlık', 'fail rate')}`} tone="red" />
      </div>

      <div className={`grid grid-cols-1 gap-3 ${showEvaluatorAnalytics ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        <InsightCard
          icon={Award}
          label={localText(lang, 'En başarılı danışman', 'Best consultant')}
          value={bestConsultant?.full_name ?? '-'}
          detail={bestConsultant ? `${bestConsultant.averageScore} ${localText(lang, 'ortalama', 'avg')} · ${bestConsultant.evaluationCount} ${localText(lang, 'kayıt', 'records')}` : localText(lang, 'Veri yok', 'No data')}
        />
        {showEvaluatorAnalytics && (
          <InsightCard
            icon={UserCheck}
            label={localText(lang, 'En aktif değerlendirici', 'Top evaluator')}
            value={topEvaluator?.full_name ?? '-'}
            detail={topEvaluator ? `${topEvaluator.evaluationCount} ${localText(lang, 'değerlendirme', 'evaluations')} · ${topEvaluator.passRate}%` : localText(lang, 'Veri yok', 'No data')}
          />
        )}
        <InsightCard
          icon={Gauge}
          label={localText(lang, 'Güçlü kanal', 'Strongest channel')}
          value={strongestChannel ? (strongestChannel.channel === 'whatsapp' ? t.channel.whatsapp : t.channel.call) : '-'}
          detail={strongestChannel ? `${strongestChannel.averageScore} ${localText(lang, 'ortalama skor', 'avg score')}` : localText(lang, 'Veri yok', 'No data')}
        />
        <InsightCard
          icon={Layers}
          label={localText(lang, 'İyileştirme alanı', 'Improvement area')}
          value={weakestStage?.label ?? '-'}
          detail={weakestStage ? `${weakestStage.avgScore} ${localText(lang, 'ortalama', 'avg')} · ${weakestStage.count} ${localText(lang, 'kayıt', 'records')}` : localText(lang, 'Veri yok', 'No data')}
        />
      </div>

      <RecentEvaluationsPanel recent={recent.slice(0, 10)} lang={lang} t={t} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel
          title={localText(lang, 'Sonuç Dağılımı', 'Result Breakdown')}
          subtitle={localText(lang, 'Görüşme sonuçlarının dağılımı', 'Conversation outcome mix')}
          icon={Activity}
        >
          {resultChartData.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[220px_1fr]">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={resultChartData} cx="50%" cy="50%" innerRadius={58} outerRadius={86} paddingAngle={3} dataKey="value">
                    {resultChartData.map(item => <Cell key={item.name} fill={item.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)', fontSize: 12 }}
                    formatter={(value: unknown) => [String(value ?? ''), localText(lang, 'Kayıt', 'Records')]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col justify-center space-y-3">
                {resultChartData.map(item => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="text-sm font-bold text-gray-950">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState text={localText(lang, 'Veri yok', 'No data')} />
          )}
        </Panel>

        <Panel
          title={localText(lang, 'Haftalık Trend', 'Weekly Trend')}
          subtitle={localText(lang, 'Son 6 haftalık ortalama skor', 'Average score over last 6 weeks')}
          icon={TrendingUp}
          className="xl:col-span-2"
        >
          <div className="p-5">
            {trend.length > 1 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trend}>
                  <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip
                    contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)', fontSize: 12 }}
                    formatter={(value: unknown) => [String(value ?? ''), localText(lang, 'Ortalama skor', 'Average score')]}
                  />
                  <Line type="monotone" dataKey="avgScore" stroke="#1B4332" strokeWidth={3} dot={{ fill: '#1B4332', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text={localText(lang, 'Trend için yeterli veri yok', 'Not enough data for trend')} />
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel
          title={localText(lang, 'Puan Dağılımı', 'Score Distribution')}
          subtitle={localText(lang, 'Skor aralıklarına göre kayıt sayısı', 'Records by score range')}
          icon={BarChart2}
        >
          <div className="space-y-3 p-5">
            {ranges.map(item => {
              const pct = s.totalEvaluations > 0 ? Math.round((item.count / s.totalEvaluations) * 100) : 0
              return (
                <div key={item.range} className="grid grid-cols-[56px_1fr_36px] items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500">{item.range}</span>
                  <ProgressLine value={pct} color={item.color} />
                  <span className="text-right text-xs font-bold text-gray-800">{item.count}</span>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel
          title={t.dashboard.channelComparison}
          subtitle={localText(lang, 'WhatsApp ve arama performansı', 'WhatsApp and call performance')}
          icon={MessageSquare}
        >
          <div className="p-5">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={channelChartData} barSize={48}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={32} />
                <Tooltip
                  cursor={{ fill: 'rgba(27, 67, 50, 0.04)' }}
                  contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)', fontSize: 12 }}
                  formatter={(value: unknown) => [String(value ?? ''), localText(lang, 'Ortalama skor', 'Average score')]}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {channelChartData.map((_, index) => <Cell key={index} fill={index === 0 ? '#52B788' : '#1B4332'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-2">
              {channelChartData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: index === 0 ? '#52B788' : '#1B4332' }} />
                    {item.name}
                  </span>
                  <span className="font-semibold text-gray-700">{item.score} · {item.count} {localText(lang, 'kayıt', 'records')}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          title={localText(lang, 'Stage Analizi', 'Stage Analysis')}
          subtitle={strongestStage ? `${localText(lang, 'En güçlü:', 'Strongest:')} ${strongestStage.label}` : localText(lang, 'Stage verisi', 'Stage data')}
          icon={Layers}
        >
          <div className="space-y-3 p-5">
            {stages.length > 0 ? stages.slice(0, 6).map(item => (
              <div key={item.stage} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-semibold text-gray-700">{item.label}</span>
                  <span className="shrink-0 font-bold text-gray-950">{item.avgScore}</span>
                </div>
                <ProgressLine value={item.avgScore} color={scoreColor(item.avgScore)} />
              </div>
            )) : (
              <EmptyState text={localText(lang, 'Veri yok', 'No data')} />
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Panel
          title={localText(lang, 'En Başarılı Danışmanlar', 'Top Consultants')}
          subtitle={localText(lang, 'Ortalama skora göre sıralama', 'Ranked by average score')}
          icon={Users}
          action={
            <Link href="/reports" className="flex items-center gap-1 text-xs font-semibold text-[#1B4332] hover:underline">
              {t.nav.reports} <ChevronRight className="h-3 w-3" />
            </Link>
          }
          className={showEvaluatorAnalytics ? 'xl:col-span-3' : 'xl:col-span-5'}
        >
          <PerformanceTable consultants={cStats} lang={lang} t={t} />
        </Panel>

        {showEvaluatorAnalytics && (
          <Panel
            title={localText(lang, 'Değerlendirici Performansı', 'Evaluator Performance')}
            subtitle={localText(lang, 'Kalite ekibi aktivitesi', 'Quality team activity')}
            icon={UserCheck}
            className="xl:col-span-2"
          >
            <EvaluatorList evaluators={eStats} lang={lang} />
          </Panel>
        )}
      </div>

      <TrainingExamPanel exam={exam} lang={lang} />
    </div>
  )
}

function InsightCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-xl bg-[#52B788]/12 text-[#1B4332]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-gray-950">{value}</div>
      <div className="mt-1 truncate text-xs text-gray-500">{detail}</div>
    </div>
  )
}

function RecentEvaluationsPanel({
  recent,
  lang,
  t,
  compact = false,
}: {
  recent: RecentEval[]
  lang: 'tr' | 'en'
  t: ReturnType<typeof useLanguage>['t']
  compact?: boolean
}) {
  return (
    <Panel
      title={t.dashboard.recentEvaluations}
      subtitle={localText(lang, 'Son yapılan 10 değerlendirme', 'Last 10 evaluations')}
      icon={ClipboardList}
      action={
        <Link href="/evaluations" className="flex items-center gap-1 text-xs font-semibold text-[#1B4332] hover:underline">
          {t.common.view} <ChevronRight className="h-3 w-3" />
        </Link>
      }
    >
      {recent.length === 0 ? (
        <EmptyState text={t.common.noData} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/60">
                {!compact && <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">{t.evaluations.consultant}</th>}
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400">{t.evaluations.customer}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">{t.evaluations.channel}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">{localText(lang, 'Stage', 'Stage')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">{localText(lang, 'Sonuç', 'Result')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">{t.evaluations.conversationDate}</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400">{t.evaluations.finalScore}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.map(item => (
                <tr key={item.id} className="transition-colors hover:bg-gray-50/70">
                  {!compact && <td className="px-5 py-4 text-sm font-semibold text-gray-900">{item.consultant_name}</td>}
                  <td className="px-5 py-4">
                    <div className="max-w-[180px] truncate text-sm font-medium text-gray-700">{item.customer_name}</div>
                  </td>
                  <td className="px-4 py-4"><ChannelBadge channel={item.channel} labels={t.channel} /></td>
                  <td className="px-4 py-4 text-xs font-medium text-gray-500">{item.stage ? item.stage.replace(/_/g, ' ') : '-'}</td>
                  <td className="px-4 py-4"><ResultBadge result={item.conversation_result} lang={lang} /></td>
                  <td className="px-4 py-4 text-sm text-gray-500">{formatDate(item.conversation_date, lang)}</td>
                  <td className="px-5 py-4 text-right"><ScoreBadge score={item.final_score} lang={lang} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

function PerformanceTable({
  consultants,
  lang,
  t,
}: {
  consultants: ConsultantStat[]
  lang: 'tr' | 'en'
  t: ReturnType<typeof useLanguage>['t']
}) {
  if (consultants.length === 0) return <EmptyState text={t.common.noData} />

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px]">
        <thead>
          <tr className="border-b border-gray-50 bg-gray-50/60">
            <th className="w-14 px-5 py-3 text-left text-xs font-semibold text-gray-400">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">{t.reports.consultantTable.consultant}</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400">{t.reports.consultantTable.evaluationCount}</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">{localText(lang, 'Performans', 'Performance')}</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400">{t.reports.consultantTable.averageScore}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {consultants.map((item, index) => (
            <tr key={`${item.full_name}-${index}`} className="transition-colors hover:bg-gray-50/70">
              <td className="px-5 py-4 text-sm font-bold text-gray-400">{index + 1}</td>
              <td className="px-4 py-4 text-sm font-semibold text-gray-900">{item.full_name}</td>
              <td className="px-4 py-4 text-center text-sm text-gray-500">{item.evaluationCount}</td>
              <td className="px-4 py-4"><ProgressLine value={item.averageScore} color={scoreColor(item.averageScore)} /></td>
              <td className="px-5 py-4 text-right"><ScoreBadge score={item.averageScore} lang={lang} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EvaluatorList({ evaluators, lang }: { evaluators: EvaluatorStat[]; lang: 'tr' | 'en' }) {
  if (evaluators.length === 0) return <EmptyState text={localText(lang, 'Veri yok', 'No data')} />

  return (
    <div className="space-y-4 p-5">
      {evaluators.slice(0, 6).map((item, index) => (
        <div key={`${item.full_name}-${index}`} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-gray-950">{item.full_name}</div>
              <div className="text-xs text-gray-400">{item.evaluationCount} {localText(lang, 'değerlendirme', 'evaluations')}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-950">{item.averageScore}</div>
              <div className="text-xs text-gray-400">{item.passRate}%</div>
            </div>
          </div>
          <ProgressLine value={item.averageScore} color={scoreColor(item.averageScore)} />
        </div>
      ))}
    </div>
  )
}

function TrainingExamPanel({ exam, lang }: { exam: TrainingExamSummary; lang: 'tr' | 'en' }) {
  const levelData = [
    { label: 'Junior', value: exam.juniorCount, color: '#52B788' },
    { label: 'Senior', value: exam.seniorCount, color: '#1B4332' },
  ]

  return (
    <Panel
      title={localText(lang, 'Eğitim Sınavları', 'Training Exams')}
      subtitle={localText(lang, 'Sınav başarıları ve son kayıtlar', 'Exam outcomes and recent records')}
      icon={GraduationCap}
      action={
        <Link href="/training-exam-results" className="flex items-center gap-1 text-xs font-semibold text-[#1B4332] hover:underline">
          {localText(lang, 'Sınav Sonuçları', 'Exam Results')} <ChevronRight className="h-3 w-3" />
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-[280px_1fr]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
          <MiniMetric label={localText(lang, 'Toplam Sınav', 'Total Exams')} value={exam.total} icon={ClipboardList} />
          <MiniMetric label={localText(lang, 'Ortalama Puan', 'Average Score')} value={`${exam.averageScore}/40`} icon={Gauge} />
          <MiniMetric label={localText(lang, 'Geçti', 'Passed')} value={exam.passed} icon={CheckCircle2} />
          <MiniMetric label={localText(lang, 'Kaldı', 'Failed')} value={exam.failed} icon={XCircle} />
          <div className="col-span-2 rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:col-span-4 xl:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">{localText(lang, 'Seviye Dağılımı', 'Level Mix')}</span>
              <span className="text-xs font-bold text-gray-700">{exam.passRate}%</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
              {levelData.map(item => {
                const width = exam.total > 0 ? (item.value / exam.total) * 100 : 0
                return <div key={item.label} style={{ width: `${width}%`, backgroundColor: item.color }} />
              })}
            </div>
            <div className="mt-3 flex justify-between text-xs text-gray-500">
              {levelData.map(item => <span key={item.label}>{item.label}: <b className="text-gray-800">{item.value}</b></span>)}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          {exam.recent.length === 0 ? (
            <EmptyState text={localText(lang, 'Henüz sınav sonucu yok', 'No exam results yet')} />
          ) : (
            <table className="w-full min-w-[660px]">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/70">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">{localText(lang, 'Danışman', 'Consultant')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">{localText(lang, 'Değerlendiren', 'Evaluator')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">{localText(lang, 'Seviye', 'Level')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">{localText(lang, 'Tarih', 'Date')}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400">{localText(lang, 'Sonuç', 'Result')}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">{localText(lang, 'Puan', 'Score')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {exam.recent.map(item => (
                  <tr key={item.id} className="transition-colors hover:bg-gray-50/70">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.consultantName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.evaluatorName}</td>
                    <td className="px-4 py-3 text-sm font-medium capitalize text-gray-700">{item.level}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(item.createdAt, lang)}</td>
                    <td className="px-4 py-3 text-center"><ExamBadge passed={item.passed} lang={lang} /></td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-950">{item.totalScore}<span className="text-xs font-medium text-gray-400">/40</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Panel>
  )
}

function MiniMetric({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B4332]/10 text-[#1B4332]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xl font-bold text-gray-950">{value}</div>
      <div className="mt-1 text-xs font-medium text-gray-500">{label}</div>
    </div>
  )
}
