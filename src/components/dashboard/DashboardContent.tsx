'use client'

import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie,
} from 'recharts'
import {
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  Trophy,
  MessageSquare,
  Phone,
  ChevronRight,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  FileEdit,
  Layers,
  BarChart2,
  TrendingDown,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { getScoreLevel } from '@/lib/scoring'
import type { UserRole, ChannelType, ConversationResult, EvaluationStatus } from '@/types/supabase'

// ─── Types ───────────────────────────────────────────────────────

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

// ─── Props ───────────────────────────────────────────────────────

interface DashboardContentProps {
  role: UserRole
  stats?: AdminStats
  channelStats?: ChannelStat[]
  consultantStats?: ConsultantStat[]
  recentEvaluations?: RecentEval[]
  consultantData?: ConsultantViewData
  scoreRanges?: ScoreRange[]
  resultDist?: ResultDist[]
  stageDist?: StageDist[]
  weeklyTrend?: WeeklyTrend[]
}

// ─── Small shared components ──────────────────────────────────────

function ScoreBadge({ score, lang }: { score: number; lang: 'tr' | 'en' }) {
  const level = getScoreLevel(score)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold ${level.bgColor} ${level.textColor}`}>
      {score}
      <span className="text-xs font-normal opacity-75">
        {lang === 'tr' ? level.label : level.labelEn}
      </span>
    </span>
  )
}

function ChannelBadge({ channel, labels }: { channel: ChannelType; labels: { whatsapp: string; call: string } }) {
  if (channel === 'whatsapp') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-100">
        <MessageSquare className="w-3 h-3" />
        {labels.whatsapp}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
      <Phone className="w-3 h-3" />
      {labels.call}
    </span>
  )
}

const RESULT_STYLES: Record<string, { bg: string; text: string; label_tr: string; label_en: string; color: string }> = {
  won:       { bg: 'bg-green-100', text: 'text-green-700',  label_tr: 'Kazanıldı',   label_en: 'Won',       color: '#22C55E' },
  open:      { bg: 'bg-blue-100',  text: 'text-blue-700',   label_tr: 'Açık',        label_en: 'Open',      color: '#3B82F6' },
  follow_up: { bg: 'bg-amber-100', text: 'text-amber-700',  label_tr: 'Takip',       label_en: 'Follow Up', color: '#F59E0B' },
  lost:      { bg: 'bg-red-100',   text: 'text-red-700',    label_tr: 'Kaybedildi',  label_en: 'Lost',      color: '#EF4444' },
  no_answer: { bg: 'bg-gray-100',  text: 'text-gray-600',   label_tr: 'Cevap Yok',  label_en: 'No Answer', color: '#9CA3AF' },
}

function ResultBadge({ result, lang }: { result: ConversationResult; lang: 'tr' | 'en' }) {
  const s = RESULT_STYLES[result] ?? { bg: 'bg-gray-100', text: 'text-gray-500', label_tr: result, label_en: result }
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${s.bg} ${s.text}`}>
      {lang === 'tr' ? s.label_tr : s.label_en}
    </span>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
  trend,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  sub?: string
  iconBg: string
  iconColor: string
  trend?: { dir: 'up' | 'down' | 'neutral'; text: string }
}) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${iconBg} mb-3 sm:mb-4`}>
        <Icon className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${iconColor}`} />
      </div>
      <div className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{value}</div>
      <div className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-snug">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
          trend.dir === 'up' ? 'text-emerald-600' : trend.dir === 'down' ? 'text-red-500' : 'text-gray-400'
        }`}>
          {trend.dir === 'up' ? <TrendingUp className="w-3 h-3" /> : trend.dir === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
          {trend.text}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────

export function DashboardContent({
  role,
  stats,
  channelStats,
  consultantStats,
  recentEvaluations,
  consultantData,
  scoreRanges,
  resultDist,
  stageDist,
  weeklyTrend,
}: DashboardContentProps) {
  const { lang, t } = useLanguage()

  // ── Consultant view ──────────────────────────────────────────────
  if (role === 'consultant' && consultantData) {
    const level = getScoreLevel(consultantData.myAverageScore)

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
            <div className={`text-5xl font-bold mb-2 ${level.textColor}`}>
              {consultantData.myAverageScore}
            </div>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${level.bgColor} ${level.textColor}`}>
              {lang === 'tr' ? level.label : level.labelEn}
            </span>
            <div className="text-sm text-gray-500 mt-3">{t.dashboard.myAverageScore}</div>
            <div className="text-xs text-gray-400 mt-0.5">{t.dashboard.last30Days}</div>
          </div>

          <div className="sm:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#52B788]" />
              {t.dashboard.improvementAreas}
            </h3>
            {consultantData.improvementAreas.length > 0 ? (
              <ul className="space-y-2">
                {consultantData.improvementAreas.map((area, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                      {i + 1}
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

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{t.dashboard.recentEvaluations}</h3>
            <Link href="/evaluations" className="text-xs text-[#1B4332] font-medium hover:underline flex items-center gap-1">
              {t.common.view} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {consultantData.recentEvaluations.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">{t.common.noData}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">{t.evaluations.customer}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">{t.evaluations.channel}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">{t.evaluations.conversationDate}</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-400">{t.evaluations.finalScore}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {consultantData.recentEvaluations.map(ev => (
                    <tr key={ev.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{ev.customer_name}</td>
                      <td className="px-4 py-3"><ChannelBadge channel={ev.channel} labels={t.channel} /></td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(ev.conversation_date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                      </td>
                      <td className="px-5 py-3 text-right"><ScoreBadge score={ev.final_score} lang={lang} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Admin / team_leader / manager view ───────────────────────────

  const s = stats ?? { totalEvaluations: 0, averageScore: 0, totalCriticalErrors: 0, wonRate: 0, passedCount: 0, failedCount: 0, draftCount: 0, pendingCount: 0 }
  const cs = channelStats ?? []
  const cStats = consultantStats ?? []
  const recent = recentEvaluations ?? []
  const ranges = scoreRanges ?? []
  const results = resultDist ?? []
  const stages = stageDist ?? []
  const trend = weeklyTrend ?? []

  const avgLevel = getScoreLevel(s.averageScore)
  const passRate = s.totalEvaluations > 0 ? Math.round((s.passedCount / s.totalEvaluations) * 100) : 0

  const chartData = [
    { name: t.channel.whatsapp, score: cs.find(c => c.channel === 'whatsapp')?.averageScore ?? 0, count: cs.find(c => c.channel === 'whatsapp')?.count ?? 0 },
    { name: t.channel.call,     score: cs.find(c => c.channel === 'call')?.averageScore ?? 0,     count: cs.find(c => c.channel === 'call')?.count ?? 0 },
  ]

  const resultChartData = results
    .filter(r => r.count > 0)
    .map(r => ({
      name: lang === 'tr' ? RESULT_STYLES[r.result]?.label_tr : RESULT_STYLES[r.result]?.label_en,
      value: r.count,
      color: RESULT_STYLES[r.result]?.color ?? '#9CA3AF',
    }))

  const topCards = [
    { icon: ClipboardList, label: t.dashboard.totalEvaluations, value: s.totalEvaluations, sub: t.dashboard.last30Days, iconBg: 'bg-[#1B4332]/10', iconColor: 'text-[#1B4332]' },
    { icon: TrendingUp,    label: t.dashboard.averageScore,      value: s.averageScore,      sub: lang === 'tr' ? avgLevel.label : avgLevel.labelEn, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { icon: AlertTriangle, label: t.dashboard.criticalErrors,     value: s.totalCriticalErrors, sub: t.dashboard.last30Days, iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
    { icon: Trophy,        label: t.dashboard.wonRate,            value: `${s.wonRate}%`,      sub: t.dashboard.last30Days, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
  ]

  const secondCards = [
    { icon: CheckCircle2, label: lang === 'tr' ? 'Başarılı (≥60)' : 'Passed (≥60)',    value: s.passedCount,  sub: `${passRate}% ${lang === 'tr' ? 'başarı oranı' : 'pass rate'}`, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    { icon: XCircle,      label: lang === 'tr' ? 'Başarısız (<60)' : 'Failed (<60)',   value: s.failedCount,  sub: `${100 - passRate}% ${lang === 'tr' ? 'başarısızlık' : 'fail rate'}`, iconBg: 'bg-red-50', iconColor: 'text-red-500' },
    { icon: Clock,        label: lang === 'tr' ? 'Onay Bekliyor' : 'Pending Approval', value: s.pendingCount, sub: lang === 'tr' ? 'Gönderilmiş' : 'Submitted',  iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
    { icon: FileEdit,     label: lang === 'tr' ? 'Taslak' : 'Drafts',                  value: s.draftCount,   sub: lang === 'tr' ? 'Kaydedilmiş' : 'Saved drafts', iconBg: 'bg-gray-50', iconColor: 'text-gray-500' },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── Row 1: Primary stat cards ───────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {topCards.map((card, i) => <StatCard key={i} {...card} />)}
      </div>

      {/* ── Row 2: Secondary stat cards ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {secondCards.map((card, i) => <StatCard key={i} {...card} />)}
      </div>

      {/* ── Row 3: Weekly trend + Score distribution ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">

        {/* Weekly trend line chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#52B788]" />
              {lang === 'tr' ? 'Haftalık Skor Trendi' : 'Weekly Score Trend'}
            </h3>
            <span className="text-xs text-gray-400">{lang === 'tr' ? 'Son 6 hafta' : 'Last 6 weeks'}</span>
          </div>
          {trend.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px', padding: '8px 12px' }}
                  formatter={(v, _, p) => [`${v} (${p.payload.count} ${lang === 'tr' ? 'değ.' : 'eval.'})`, lang === 'tr' ? 'Ort. Skor' : 'Avg. Score']}
                />
                <Line type="monotone" dataKey="avgScore" stroke="#1B4332" strokeWidth={2.5} dot={{ fill: '#1B4332', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-300">
              {lang === 'tr' ? 'Yeterli veri yok' : 'Not enough data'}
            </div>
          )}
        </div>

        {/* Score distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#52B788]" />
            {lang === 'tr' ? 'Puan Dağılımı' : 'Score Distribution'}
          </h3>
          <div className="space-y-2.5">
            {ranges.map(r => {
              const pct = s.totalEvaluations > 0 ? Math.round((r.count / s.totalEvaluations) * 100) : 0
              return (
                <div key={r.range} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-500 w-14 flex-shrink-0">{r.range}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: r.color }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-8 text-right">{r.count}</span>
                </div>
              )
            })}
          </div>
          {s.totalEvaluations === 0 && (
            <p className="text-xs text-gray-300 text-center mt-6">{lang === 'tr' ? 'Veri yok' : 'No data'}</p>
          )}
        </div>
      </div>

      {/* ── Row 4: Recent evals + Result distribution ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

        {/* Recent evaluations table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{t.dashboard.recentEvaluations}</h3>
            <Link href="/evaluations" className="text-xs text-[#1B4332] font-medium hover:underline flex items-center gap-1">
              {t.common.view} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">{t.common.noData}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">{t.evaluations.consultant}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">{t.evaluations.customer}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 hidden sm:table-cell">{t.evaluations.channel}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 hidden md:table-cell">
                      {lang === 'tr' ? 'Sonuç' : 'Result'}
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-400">{t.evaluations.finalScore}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recent.map(ev => (
                    <tr key={ev.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900 max-w-[110px] truncate">
                        {ev.consultant_name}
                      </td>
                      <td className="px-4 py-3 max-w-[120px]">
                        <p className="text-sm text-gray-600 truncate">{ev.customer_name}</p>
                        {ev.stage && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 mt-0.5">
                            <Layers className="w-2.5 h-2.5" />
                            {ev.stage.replace(/_/g, ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <ChannelBadge channel={ev.channel} labels={t.channel} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <ResultBadge result={ev.conversation_result} lang={lang} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ScoreBadge score={ev.final_score} lang={lang} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Conversation result distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {lang === 'tr' ? 'Sonuç Dağılımı' : 'Result Breakdown'}
          </h3>
          {resultChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={resultChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {resultChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px', padding: '8px 12px' }}
                    formatter={(v) => [v, lang === 'tr' ? 'Değerlendirme' : 'Evaluations']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {resultChartData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600 font-medium">{d.name}</span>
                    </div>
                    <span className="font-bold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-300">
              {lang === 'tr' ? 'Veri yok' : 'No data'}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 5: Stage distribution + Channel comparison ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">

        {/* Stage distribution */}
        {stages.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#52B788]" />
              {lang === 'tr' ? 'Stage Bazlı Dağılım' : 'Stage Distribution'}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stages} barSize={28} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px', padding: '8px 12px' }}
                  formatter={(v, name) => [v, name === 'count' ? (lang === 'tr' ? 'Değerlendirme' : 'Evaluations') : (lang === 'tr' ? 'Ort. Puan' : 'Avg Score')]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#1B4332" opacity={0.85} name="count" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-2">
              {stages.map(s => (
                <div key={s.stage} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{s.label}:</span>
                  <span>{lang === 'tr' ? 'Ort.' : 'Avg'} {s.avgScore}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Channel comparison bar chart */}
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${stages.length === 0 ? 'lg:col-span-3' : ''}`}>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{t.dashboard.channelComparison}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={44}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px', padding: '8px 12px' }}
                cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 6 }}
                formatter={(value) => [`${value}`, lang === 'tr' ? 'Ort. Skor' : 'Avg. Score']}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? '#52B788' : '#1B4332'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: i === 0 ? '#52B788' : '#1B4332' }} />
                  {d.name}
                </div>
                <span className="font-medium text-gray-700">
                  {d.score} {lang === 'tr' ? 'ort.' : 'avg'} · {d.count} {lang === 'tr' ? 'değ.' : 'eval.'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 6: Consultant performance table ──────────────────── */}
      {cStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{t.dashboard.scoreByConsultant}</h3>
            <Link href="/reports" className="text-xs text-[#1B4332] font-medium hover:underline flex items-center gap-1">
              {t.nav.reports} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 w-10">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">{t.reports.consultantTable.consultant}</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-400">{t.reports.consultantTable.evaluationCount}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 hidden sm:table-cell">
                    {lang === 'tr' ? 'Skor Çubuğu' : 'Score Bar'}
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-400">{t.reports.consultantTable.averageScore}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cStats.map((c, i) => {
                  return (
                    <tr key={`${c.full_name}-${i}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.full_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{c.evaluationCount}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="w-full max-w-[160px] h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${c.averageScore}%`,
                              backgroundColor: c.averageScore >= 80 ? '#22C55E' : c.averageScore >= 60 ? '#3B82F6' : c.averageScore >= 40 ? '#F59E0B' : '#EF4444',
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ScoreBadge score={c.averageScore} lang={lang} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
