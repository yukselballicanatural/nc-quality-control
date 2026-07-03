'use client'

import { motion } from 'framer-motion'
import { ThumbsUp, TrendingUp, BookOpen, MessageCircle, ClipboardCheck, CalendarClock } from 'lucide-react'
import { useFormStore } from '@/stores/formStore'
import { useLanguage } from '@/lib/i18n'
import { getScoreLevel } from '@/lib/scoring'
import { DatePicker } from '@/components/ui/DatePicker'
import type { FormStep6 } from '@/stores/formStore'

const textareaCls =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15 focus:border-[#1B4332] focus:bg-white transition-all resize-none hover:border-gray-300'
const inputCls =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15 focus:border-[#1B4332] focus:bg-white transition-all hover:border-gray-300'

const FIELD_ICONS = [ThumbsUp, TrendingUp, BookOpen, MessageCircle, ClipboardCheck]
const FIELD_COLORS = [
  'bg-emerald-100 text-emerald-600',
  'bg-blue-100 text-blue-600',
  'bg-violet-100 text-violet-600',
  'bg-amber-100 text-amber-600',
  'bg-teal-100 text-teal-600',
]

export function StepActionPlan() {
  const {
    step6, updateStep6,
    getStageScore,
  } = useFormStore()
  const { lang: uiLang, t: uiT } = useLanguage()

  const score = getStageScore()
  const level = getScoreLevel(score)

  const textareaFields: Array<{ key: keyof Omit<FormStep6, 'recheckDate'>; label: string }> = [
    { key: 'strengths',         label: uiT.form.step6.strengths },
    { key: 'areasToImprove',    label: uiT.form.step6.areasToImprove },
    { key: 'coachingTopic',     label: uiT.form.step6.coachingTopic },
    { key: 'teamLeaderComment', label: uiT.form.step6.teamLeaderComment },
    { key: 'consultantPlan',    label: uiT.form.step6.consultantPlan },
  ]

  return (
    <div className="space-y-3">

      {/* ── Score summary ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Gradient top bar */}
        <div className={`h-1.5 w-full ${level.bgColor}`} />

        <div className="p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            {uiT.form.step6.scoreSummary}
          </p>

          <div className="grid grid-cols-2 gap-2.5">

            {/* Stage score */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className={`rounded-2xl p-5 text-center flex flex-col items-center gap-1 ${level.bgColor}`}
            >
              <p className={`text-[10px] font-bold uppercase tracking-wide opacity-70 ${level.textColor}`}>
                {uiLang === 'tr' ? 'Stage Skoru' : 'Stage Score'}
              </p>
              <p className={`text-4xl font-black tabular-nums leading-none ${level.textColor}`}>{score}</p>
              <p className="text-[10px] text-gray-400 font-medium">/ 100</p>
            </motion.div>

            {/* Level */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-gray-50 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-1"
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                {uiLang === 'tr' ? 'Performans' : 'Performance'}
              </p>
              <p className={`text-xl font-black leading-tight ${level.textColor}`}>
                {uiLang === 'tr' ? level.label : level.labelEn}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Tekrar Kontrol Tarihi ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        className="relative bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-sm"
      >
        {/* Pulse ring */}
        <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />

        <div className="p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0">
              <CalendarClock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-900">
                {uiLang === 'tr' ? 'Tekrar Kontrol Tarihi' : 'Recheck Date'}
              </p>
              <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
                {uiLang === 'tr'
                  ? `Skor ${score} — bir sonraki takip tarihini belirleyin`
                  : `Score ${score} — set the next follow-up date`}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <DatePicker
              value={step6.recheckDate}
              onChange={v => updateStep6({ recheckDate: v })}
              placeholder={uiLang === 'tr' ? 'Tarih seçin...' : 'Select date...'}
            />
          </div>

          {!step6.recheckDate && (
            <p className="text-[11px] text-amber-600 font-bold mt-2 flex items-center gap-1.5">
              <span>⚠</span>
              {uiLang === 'tr' ? 'Lütfen bir tarih seçin — gözden kaçırmayın!' : 'Please set a date — don\'t skip this!'}
            </p>
          )}
        </div>
      </motion.div>

      {/* ── Development fields ────────────────────────────── */}
      <div className="space-y-2.5">
        {textareaFields.map((field, idx) => {
          const Icon = FIELD_ICONS[idx]
          const colorCls = FIELD_COLORS[idx]
          const hasValue = !!step6[field.key]?.trim()

          return (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + idx * 0.04, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${
                hasValue ? 'border-gray-200' : 'border-gray-100'
              }`}
            >
              {hasValue && <div className="h-0.5 bg-gradient-to-r from-[#52B788] to-[#1B4332]" />}
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <label className="text-sm font-semibold text-gray-900">{field.label}</label>
                </div>
                <textarea
                  value={step6[field.key]}
                  onChange={e => updateStep6({ [field.key]: e.target.value } as Partial<FormStep6>)}
                  placeholder={uiT.form.step6.textareaPlaceholder}
                  rows={3}
                  className={textareaCls}
                />
              </div>
            </motion.div>
          )
        })}

      </div>
    </div>
  )
}
