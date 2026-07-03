'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, X, MessageSquare, Phone, Users, BarChart2, AlertCircle, Award } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { getScoreLevel } from '@/lib/scoring'
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
  'text-sm border border-gray-200 rounded-xl bg-gray-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] cursor-pointer'

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
}: Props) {
  const { lang, t } = useLanguage()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ── URL helpers ────────────────────────────────────────────────

  function pushParams(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    const current: Record<string, string> = {
      tab: activeTab,
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
      router.replace(`/reports?tab=${activeTab}`)
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

    XLSX.utils.writeFile(wb, `quality-report-${new Date().toISOString().slice(0, 10)}.xlsx`)
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

      {/* ── Filter panel ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Date range */}
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="date"
              value={filterStartDate}
              onChange={e => pushParams({ startDate: e.target.value })}
              className={`${selectClass} w-[130px] sm:w-36`}
              title={lang === 'tr' ? 'Başlangıç tarihi' : 'Start date'}
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={e => pushParams({ endDate: e.target.value })}
              className={`${selectClass} w-[130px] sm:w-36`}
              title={lang === 'tr' ? 'Bitiş tarihi' : 'End date'}
            />
          </div>

          {/* Consultant */}
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

          {/* Team (quality_team + manager only) */}
          {(role === 'quality_team' || role === 'manager') && (
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
          )}

          {/* Channel */}
          <select
            value={filterChannel}
            onChange={e => pushParams({ channel: e.target.value })}
            className={selectClass}
          >
            <option value="">{t.reports.channel}</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="call">{t.channel.call}</option>
          </select>

          {/* Result */}
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
              onClick={() => pushParams({ tab: id })}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === id
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
          {activeTab === 'consultantPerformance' && (
            <div className="overflow-x-auto">
              {consultantPerf.length === 0 ? (
                <EmptyState lang={lang} />
              ) : (
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
              )}
            </div>
          )}

          {/* ── Tab 2: Channel Comparison ──────────────────────── */}
          {activeTab === 'channelComparison' && (
            <div className="p-6">
              {channelComp.every(r => r.evaluationCount === 0) ? (
                <EmptyState lang={lang} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              )}
            </div>
          )}

          {/* ── Tab 3: Critical Error Report ───────────────────── */}
          {activeTab === 'criticalErrors' && (
            <div className="overflow-x-auto">
              {criticalErrors.length === 0 ? (
                <EmptyState lang={lang} />
              ) : (
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
              )}
            </div>
          )}

          {/* ── Tab 4: Sales Outcome ────────────────────────────── */}
          {activeTab === 'salesOutcome' && (
            <div className="overflow-x-auto">
              {salesOutcome.length === 0 ? (
                <EmptyState lang={lang} />
              ) : (
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
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
