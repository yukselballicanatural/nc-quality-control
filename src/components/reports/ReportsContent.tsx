'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Download, X, MessageSquare, Phone, Users, BarChart2, AlertCircle, Award,
  ClipboardList, Gauge, ShieldAlert, Trophy, ChevronDown,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { getScoreLevel } from '@/lib/scoring'
import { DatePicker } from '@/components/ui/DatePicker'
import type { UserRole, ConversationResult, CriticalErrorType } from '@/types/supabase'
import type { ConsultantPerfRow, ChannelCompRow, CriticalErrorRow, SalesOutcomeRow } from '@/types'

// ─── Tab type ────────────────────────────────────────────────────

type TabId = 'consultantPerformance' | 'channelComparison' | 'criticalErrors' | 'salesOutcome'

// ─── Label maps (not in i18n) ─────────────────────────────────────

const CE_LABELS_TR: Record<CriticalErrorType, string> = {
  wrong_price: 'Yanlış Fiyat',
  wrong_package: 'Yanlış Paket',
  result_guarantee: 'Sonuç Garantisi',
  medical_misleading: 'Tıbbi Yanıltma',
  rude_behavior: 'Kaba Davranış',
  unanswered_question: 'Cevapsız Soru',
  wrong_payment_guide: 'Yanlış Ödeme Bilgisi',
  wrong_appointment: 'Yanlış Randevu',
  no_crm_record: 'CRM Kaydı Yok',
  missed_followup: 'Takip Kaçırıldı',
}

const CE_LABELS_EN: Record<CriticalErrorType, string> = {
  wrong_price: 'Wrong Price',
  wrong_package: 'Wrong Package',
  result_guarantee: 'Result Guarantee',
  medical_misleading: 'Medical Misleading',
  rude_behavior: 'Rude Behavior',
  unanswered_question: 'Unanswered Question',
  wrong_payment_guide: 'Wrong Payment Guide',
  wrong_appointment: 'Wrong Appointment',
  no_crm_record: 'No CRM Record',
  missed_followup: 'Missed Follow-up',
}

const RESULT_LABELS_TR: Record<ConversationResult, string> = {
  won: 'Kazanıldı',
  open: 'Açık',
  follow_up: 'Takipte',
  lost: 'Kaybedildi',
  no_answer: 'Cevap Yok',
}

const RESULT_LABELS_EN: Record<ConversationResult, string> = {
  won: 'Won',
  open: 'Open',
  follow_up: 'Follow Up',
  lost: 'Lost',
  no_answer: 'No Answer',
}

const RESULT_COLORS: Record<ConversationResult, string> = {
  won: 'bg-green-100 text-green-700',
  open: 'bg-blue-100 text-blue-700',
  follow_up: 'bg-amber-100 text-amber-700',
  lost: 'bg-red-100 text-red-700',
  no_answer: 'bg-gray-100 text-gray-600',
}

const selectClass =
  'appearance-none w-full text-sm font-medium text-gray-700 border border-gray-200 rounded-xl bg-gray-50 pl-3.5 pr-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] hover:border-gray-300 transition-colors cursor-pointer truncate'

// ─── Props ────────────────────────────────────────────────────────

interface Props {
  consultants: { id: string; full_name: string }[]
  teams: { id: string; name: string }[]
  consultantPerf: ConsultantPerfRow[]
  channelComp: ChannelCompRow[]
  criticalErrors: CriticalErrorRow[]
  salesOutcome: SalesOutcomeRow[]
  totalEvaluations: number
  filterStartDate: string
  filterEndDate: string
  filterConsultantId: string
  filterTeamId: string
  filterChannel: string
  filterResult: string
  activeTab: string
  role: UserRole
  overallAvgScore: number
  totalCriticalErrors: number
  overallWonRate: number
}

// ─── Component ────────────────────────────────────────────────────

export function ReportsContent({
  consultants,
  teams,
  consultantPerf,
  channelComp,
  criticalErrors,
  salesOutcome,
  totalEvaluations,
  filterStartDate,
  filterEndDate,
  filterConsultantId,
  filterTeamId,
  filterChannel,
  filterResult,
  activeTab,
  role,
  overallAvgScore,
  totalCriticalErrors,
  overallWonRate,
}: Props) {
  const { lang, t } = useLanguage()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // Tab switching needs no server round-trip — every tab's data is already
  // in props. Keep it as local state so it's instant, and mirror it into the
  // URL via history.replaceState (no Next.js navigation, no refetch) purely
  // so the tab survives a manual page refresh / is shareable as a link.
  const [tab, setTab] = useState(activeTab as TabId)

  function switchTab(id: TabId) {
    setTab(id)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', id)
    window.history.replaceState(null, '', url.toString())
  }

  // ── URL helpers ────────────────────────────────────────────────

  function pushParams(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    const current: Record<string, string> = {
      tab,
      startDate: filterStartDate,
      endDate: filterEndDate,
      consultantId: filterConsultantId,
      teamId: filterTeamId,
      channel: filterChannel,
      result: filterResult,
    }
    const merged = { ...current, ...overrides }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    startTransition(() => {
      router.replace(`/reports?${params.toString()}`)
    })
  }

  function clearFilters() {
    startTransition(() => {
      router.replace(`/reports?tab=${tab}`)
    })
  }

  // ── Excel export ───────────────────────────────────────────────

  async function handleExport() {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const ceLabels = lang === 'tr' ? CE_LABELS_TR : CE_LABELS_EN
    const resultLabels = lang === 'tr' ? RESULT_LABELS_TR : RESULT_LABELS_EN

    // Sheet 1: Consultant Performance
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        consultantPerf.map(r => ({
          [lang === 'tr' ? 'Danışman' : 'Consultant']: r.consultantName,
          [lang === 'tr' ? 'Değerlendirme' : 'Evaluations']: r.evaluationCount,
          [lang === 'tr' ? 'Ort. Skor' : 'Avg Score']: r.avgScore,
          [lang === 'tr' ? 'Kritik Hata' : 'Critical Errors']: r.criticalErrorCount,
          [lang === 'tr' ? 'Kazanma % ' : 'Won Rate %']: r.wonRate,
        }))
      ),
      lang === 'tr' ? 'Danışman Perf.' : 'Consultant Perf.'
    )

    // Sheet 2: Channel Comparison
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        channelComp.map(r => ({
          [lang === 'tr' ? 'Kanal' : 'Channel']:
            r.channel === 'whatsapp' ? 'WhatsApp' : lang === 'tr' ? 'Arama' : 'Call',
          [lang === 'tr' ? 'Değerlendirme' : 'Evaluations']: r.evaluationCount,
          [lang === 'tr' ? 'Ort. Skor' : 'Avg Score']: r.avgScore,
          [lang === 'tr' ? 'Kritik Hata' : 'Critical Errors']: r.criticalErrorCount,
        }))
      ),
      lang === 'tr' ? 'Kanal Karş.' : 'Channel Comp.'
    )

    // Sheet 3: Critical Errors
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        criticalErrors.map(r => ({
          [lang === 'tr' ? 'Hata Türü' : 'Error Type']: ceLabels[r.errorType],
          [lang === 'tr' ? 'Toplam' : 'Total']: r.totalCount,
          [lang === 'tr' ? 'Danışman Dağılımı' : 'By Consultant']: r.consultants
            .map(c => `${c.name}: ${c.count}`)
            .join(', '),
        }))
      ),
      lang === 'tr' ? 'Kritik Hatalar' : 'Critical Errors'
    )

    // Sheet 4: Sales Outcome
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        salesOutcome.map(r => ({
          [lang === 'tr' ? 'Sonuç' : 'Result']: resultLabels[r.result],
          [lang === 'tr' ? 'Adet' : 'Count']: r.evaluationCount,
          [lang === 'tr' ? 'Ort. Skor' : 'Avg Score']: r.avgScore,
        }))
      ),
      lang === 'tr' ? 'Satış Sonucu' : 'Sales Outcome'
    )

    XLSX.writeFile(wb, `quality-report-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // ── Derived ────────────────────────────────────────────────────

  const hasFilters =
    filterStartDate ||
    filterEndDate ||
    filterConsultantId ||
    filterTeamId ||
    filterChannel ||
    filterResult

  const ceLabels = lang === 'tr' ? CE_LABELS_TR : CE_LABELS_EN
  const resultLabels = lang === 'tr' ? RESULT_LABELS_TR : RESULT_LABELS_EN

  const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
    { id: 'consultantPerformance', label: t.reports.tabs.consultantPerformance, Icon: Users },
    { id: 'channelComparison', label: t.reports.tabs.channelComparison, Icon: BarChart2 },
    { id: 'criticalErrors', label: t.reports.tabs.criticalErrors, Icon: AlertCircle },
    { id: 'salesOutcome', label: t.reports.tabs.salesOutcome, Icon: Award },
  ]

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.reports.pageTitle}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalEvaluations} {lang === 'tr' ? 'değerlendirme' : 'evaluations'}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#1B4332] hover:bg-[#163728] active:bg-[#122e20] rounded-xl transition-colors flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">{t.reports.exportExcel}</span>
        </button>
      </div>

      {/* ── Overview KPI cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={ClipboardList}
          label={lang === 'tr' ? 'Toplam Değerlendirme' : 'Total Evaluations'}
          value={String(totalEvaluations)}
        />
        <KpiCard
          icon={Gauge}
          label={lang === 'tr' ? 'Genel Ortalama Skor' : 'Overall Avg Score'}
          value={`${overallAvgScore}/100`}
          valueClassName={getScoreLevel(overallAvgScore).textColor}
        />
        <KpiCard
          icon={ShieldAlert}
          label={lang === 'tr' ? 'Toplam Kritik Hata' : 'Total Critical Errors'}
          value={String(totalCriticalErrors)}
          valueClassName={totalCriticalErrors > 0 ? 'text-red-600' : 'text-gray-900'}
        />
        <KpiCard
          icon={Trophy}
          label={lang === 'tr' ? 'Genel Kazanma Oranı' : 'Overall Won Rate'}
          value={`%${overallWonRate}`}
          valueClassName={overallWonRate >= 50 ? 'text-green-700' : 'text-gray-900'}
        />
      </div>

      {/* ── Filter panel ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Date range */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="w-[160px] sm:w-44">
              <DatePicker
                value={filterStartDate}
                onChange={v => pushParams({ startDate: v })}
                placeholder={lang === 'tr' ? 'Başlangıç' : 'Start date'}
                maxDate={filterEndDate || undefined}
              />
            </div>
            <span className="text-gray-400 text-sm">-</span>
            <div className="w-[160px] sm:w-44">
              <DatePicker
                value={filterEndDate}
                onChange={v => pushParams({ endDate: v })}
                placeholder={lang === 'tr' ? 'Bitiş' : 'End date'}
                minDate={filterStartDate || undefined}
              />
            </div>
          </div>

          {/* Consultant */}
          <div className="relative w-[170px] flex-shrink-0">
            <select
              value={filterConsultantId}
              onChange={e => pushParams({ consultantId: e.target.value })}
              className={selectClass}
            >
              <option value="">{t.reports.consultant}</option>
              {consultants.map(c => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Team (quality_team + manager only) */}
          {(role === 'quality_team' || role === 'manager') && (
            <div className="relative w-[150px] flex-shrink-0">
              <select
                value={filterTeamId}
                onChange={e => pushParams({ teamId: e.target.value })}
                className={selectClass}
              >
                <option value="">{t.reports.team}</option>
                {teams.map(tm => (
                  <option key={tm.id} value={tm.id}>
                    {tm.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Channel */}
          <div className="relative w-[140px] flex-shrink-0">
            <select
              value={filterChannel}
              onChange={e => pushParams({ channel: e.target.value })}
              className={selectClass}
            >
              <option value="">{t.reports.channel}</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="call">{t.channel.call}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Result */}
          <div className="relative w-[150px] flex-shrink-0">
            <select
              value={filterResult}
              onChange={e => pushParams({ result: e.target.value })}
              className={selectClass}
            >
              <option value="">{t.reports.result}</option>
              {(
                ['won', 'open', 'follow_up', 'lost', 'no_answer'] as ConversationResult[]
              ).map(r => (
                <option key={r} value={r}>
                  {resultLabels[r]}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">{t.reports.clearFilters}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs + content ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                tab === id
                  ? 'text-[#1B4332] border-[#1B4332]'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          className={`transition-opacity duration-150 ${isPending ? 'opacity-60' : 'opacity-100'}`}
        >
          {/* ── Tab 1: Consultant Performance ─────────────────── */}
          {tab === 'consultantPerformance' && (
            <div>
              {consultantPerf.length === 0 ? (
                <EmptyState lang={lang} />
              ) : (
                <>
                  <div className="px-5 pt-5">
                    <ResponsiveContainer width="100%" height={Math.max(180, consultantPerf.slice(0, 10).length * 34)}>
                      <BarChart
                        data={consultantPerf.slice(0, 10).map(r => ({ name: r.consultantName, score: r.avgScore }))}
                        layout="vertical"
                        margin={{ left: 8, right: 24 }}
                      >
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={110}
                          tick={{ fontSize: 12, fill: '#374151' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(27, 67, 50, 0.04)' }}
                          contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)', fontSize: 12 }}
                          formatter={(value: unknown) => [String(value ?? ''), t.reports.consultantTable.averageScore]}
                        />
                        <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={18}>
                          {consultantPerf.slice(0, 10).map((row, index) => (
                            <Cell key={index} fill={scoreBarColor(row.avgScore)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {consultantPerf.length > 10 && (
                    <p className="px-5 pt-1 text-[11px] text-gray-400">
                      {lang === 'tr'
                        ? `İlk 10 danışman gösteriliyor · toplam ${consultantPerf.length}`
                        : `Showing top 10 · ${consultantPerf.length} total`}
                    </p>
                  )}
                  <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/60 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">
                        {t.reports.consultantTable.consultant}
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                        {t.reports.consultantTable.evaluationCount}
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                        {t.reports.consultantTable.averageScore}
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                        {t.reports.consultantTable.criticalErrors}
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                        {t.reports.consultantTable.wonRate}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultantPerf.map(row => {
                      const level = getScoreLevel(row.avgScore)
                      return (
                        <tr
                          key={row.consultantId}
                          className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {row.consultantName}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {row.evaluationCount}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold ${level.textColor}`}>{row.avgScore}</span>
                            <span className="text-gray-300 text-xs ml-0.5">/100</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={
                                row.criticalErrorCount > 0
                                  ? 'text-red-600 font-semibold'
                                  : 'text-gray-400'
                              }
                            >
                              {row.criticalErrorCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`font-semibold ${
                                row.wonRate >= 50 ? 'text-green-700' : 'text-gray-600'
                              }`}
                            >
                              %{row.wonRate}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Tab 2: Channel Comparison ──────────────────────── */}
          {tab === 'channelComparison' && (
            <div className="p-6">
              {channelComp.every(r => r.evaluationCount === 0) ? (
                <EmptyState lang={lang} />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={channelComp.map(r => ({
                        name: r.channel === 'whatsapp' ? 'WhatsApp' : (lang === 'tr' ? 'Arama' : 'Call'),
                        score: r.avgScore,
                      }))}
                      barSize={56}
                    >
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip
                        cursor={{ fill: 'rgba(27, 67, 50, 0.04)' }}
                        contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)', fontSize: 12 }}
                        formatter={(value: unknown) => [String(value ?? ''), t.reports.consultantTable.averageScore]}
                      />
                      <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                        {channelComp.map((_, index) => (
                          <Cell key={index} fill={index === 0 ? '#52B788' : '#1B4332'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {channelComp.map(row => {
                    const level = getScoreLevel(row.avgScore)
                    const isWhatsApp = row.channel === 'whatsapp'
                    const Icon = isWhatsApp ? MessageSquare : Phone
                    const iconColor = isWhatsApp ? 'text-green-600' : 'text-blue-600'
                    const cardBg = isWhatsApp
                      ? 'bg-green-50 border-green-100'
                      : 'bg-blue-50 border-blue-100'
                    const channelLabel = isWhatsApp
                      ? 'WhatsApp'
                      : lang === 'tr'
                      ? 'Arama'
                      : 'Call'
                    return (
                      <div key={row.channel} className={`rounded-2xl border p-5 ${cardBg}`}>
                        <div className="flex items-center gap-2 mb-5">
                          <Icon className={`w-5 h-5 ${iconColor}`} />
                          <span className="font-semibold text-gray-900">{channelLabel}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">
                              {lang === 'tr' ? 'Değerlendirme' : 'Evaluations'}
                            </div>
                            <div className="text-3xl font-bold text-gray-900">
                              {row.evaluationCount}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">
                              {t.reports.consultantTable.averageScore}
                            </div>
                            <div className={`text-3xl font-bold ${level.textColor}`}>
                              {row.avgScore}
                            </div>
                            <div className="text-xs text-gray-400">/100</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">
                              {t.reports.consultantTable.criticalErrors}
                            </div>
                            <div
                              className={`text-3xl font-bold ${
                                row.criticalErrorCount > 0 ? 'text-red-600' : 'text-gray-400'
                              }`}
                            >
                              {row.criticalErrorCount}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                </>
              )}
            </div>
          )}

          {/* ── Tab 3: Critical Error Report ───────────────────── */}
          {tab === 'criticalErrors' && (
            <div>
              {criticalErrors.length === 0 ? (
                <EmptyState lang={lang} />
              ) : (
                <>
                  <div className="px-5 pt-5">
                    <ResponsiveContainer width="100%" height={Math.max(140, criticalErrors.length * 36)}>
                      <BarChart
                        data={criticalErrors.map(r => ({ name: ceLabels[r.errorType], count: r.totalCount }))}
                        layout="vertical"
                        margin={{ left: 8, right: 24 }}
                      >
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={130}
                          tick={{ fontSize: 12, fill: '#374151' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(239, 68, 68, 0.04)' }}
                          contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)', fontSize: 12 }}
                          formatter={(value: unknown) => [String(value ?? ''), t.reports.criticalErrorReport.totalCount]}
                        />
                        <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={18} fill="#EF4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/60 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                        {t.reports.criticalErrorReport.errorType}
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                        {t.reports.criticalErrorReport.totalCount}
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">
                        {t.reports.criticalErrorReport.consultantBreakdown}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticalErrors.map(row => (
                      <tr
                        key={row.errorType}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {ceLabels[row.errorType]}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-red-600 font-bold">{row.totalCount}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {row.consultants.map(c => (
                              <span
                                key={c.name}
                                className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded-full font-medium"
                              >
                                {c.name} ({c.count})
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Tab 4: Sales Outcome ────────────────────────────── */}
          {tab === 'salesOutcome' && (
            <div>
              {salesOutcome.length === 0 ? (
                <EmptyState lang={lang} />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 p-5">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={salesOutcome.map(r => ({ name: resultLabels[r.result], value: r.evaluationCount, result: r.result }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {salesOutcome.map(row => (
                            <Cell key={row.result} fill={RESULT_CHART_COLORS[row.result]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)', fontSize: 12 }}
                          formatter={(value: unknown) => [String(value ?? ''), lang === 'tr' ? 'Kayıt' : 'Records']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col justify-center gap-2">
                      {salesOutcome.map(row => (
                        <div key={row.result} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2">
                          <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RESULT_CHART_COLORS[row.result] }} />
                            {resultLabels[row.result]}
                          </span>
                          <span className="text-sm font-bold text-gray-950">{row.evaluationCount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/60 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">
                        {t.reports.salesOutcome.result}
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                        {t.reports.salesOutcome.count}
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                        {t.reports.salesOutcome.averageScore}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesOutcome.map(row => {
                      const level = getScoreLevel(row.avgScore)
                      return (
                        <tr
                          key={row.result}
                          className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                                RESULT_COLORS[row.result]
                              }`}
                            >
                              {resultLabels[row.result]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 font-medium">
                            {row.evaluationCount}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-bold ${level.textColor}`}>{row.avgScore}</span>
                            <span className="text-gray-300 text-xs ml-0.5">/100</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Result chart colors ──────────────────────────────────────────

const RESULT_CHART_COLORS: Record<ConversationResult, string> = {
  won: '#22C55E',
  open: '#3B82F6',
  follow_up: '#F59E0B',
  lost: '#EF4444',
  no_answer: '#9CA3AF',
}

// ─── Empty state ─────────────────────────────────────────────────

function EmptyState({ lang }: { lang: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-gray-400">
        {lang === 'tr' ? 'Bu filtreler için veri bulunamadı.' : 'No data found for these filters.'}
      </p>
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  valueClassName = 'text-gray-900',
}: {
  icon: React.ElementType
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-[#52B788]/12 text-[#1B4332]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-400">
        {label}
      </div>
      <div className={`mt-1 text-xl font-black ${valueClassName}`}>{value}</div>
    </div>
  )
}

// ─── Score bar color helper ───────────────────────────────────────

function scoreBarColor(score: number): string {
  if (score >= 90) return '#22C55E'
  if (score >= 80) return '#3B82F6'
  if (score >= 60) return '#F59E0B'
  return '#EF4444'
}
