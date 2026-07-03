'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Pencil, Loader2, MessageSquare, Phone, Check, AlertTriangle, Layers,
} from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'
import { getScoreLevel } from '@/lib/scoring'
import {
  CRITERIA,
  WHATSAPP_QUESTIONS,
  CALL_QUESTIONS,
  CRITICAL_ERROR_LABELS,
  CHECK_ANSWER_OPTIONS,
} from '@/lib/constants'
import type { EvaluationWithRelations } from '@/types'

const STAGE_LABELS: Record<string, { tr: string; en: string; color: string }> = {
  fresh_lead:              { tr: 'Fresh Lead',              en: 'Fresh Lead',              color: 'bg-emerald-100 text-emerald-700' },
  new_sales_opportunities: { tr: 'New Sales Opportunities', en: 'New Sales Opportunities', color: 'bg-blue-100 text-blue-700' },
  warm_lead:               { tr: 'Warm Lead',               en: 'Warm Lead',               color: 'bg-amber-100 text-amber-700' },
  offer_created:           { tr: 'Offer Created',           en: 'Offer Created',           color: 'bg-violet-100 text-violet-700' },
  offer_shared:            { tr: 'Offer Shared',            en: 'Offer Shared',            color: 'bg-purple-100 text-purple-700' },
  platform_agents:         { tr: 'Platform Agents',         en: 'Platform Agents',         color: 'bg-indigo-100 text-indigo-700' },
  deal:                    { tr: 'Deal',                    en: 'Deal',                    color: 'bg-green-100 text-green-700' },
  second_visit:            { tr: 'Second Visit',            en: 'Second Visit',            color: 'bg-orange-100 text-orange-700' },
}

const ALL_STAGE_KEYS = Object.keys(STAGE_LABELS)

// ─── Types ───────────────────────────────────────────────────────────

interface Props {
  evalId: string | null
  evaluation: EvaluationWithRelations | null
  loading: boolean
  canEdit: boolean
  onClose: () => void
}

// ─── Score pill ──────────────────────────────────────────────────────

const SCORE_COLORS: Record<number, string> = {
  10: 'bg-emerald-100 text-emerald-700',
  7:  'bg-blue-100 text-blue-700',
  5:  'bg-amber-100 text-amber-700',
  0:  'bg-red-100 text-red-700',
}

const CHECK_COLORS: Record<string, string> = {
  successful:     'bg-emerald-100 text-emerald-700',
  partially:      'bg-amber-100 text-amber-700',
  unsuccessful:   'bg-red-100 text-red-700',
  not_applicable: 'bg-gray-100 text-gray-500',
}

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-50 text-blue-700',
  approved:  'bg-green-50 text-green-700',
  rejected:  'bg-red-50 text-red-700',
}

const RESULT_STYLES: Record<string, string> = {
  won:       'bg-green-100 text-green-700',
  open:      'bg-blue-100 text-blue-700',
  follow_up: 'bg-amber-100 text-amber-700',
  lost:      'bg-red-100 text-red-700',
  no_answer: 'bg-gray-100 text-gray-600',
}

// ─── Section header ──────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-1">
        {title}
      </p>
      {children}
    </div>
  )
}

// ─── Modal body ──────────────────────────────────────────────────────

function ModalBody({ ev }: { ev: EvaluationWithRelations }) {
  const { lang, t } = useLanguage()

  const finalScore = ev.is_auto_failed ? 0 : ev.final_score
  const level = getScoreLevel(finalScore)

  // Criteria map: number → score row
  const stageKey = ev.lead_id && ALL_STAGE_KEYS.includes(ev.lead_id) ? ev.lead_id : null
  const stageMeta = stageKey ? STAGE_LABELS[stageKey] : null
  const isStageEval = !!stageKey && (ev.criteria_scores ?? []).length === 0

  const criteriaMap = Object.fromEntries(
    (ev.criteria_scores ?? []).map(cs => [cs.criteria_number, cs])
  )

  // Channel checks map: question_number → check row
  const checksMap = Object.fromEntries(
    (ev.channel_checks ?? []).map(cc => [cc.question_number, cc])
  )

  const questions = ev.channel === 'whatsapp' ? WHATSAPP_QUESTIONS : CALL_QUESTIONS

  const hasSalesData = [
    ev.sales_understood_motivation,
    ev.sales_eased_decision,
    ev.sales_opportunity_used,
    ev.sales_result_reason,
    ev.sales_best_behavior,
    ev.sales_risk_behavior,
  ].some(Boolean)

  const hasDevData = [
    ev.dev_strengths,
    ev.dev_areas_to_improve,
    ev.dev_coaching_topic,
    ev.dev_team_leader_comment,
    ev.dev_consultant_plan,
    ev.dev_recheck_date,
  ].some(Boolean)

  return (
    <div className="space-y-4 sm:space-y-5 px-3 pb-6 sm:px-5 sm:pb-8">

      {/* ── Basic info ─────────────────────────────────── */}
      <Section title={lang === 'tr' ? 'Temel Bilgiler' : 'Basic Info'}>
        <div className="bg-gray-50 rounded-2xl p-3 sm:p-4 grid grid-cols-2 gap-2 sm:gap-3 text-sm">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{t.evaluations.consultant}</p>
            <p className="font-semibold text-gray-800">{ev.consultant?.full_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{t.evaluations.customer}</p>
            <p className="font-semibold text-gray-800">{ev.customer_name}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{t.evaluations.channel}</p>
            <div className="flex items-center gap-1.5">
              {ev.channel === 'whatsapp'
                ? <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                : <Phone className="w-3.5 h-3.5 text-blue-600" />
              }
              <span className="font-medium text-gray-700">
                {ev.channel === 'whatsapp' ? 'WhatsApp' : t.channel.call}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{t.evaluations.conversationDate}</p>
            <p className="font-medium text-gray-700">{ev.conversation_date}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{t.evaluations.result}</p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${RESULT_STYLES[ev.conversation_result]}`}>
              {t.conversationResult[ev.conversation_result]}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{t.evaluations.status}</p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[ev.status]}`}>
              {t.status[ev.status]}
            </span>
          </div>
          {stageMeta && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                {lang === 'tr' ? 'Stage' : 'Stage'}
              </p>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${stageMeta.color}`}>
                <Layers className="w-3 h-3" />
                {lang === 'tr' ? stageMeta.tr : stageMeta.en}
              </span>
            </div>
          )}
          {ev.evaluator && (
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                {lang === 'tr' ? 'Değerlendiren' : 'Evaluator'}
              </p>
              <p className="font-medium text-gray-700">{ev.evaluator.full_name}</p>
            </div>
          )}
          {ev.general_note && (
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                {lang === 'tr' ? 'Genel Not' : 'General Note'}
              </p>
              <p className="text-gray-700 text-sm leading-relaxed">{ev.general_note}</p>
            </div>
          )}
        </div>
      </Section>

      {/* ── Score overview ─────────────────────────────── */}
      <Section title={lang === 'tr' ? 'Puan Özeti' : 'Score Overview'}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-gray-50 rounded-2xl p-3.5 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              {lang === 'tr' ? 'Ham Puan' : 'Raw Score'}
            </p>
            <p className="text-2xl font-black text-gray-600 tabular-nums">{ev.raw_score}</p>
          </div>
          <div className={`rounded-2xl p-3.5 text-center ${level.bgColor}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 opacity-70 ${level.textColor}`}>
              {lang === 'tr' ? 'Final Puan' : 'Final Score'}
            </p>
            <p className={`text-2xl font-black tabular-nums ${level.textColor}`}>{finalScore}</p>
            <p className={`text-[9px] font-bold mt-1 opacity-80 ${level.textColor}`}>
              {lang === 'tr' ? level.label : level.labelEn}
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-3.5 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              {lang === 'tr' ? 'Kritik Hata' : 'Critical Err.'}
            </p>
            <p className={`text-2xl font-black tabular-nums ${ev.critical_error_count > 0 ? 'text-orange-500' : 'text-gray-300'}`}>
              {ev.critical_error_count}
            </p>
          </div>
          <div className={`rounded-2xl p-3.5 text-center ${ev.is_auto_failed ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wide mb-1.5 ${ev.is_auto_failed ? 'text-red-400' : 'text-gray-400'}`}>
              {lang === 'tr' ? 'Otomatik Fail' : 'Auto Failed'}
            </p>
            <p className={`text-xl font-black ${ev.is_auto_failed ? 'text-red-600' : 'text-gray-300'}`}>
              {ev.is_auto_failed ? (lang === 'tr' ? 'Evet' : 'Yes') : (lang === 'tr' ? 'Hayır' : 'No')}
            </p>
          </div>
        </div>
      </Section>

      {/* ── Criteria scores ────────────────────────────── */}
      {isStageEval ? (
        <Section title={lang === 'tr' ? 'Değerlendirme Puanı' : 'Evaluation Score'}>
          <div className={`rounded-2xl p-4 flex items-center gap-4 ${level.bgColor}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/60`}>
              <Layers className={`w-6 h-6 ${level.textColor}`} />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wide opacity-70 mb-0.5 ${level.textColor}`}>
                {stageMeta ? (lang === 'tr' ? stageMeta.tr : stageMeta.en) : 'Stage'} {lang === 'tr' ? 'Değerlendirmesi' : 'Evaluation'}
              </p>
              <p className={`text-3xl font-black tabular-nums ${level.textColor}`}>{finalScore}</p>
              <p className={`text-xs font-semibold mt-0.5 opacity-70 ${level.textColor}`}>
                {lang === 'tr' ? level.label : level.labelEn} · / 100
              </p>
            </div>
          </div>
        </Section>
      ) : (
        <Section title={lang === 'tr' ? 'Kriter Puanları' : 'Criteria Scores'}>
          <div className="space-y-1.5">
            {CRITERIA.map(c => {
              const row = criteriaMap[c.number]
              const label = lang === 'tr' ? c.labelTr : c.labelEn
              const scoredColor = row ? (SCORE_COLORS[row.score_value] ?? 'bg-gray-100 text-gray-600') : ''
              return (
                <div
                  key={c.number}
                  className="flex items-start gap-2.5 sm:gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3"
                >
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      row ? scoredColor : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {row ? (row.score_value === 10 ? <Check className="w-3.5 h-3.5" /> : row.score_value) : c.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-snug">{label}</p>
                    {row?.comment && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed italic">{row.comment}</p>
                    )}
                  </div>
                  {row && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${scoredColor}`}>
                      {row.score_value}
                    </span>
                  )}
                  {!row && (
                    <span className="text-xs text-gray-300 flex-shrink-0">—</span>
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* ── Channel checks ─────────────────────────────── */}
      <Section title={lang === 'tr' ? `${ev.channel === 'whatsapp' ? 'WhatsApp' : t.channel.call} Kontrolleri` : `${ev.channel === 'whatsapp' ? 'WhatsApp' : t.channel.call} Checks`}>
        <div className="space-y-1.5">
          {questions.map(q => {
            const row = checksMap[q.number]
            const label = lang === 'tr' ? q.labelTr : q.labelEn
            const answerOpt = row ? CHECK_ANSWER_OPTIONS.find(o => o.value === row.answer) : null
            const answerLabel = answerOpt ? (lang === 'tr' ? answerOpt.labelTr : answerOpt.labelEn) : '—'
            const answerColor = row ? (CHECK_COLORS[row.answer] ?? 'bg-gray-100 text-gray-500') : ''
            return (
              <div
                key={q.number}
                className="flex items-center gap-2.5 sm:gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2 sm:px-4 sm:py-3"
              >
                <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                  row ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {row ? <Check className="w-3 h-3" /> : q.number}
                </div>
                <p className="text-sm text-gray-700 flex-1 leading-snug">{label}</p>
                {row && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ${answerColor}`}>
                    {answerLabel}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── Critical errors ────────────────────────────── */}
      {(ev.critical_errors ?? []).length > 0 && (
        <Section title={lang === 'tr' ? 'Kritik Hatalar' : 'Critical Errors'}>
          <div className="space-y-1.5">
            {ev.critical_errors.map(ce => {
              const labels = CRITICAL_ERROR_LABELS[ce.error_type]
              return (
                <div key={ce.error_type} className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">
                        {lang === 'tr' ? labels.labelTr : labels.labelEn}
                      </p>
                      {ce.description && (
                        <p className="text-xs text-red-500 mt-1 leading-relaxed">{ce.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* ── Sales analysis ─────────────────────────────── */}
      {hasSalesData && (
        <Section title={lang === 'tr' ? 'Satış Analizi' : 'Sales Analysis'}>
          <div className="space-y-2">
            {[
              { label: lang === 'tr' ? 'Motivasyon anlaşıldı mı?' : 'Motivation understood?', val: ev.sales_understood_motivation },
              { label: lang === 'tr' ? 'Karar kolaylaştırıldı mı?' : 'Decision eased?', val: ev.sales_eased_decision },
              { label: lang === 'tr' ? 'Fırsat kullanıldı mı?' : 'Opportunity used?', val: ev.sales_opportunity_used },
              { label: lang === 'tr' ? 'Sonuç nedeni' : 'Result reason', val: ev.sales_result_reason },
              { label: lang === 'tr' ? 'En iyi davranış' : 'Best behavior', val: ev.sales_best_behavior },
              { label: lang === 'tr' ? 'Risk davranışı' : 'Risk behavior', val: ev.sales_risk_behavior },
            ].filter(f => f.val).map(f => (
              <div key={f.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{f.label}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{f.val}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Development plan ───────────────────────────── */}
      {hasDevData && (
        <Section title={lang === 'tr' ? 'Gelişim Planı' : 'Development Plan'}>
          <div className="space-y-2">
            {[
              { label: lang === 'tr' ? 'Güçlü Yönler' : 'Strengths', val: ev.dev_strengths },
              { label: lang === 'tr' ? 'Gelişim Alanları' : 'Areas to Improve', val: ev.dev_areas_to_improve },
              { label: lang === 'tr' ? 'Koçluk Konusu' : 'Coaching Topic', val: ev.dev_coaching_topic },
              { label: lang === 'tr' ? 'Ekip Lideri Yorumu' : 'Team Leader Comment', val: ev.dev_team_leader_comment },
              { label: lang === 'tr' ? 'Danışman Planı' : 'Consultant Plan', val: ev.dev_consultant_plan },
              { label: lang === 'tr' ? 'Kontrol Tarihi' : 'Recheck Date', val: ev.dev_recheck_date },
            ].filter(f => f.val).map(f => (
              <div key={f.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{f.label}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{f.val}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

// ─── Main modal ──────────────────────────────────────────────────────

export function EvaluationViewModal({ evalId, evaluation, loading, canEdit, onClose }: Props) {
  const { lang } = useLanguage()

  // Close on Escape
  useEffect(() => {
    if (!evalId) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [evalId, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (evalId) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [evalId])

  return (
    <AnimatePresence>
      {evalId && (
        <>
          {/* Backdrop — above sidebar (z-50) */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          {/* Centering wrapper */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 md:p-6">
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.95, y: 16, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.96, y: 8, filter: 'blur(2px)' }}
              transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.85 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/15 flex flex-col overflow-hidden"
              style={{ maxHeight: 'min(92dvh, 92vh)' }}
            >
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-5 border-b border-gray-100">
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm sm:text-base font-bold text-gray-900 truncate">
                    {lang === 'tr' ? 'Değerlendirme Detayı' : 'Evaluation Detail'}
                  </p>
                  {evaluation && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {evaluation.customer_name} · {evaluation.conversation_date}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {canEdit && evalId && (
                    <Link
                      href={`/evaluations/${evalId}`}
                      onClick={onClose}
                      className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-[#1B4332] bg-[#1B4332]/8 hover:bg-[#1B4332]/15 rounded-xl transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="hidden sm:inline">{lang === 'tr' ? 'Düzenle' : 'Edit'}</span>
                    </Link>
                  )}
                  <button
                    onClick={onClose}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {loading && (
                  <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <Loader2 className="w-7 h-7 text-[#1B4332] animate-spin" />
                    <p className="text-sm text-gray-400">
                      {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
                    </p>
                  </div>
                )}
                {!loading && evaluation && (
                  <div className="pt-4 sm:pt-5">
                    <ModalBody ev={evaluation} />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
