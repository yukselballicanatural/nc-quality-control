'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Pencil, Loader2, MessageSquare, Phone, Check, AlertTriangle, Layers,
  User, Users, Building2, Calendar, ClipboardList, TrendingUp,
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
import type { ChannelType } from '@/types/supabase'

// ─── Stage labels ────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, { tr: string; en: string; color: string; bg: string }> = {
  fresh_lead:              { tr: 'Fresh Lead',              en: 'Fresh Lead',              color: 'text-emerald-700', bg: 'bg-emerald-100' },
  new_sales_opportunities: { tr: 'New Sales Opportunities', en: 'New Sales Opportunities', color: 'text-blue-700',    bg: 'bg-blue-100'    },
  warm_lead:               { tr: 'Warm Lead',               en: 'Warm Lead',               color: 'text-amber-700',   bg: 'bg-amber-100'   },
  offer_created:           { tr: 'Offer Created',           en: 'Offer Created',           color: 'text-violet-700',  bg: 'bg-violet-100'  },
  offer_shared:            { tr: 'Offer Shared',            en: 'Offer Shared',            color: 'text-purple-700',  bg: 'bg-purple-100'  },
  platform_agents:         { tr: 'Platform Agents',         en: 'Platform Agents',         color: 'text-indigo-700',  bg: 'bg-indigo-100'  },
  deal:                    { tr: 'Deal',                    en: 'Deal',                    color: 'text-green-700',   bg: 'bg-green-100'   },
  second_visit:            { tr: 'Second Visit',            en: 'Second Visit',            color: 'text-orange-700',  bg: 'bg-orange-100'  },
}
const ALL_STAGE_KEYS = Object.keys(STAGE_LABELS)
const EXTENDED_STAGES = ['offer_created', 'offer_shared', 'platform_agents']

// ─── Stage question definitions ──────────────────────────────────────

const STAGE_QUESTIONS = {
  q1:  { tr: 'Cevap Süresi',                         en: 'Response Time',                   max: 10 },
  q2:  { tr: 'Profesyonel Giriş',                     en: 'Professional Introduction',        max: 10 },
  q3:  { tr: 'İhtiyaç Analizi',                       en: 'Needs Assessment',                 max: 10 },
  q4:  { tr: 'Güven İnşası',                          en: 'Build Trust',                      max: 10 },
  q5:  { tr: 'Bilgi & Fotoğraf Toplama',              en: 'Info & Photo Collection',           max: 10 },
  q6:  { tr: 'Profesyonel İletişim',                  en: 'Professional Communication',        max: 10 },
  q7:  { tr: 'CRM Dokümantasyonu',                    en: 'CRM Documentation',                 max: 10 },
  q8:  { tr: 'Sonraki Adımı Onaylatma',               en: 'Confirm Next Steps',                max: 10 },
  q9:  { tr: 'İlk Görüşmede Fiyat Konuşulmaması',     en: 'No Price Discussion First Call',    max: 10 },
  q10: { tr: 'Bir Hafta İçinde Takip',                en: 'Follow-Up Within One Week',         max: 10 },
}
const OFFER_QUESTIONS = {
  q11: { tr: 'Tedavi Planı Gönderildi mi?',           en: 'Treatment Plan Sent?',              max: 10 },
  q12: { tr: '24 Saat İçinde Teslim Süresi',          en: 'Delivery Timing < 24h',             max: 10 },
  q13: { tr: 'Profesyonel PDF',                       en: 'Professional PDF',                  max: 10 },
  q14: { tr: 'Açık Açıklama',                         en: 'Clear Explanation',                 max: 5  },
  q15: { tr: 'Önce/Sonra Fotoğrafları',               en: 'Before/After Photos',               max: 5  },
  q16: { tr: 'Özlü İletişim',                         en: 'Concise Communication',             max: 5  },
  q17: { tr: 'Teklif Sonrası Takip',                  en: 'Follow-Up After Offer',             max: 5  },
}
const DEAL_QUESTIONS = {
  q1: { tr: 'CRM Güncellendi mi?',                    en: 'CRM Updated?',                      max: 25 },
  q2: { tr: 'Fiyat Onaylandı mı?',                    en: 'Price Confirmed?',                  max: 25 },
  q3: { tr: 'Uçuş & Seyahat Detayları Onaylandı mı?',en: 'Travel Details Confirmed?',         max: 25 },
  q4: { tr: 'Deal Sonrası Profesyonel Takip',         en: 'Professional Follow-Up After Deal', max: 25 },
}
const SV_QUESTION = { tr: 'Profesyonel Takip',        en: 'Professional Follow-Up' }

// ─── Value formatters ────────────────────────────────────────────────

function fmtResponseTime(v: unknown, lang: string): { answer: string; score: number } {
  if (v === '<15') return { answer: '< 15 dak', score: 10 }
  if (v === '=15') return { answer: '= 15 dak', score: 5 }
  if (v === '>15') return { answer: lang === 'tr' ? '> 15 dak' : '> 15 min', score: 0 }
  return { answer: '—', score: 0 }
}

function fmtScore4(v: unknown): { answer: string; score: number } {
  const n = Number(v)
  if (n === 1 || n === 5 || n === 7 || n === 10) return { answer: String(n), score: n }
  return { answer: '—', score: 0 }
}

function fmtYesNo(v: unknown, max: number, lang: string): { answer: string; score: number } {
  if (v === 'yes') return { answer: lang === 'tr' ? 'Evet' : 'Yes', score: max }
  if (v === 'no')  return { answer: lang === 'tr' ? 'Hayır' : 'No',  score: 0 }
  return { answer: '—', score: 0 }
}

function fmtFollowUp(v: unknown, pts: number[], lang: string): { answer: string; score: number } {
  const n = Number(v)
  const labels = lang === 'tr'
    ? ['Hiç takip yok', '1 kez takip', '2 kez takip', '3+ kez takip']
    : ['No follow-up', '1 follow-up', '2 follow-ups', '3+ follow-ups']
  if (n === 0) return { answer: labels[0], score: pts[0] }
  if (n === 1) return { answer: labels[1], score: pts[1] }
  if (n === 2) return { answer: labels[2], score: pts[2] }
  if (n === 3) return { answer: labels[3], score: pts[3] }
  return { answer: '—', score: 0 }
}

function fmtDelivery(v: unknown, lang: string): { answer: string; score: number } {
  if (v === '<24h') return { answer: lang === 'tr' ? '< 24 saat' : '< 24h', score: 10 }
  if (v === '>24h') return { answer: lang === 'tr' ? '> 24 saat' : '> 24h', score: 0 }
  return { answer: '—', score: 0 }
}

// ─── Sub-components ──────────────────────────────────────────────────

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
const CHECK_COLORS: Record<string, string> = {
  successful:     'bg-emerald-100 text-emerald-700',
  partially:      'bg-amber-100 text-amber-700',
  unsuccessful:   'bg-red-100 text-red-700',
  not_applicable: 'bg-gray-100 text-gray-500',
}
const SCORE_COLORS: Record<number, string> = {
  10: 'bg-emerald-100 text-emerald-700',
  7:  'bg-blue-100 text-blue-700',
  5:  'bg-amber-100 text-amber-700',
  1:  'bg-red-100 text-red-700',
  0:  'bg-red-100 text-red-700',
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5 px-1">
        {icon && <span className="text-gray-400">{icon}</span>}
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      </div>
      {children}
    </div>
  )
}

function getChannels(ev: EvaluationWithRelations): ChannelType[] {
  const channels = new Set<ChannelType>()
  channels.add(ev.channel)
  ;(ev.channel_checks ?? []).forEach(check => channels.add(check.channel))
  return Array.from(channels)
}

function ChannelBadges({ channels, labels }: { channels: ChannelType[]; labels: { whatsapp: string; call: string } }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {channels.map(channel => {
        const isWhatsapp = channel === 'whatsapp'
        const Icon = isWhatsapp ? MessageSquare : Phone
        return (
          <span
            key={channel}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
              isWhatsapp
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {isWhatsapp ? labels.whatsapp : labels.call}
          </span>
        )
      })}
    </div>
  )
}

// Score bar for a single question row
function QuestionRow({ index, label, answer, score, maxScore }: {
  index: number | string
  label: string
  answer: string
  score: number
  maxScore: number
}) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const barColor = pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : pct > 0 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3.5 py-3">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
            {index}
          </span>
          <p className="text-sm text-gray-700 leading-snug flex-1">{label}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg">{answer}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${score > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-500'}`}>
            {score}/{maxScore}
          </span>
        </div>
      </div>
      <div className="ml-7 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Modal body ──────────────────────────────────────────────────────

function ModalBody({ ev }: { ev: EvaluationWithRelations }) {
  const { lang, t } = useLanguage()

  const finalScore = ev.is_auto_failed ? 0 : ev.final_score
  const level = getScoreLevel(finalScore)

  const stageKey = ev.lead_id && ALL_STAGE_KEYS.includes(ev.lead_id) ? ev.lead_id : null
  const stageMeta = stageKey ? STAGE_LABELS[stageKey] : null
  const isStageEval = !!stageKey && (ev.criteria_scores ?? []).length === 0
  const isExtended = stageKey ? EXTENDED_STAGES.includes(stageKey) : false
  const isDeal = stageKey === 'deal'
  const isSecondVisit = stageKey === 'second_visit'

  const sa  = ev.stage_answers        as Record<string, unknown> | null
  const oa  = ev.offer_answers        as Record<string, unknown> | null
  const da  = ev.deal_answers         as Record<string, unknown> | null
  const sva = ev.second_visit_answers as Record<string, unknown> | null

  const hasStageAnswers = sa || oa || da || sva

  const criteriaMap = Object.fromEntries(
    (ev.criteria_scores ?? []).map(cs => [cs.criteria_number, cs])
  )
  const channels = getChannels(ev)

  const hasSalesData = [
    ev.sales_understood_motivation, ev.sales_eased_decision, ev.sales_opportunity_used,
    ev.sales_result_reason, ev.sales_best_behavior, ev.sales_risk_behavior,
  ].some(Boolean)

  const hasDevData = [
    ev.dev_strengths, ev.dev_areas_to_improve, ev.dev_coaching_topic,
    ev.dev_team_leader_comment, ev.dev_consultant_plan, ev.dev_recheck_date,
  ].some(Boolean)

  const tr_ = lang === 'tr'

  return (
    <div className="space-y-4 sm:space-y-5 px-4 pb-8 sm:px-6">

      {/* ── Score hero ─────────────────────────────────────── */}
      <div className={`rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 ${level.bgColor}`}>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider opacity-60 mb-1 ${level.textColor}`}>
            {tr_ ? 'Final Puan' : 'Final Score'}
          </p>
          <p className={`text-5xl font-black tabular-nums leading-none ${level.textColor}`}>{finalScore}</p>
          <p className={`text-sm font-bold mt-1.5 opacity-75 ${level.textColor}`}>
            {tr_ ? level.label : level.labelEn} · /100
          </p>
        </div>
        <div className="text-right">
          {stageMeta && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/50 ${level.textColor} mb-2`}>
              <Layers className="w-3 h-3" />
              {tr_ ? stageMeta.tr : stageMeta.en}
            </span>
          )}
          <div className={`text-xs font-medium opacity-60 ${level.textColor}`}>
            {tr_ ? 'Ham Puan' : 'Raw Score'}: {ev.raw_score}
            {ev.critical_error_count > 0 && (
              <span className="ml-2 text-orange-600 font-bold">
                ⚠ {ev.critical_error_count} {tr_ ? 'kritik hata' : 'critical error(s)'}
              </span>
            )}
            {ev.is_auto_failed && (
              <span className="ml-2 text-red-600 font-bold">🚫 Auto-Fail</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Temel bilgiler ─────────────────────────────────── */}
      <Section title={tr_ ? 'Temel Bilgiler' : 'Basic Info'} icon={<User className="w-3.5 h-3.5" />}>
        <div className="bg-gray-50 rounded-2xl p-3.5 sm:p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <InfoCell label={t.evaluations.consultant} value={ev.consultant?.full_name ?? '—'} />
          <InfoCell label={t.evaluations.customer}   value={ev.customer_name} />

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{t.evaluations.channel}</p>
            <ChannelBadges channels={channels} labels={t.channel} />
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{t.evaluations.conversationDate}</p>
            <p className="font-medium text-gray-700">{ev.conversation_date}</p>
          </div>

          {ev.evaluation_date && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                {tr_ ? 'Kontrol Tarihi' : 'Control Date'}
              </p>
              <p className="font-medium text-gray-700">{ev.evaluation_date}</p>
            </div>
          )}

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

          {ev.team && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                {tr_ ? 'Takım' : 'Team'}
              </p>
              <div className="flex items-center gap-1.5 font-medium text-gray-700">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                {ev.team.name}
              </div>
            </div>
          )}

          {ev.team_leader && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                {tr_ ? 'Takım Lideri' : 'Team Leader'}
              </p>
              <div className="flex items-center gap-1.5 font-medium text-gray-700">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                {ev.team_leader.full_name}
              </div>
            </div>
          )}

          {ev.evaluator && (
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                {tr_ ? 'Değerlendiren' : 'Evaluator'}
              </p>
              <p className="font-medium text-gray-700">{ev.evaluator.full_name}</p>
            </div>
          )}

          {ev.general_note && (
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                {tr_ ? 'Genel Not' : 'General Note'}
              </p>
              <p className="text-gray-700 leading-relaxed">{ev.general_note}</p>
            </div>
          )}
        </div>
      </Section>

      {/* ── Stage soru cevapları ───────────────────────────── */}
      {isStageEval && (
        <>
          {/* Early / Extended stages */}
          {(stageKey && !isDeal && !isSecondVisit) && (
            <Section title={tr_ ? 'Stage Soruları' : 'Stage Questions'} icon={<ClipboardList className="w-3.5 h-3.5" />}>
              {sa ? (
                <div className="space-y-1.5">
                  <QuestionRow index={1}  label={tr_ ? STAGE_QUESTIONS.q1.tr  : STAGE_QUESTIONS.q1.en}  {...fmtResponseTime(sa.q1ResponseTime, lang)}        maxScore={10} />
                  <QuestionRow index={2}  label={tr_ ? STAGE_QUESTIONS.q2.tr  : STAGE_QUESTIONS.q2.en}  {...fmtScore4(sa.q2ProfessionalIntro)}               maxScore={10} />
                  <QuestionRow index={3}  label={tr_ ? STAGE_QUESTIONS.q3.tr  : STAGE_QUESTIONS.q3.en}  {...fmtScore4(sa.q3NeedsAssessment)}                 maxScore={10} />
                  <QuestionRow index={4}  label={tr_ ? STAGE_QUESTIONS.q4.tr  : STAGE_QUESTIONS.q4.en}  {...fmtScore4(sa.q4BuildTrust)}                      maxScore={10} />
                  <QuestionRow index={5}  label={tr_ ? STAGE_QUESTIONS.q5.tr  : STAGE_QUESTIONS.q5.en}  {...fmtScore4(sa.q5InfoPhotoCollection)}             maxScore={10} />
                  <QuestionRow index={6}  label={tr_ ? STAGE_QUESTIONS.q6.tr  : STAGE_QUESTIONS.q6.en}  {...fmtScore4(sa.q6ProfessionalComm)}                maxScore={10} />
                  <QuestionRow index={7}  label={tr_ ? STAGE_QUESTIONS.q7.tr  : STAGE_QUESTIONS.q7.en}  {...fmtYesNo(sa.q7CrmDocumentation, 10, lang)}      maxScore={10} />
                  <QuestionRow index={8}  label={tr_ ? STAGE_QUESTIONS.q8.tr  : STAGE_QUESTIONS.q8.en}  {...fmtYesNo(sa.q8ConfirmNextSteps, 10, lang)}       maxScore={10} />
                  <QuestionRow index={9}  label={tr_ ? STAGE_QUESTIONS.q9.tr  : STAGE_QUESTIONS.q9.en}  {...fmtYesNo(sa.q9NoPriceDiscussion, 10, lang)}      maxScore={10} />
                  <QuestionRow index={10} label={tr_ ? STAGE_QUESTIONS.q10.tr : STAGE_QUESTIONS.q10.en} {...fmtFollowUp(sa.q10FollowUp, [0,5,7,10], lang)}   maxScore={10} />
                </div>
              ) : (
                <NoAnswers lang={lang} />
              )}
            </Section>
          )}

          {/* Extended — teklif soruları */}
          {isExtended && (
            <Section title={tr_ ? 'Teklif Soruları' : 'Offer Questions'} icon={<ClipboardList className="w-3.5 h-3.5" />}>
              {oa ? (
                <div className="space-y-1.5">
                  <QuestionRow index={11} label={tr_ ? OFFER_QUESTIONS.q11.tr : OFFER_QUESTIONS.q11.en} {...fmtYesNo(oa.q11TreatmentPlanSent, 10, lang)}      maxScore={10} />
                  <QuestionRow index={12} label={tr_ ? OFFER_QUESTIONS.q12.tr : OFFER_QUESTIONS.q12.en} {...fmtDelivery(oa.q12DeliveryTiming, lang)}           maxScore={10} />
                  <QuestionRow index={13} label={tr_ ? OFFER_QUESTIONS.q13.tr : OFFER_QUESTIONS.q13.en} {...fmtYesNo(oa.q13ProfessionalPDF, 10, lang)}        maxScore={10} />
                  <QuestionRow index={14} label={tr_ ? OFFER_QUESTIONS.q14.tr : OFFER_QUESTIONS.q14.en} {...fmtYesNo(oa.q14ClearExplanation, 5, lang)}         maxScore={5}  />
                  <QuestionRow index={15} label={tr_ ? OFFER_QUESTIONS.q15.tr : OFFER_QUESTIONS.q15.en} {...fmtYesNo(oa.q15BeforeAfterPhotos, 5, lang)}        maxScore={5}  />
                  <QuestionRow index={16} label={tr_ ? OFFER_QUESTIONS.q16.tr : OFFER_QUESTIONS.q16.en} {...fmtYesNo(oa.q16ConciseCommunication, 5, lang)}     maxScore={5}  />
                  <QuestionRow index={17} label={tr_ ? OFFER_QUESTIONS.q17.tr : OFFER_QUESTIONS.q17.en} {...fmtFollowUp(oa.q17FollowUpWeek, [0,2,3,5], lang)}  maxScore={5}  />
                </div>
              ) : (
                <NoAnswers lang={lang} />
              )}
            </Section>
          )}

          {/* Deal soruları */}
          {isDeal && (
            <Section title={tr_ ? 'Deal Soruları' : 'Deal Questions'} icon={<ClipboardList className="w-3.5 h-3.5" />}>
              {da ? (
                <div className="space-y-1.5">
                  <QuestionRow index={1} label={tr_ ? DEAL_QUESTIONS.q1.tr : DEAL_QUESTIONS.q1.en} {...fmtYesNo(da.q1CrmUpdated, 25, lang)}            maxScore={25} />
                  <QuestionRow index={2} label={tr_ ? DEAL_QUESTIONS.q2.tr : DEAL_QUESTIONS.q2.en} {...fmtYesNo(da.q2PriceConfirmed, 25, lang)}         maxScore={25} />
                  <QuestionRow index={3} label={tr_ ? DEAL_QUESTIONS.q3.tr : DEAL_QUESTIONS.q3.en} {...fmtYesNo(da.q3TravelConfirmed, 25, lang)}         maxScore={25} />
                  <QuestionRow index={4} label={tr_ ? DEAL_QUESTIONS.q4.tr : DEAL_QUESTIONS.q4.en} {...fmtFollowUp(da.q4FollowUp, [0,8,15,25], lang)}    maxScore={25} />
                </div>
              ) : (
                <NoAnswers lang={lang} />
              )}
            </Section>
          )}

          {/* Second Visit sorusu */}
          {isSecondVisit && (
            <Section title={tr_ ? 'İkinci Ziyaret Sorusu' : 'Second Visit Question'} icon={<ClipboardList className="w-3.5 h-3.5" />}>
              {sva ? (
                <div className="space-y-1.5">
                  <QuestionRow
                    index={1}
                    label={tr_ ? SV_QUESTION.tr : SV_QUESTION.en}
                    {...fmtFollowUp(sva.q1ProfessionalFollowUp, [0,25,60,100], lang)}
                    maxScore={100}
                  />
                </div>
              ) : (
                <NoAnswers lang={lang} />
              )}
            </Section>
          )}
        </>
      )}

      {/* ── Kriter puanları (eski sistem) ──────────────────── */}
      {!isStageEval && (
        <Section title={tr_ ? 'Kriter Puanları' : 'Criteria Scores'} icon={<TrendingUp className="w-3.5 h-3.5" />}>
          <div className="space-y-1.5">
            {CRITERIA.map(c => {
              const row = criteriaMap[c.number]
              const label = lang === 'tr' ? c.labelTr : c.labelEn
              const color = row ? (SCORE_COLORS[row.score_value] ?? 'bg-gray-100 text-gray-600') : ''
              return (
                <div key={c.number} className="flex items-start gap-2.5 bg-white border border-gray-100 rounded-xl px-3.5 py-3">
                  <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    row ? color : 'bg-gray-100 text-gray-400'
                  }`}>
                    {row ? (row.score_value === 10 ? <Check className="w-3.5 h-3.5" /> : row.score_value) : c.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-snug">{label}</p>
                    {row?.comment && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed italic">{row.comment}</p>
                    )}
                  </div>
                  {row && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${color}`}>
                      {row.score_value}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* ── Kanal kontrolleri ──────────────────────────────── */}
      {(ev.channel_checks ?? []).length > 0 && (
        <div className="space-y-3">
          {channels.map(channel => {
            const isWhatsapp = channel === 'whatsapp'
            const questions = isWhatsapp ? WHATSAPP_QUESTIONS : CALL_QUESTIONS
            const checksMap = Object.fromEntries(
              (ev.channel_checks ?? [])
                .filter(cc => cc.channel === channel)
                .map(cc => [cc.question_number, cc])
            )

            return (
              <Section
                key={channel}
                title={isWhatsapp ? 'WhatsApp Kontrolleri' : `${t.channel.call} Kontrolleri`}
                icon={isWhatsapp ? <MessageSquare className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
              >
                <div className="space-y-1.5">
                  {questions.map(q => {
                    const row = checksMap[q.number]
                    const label = lang === 'tr' ? q.labelTr : q.labelEn
                    const answerOpt = row ? CHECK_ANSWER_OPTIONS.find(o => o.value === row.answer) : null
                    const answerLabel = answerOpt ? (lang === 'tr' ? answerOpt.labelTr : answerOpt.labelEn) : '—'
                    const answerColor = row ? (CHECK_COLORS[row.answer] ?? 'bg-gray-100 text-gray-500') : ''
                    return (
                      <div key={q.number} className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-3.5 py-2.5">
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
            )
          })}
        </div>
      )}

      {/* ── Kritik hatalar ─────────────────────────────────── */}
      {(ev.critical_errors ?? []).length > 0 && (
        <Section title={tr_ ? 'Kritik Hatalar' : 'Critical Errors'} icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400" />}>
          <div className="space-y-1.5">
            {ev.critical_errors.map(ce => {
              const labels = CRITICAL_ERROR_LABELS[ce.error_type]
              return (
                <div key={ce.error_type} className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-2.5">
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
              )
            })}
          </div>
        </Section>
      )}

      {/* ── Satış analizi ──────────────────────────────────── */}
      {hasSalesData && (
        <Section title={tr_ ? 'Satış Analizi' : 'Sales Analysis'}>
          <div className="space-y-1.5">
            {[
              { label: tr_ ? 'Motivasyon anlaşıldı mı?'   : 'Motivation understood?', val: ev.sales_understood_motivation },
              { label: tr_ ? 'Karar kolaylaştırıldı mı?'  : 'Decision eased?',         val: ev.sales_eased_decision        },
              { label: tr_ ? 'Fırsat kullanıldı mı?'      : 'Opportunity used?',        val: ev.sales_opportunity_used     },
              { label: tr_ ? 'Sonuç nedeni'               : 'Result reason',            val: ev.sales_result_reason        },
              { label: tr_ ? 'En iyi davranış'            : 'Best behavior',            val: ev.sales_best_behavior        },
              { label: tr_ ? 'Risk davranışı'             : 'Risk behavior',            val: ev.sales_risk_behavior        },
            ].filter(f => f.val).map(f => (
              <div key={f.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{f.label}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{f.val}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Gelişim planı ──────────────────────────────────── */}
      {hasDevData && (
        <Section title={tr_ ? 'Gelişim Planı' : 'Development Plan'} icon={<Calendar className="w-3.5 h-3.5" />}>
          <div className="space-y-1.5">
            {[
              { label: tr_ ? 'Güçlü Yönler'       : 'Strengths',            val: ev.dev_strengths           },
              { label: tr_ ? 'Gelişim Alanları'    : 'Areas to Improve',     val: ev.dev_areas_to_improve    },
              { label: tr_ ? 'Koçluk Konusu'       : 'Coaching Topic',       val: ev.dev_coaching_topic      },
              { label: tr_ ? 'Ekip Lideri Yorumu'  : 'Team Leader Comment',  val: ev.dev_team_leader_comment },
              { label: tr_ ? 'Danışman Planı'      : 'Consultant Plan',      val: ev.dev_consultant_plan     },
              { label: tr_ ? 'Tekrar Kontrol Tarihi': 'Recheck Date',        val: ev.dev_recheck_date        },
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

// ─── Small helpers ───────────────────────────────────────────────────

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  )
}

function NoAnswers({ lang }: { lang: string }) {
  return (
    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-400 text-center">
      {lang === 'tr' ? 'Bu değerlendirme için cevaplar kaydedilmemiş.' : 'Answers not recorded for this evaluation.'}
    </div>
  )
}

// ─── Main modal ──────────────────────────────────────────────────────

interface Props {
  evalId: string | null
  evaluation: EvaluationWithRelations | null
  loading: boolean
  canEdit: boolean
  onClose: () => void
}

export function EvaluationViewModal({ evalId, evaluation, loading, canEdit, onClose }: Props) {
  const { lang } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!evalId) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [evalId, onClose])

  useEffect(() => {
    document.documentElement.style.overflow = evalId ? 'hidden' : ''
    return () => { document.documentElement.style.overflow = '' }
  }, [evalId])

  if (!mounted || !evalId) return null

  return createPortal(
    <AnimatePresence>
      {evalId && (
        /* Single overlay element: backdrop + centering in one fixed box */
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          {/* Modal card — stopPropagation prevents overlay click from closing */}
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.85 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '672px',
              maxHeight: 'calc(100vh - 32px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-gray-100">
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
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
