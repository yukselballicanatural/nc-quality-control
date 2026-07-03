'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, HelpCircle } from 'lucide-react'
import { useFormStore } from '@/stores/formStore'
import { useLanguage } from '@/lib/i18n'
import { CRITERIA, SCORE_OPTIONS } from '@/lib/constants'
import { isCommentRequired } from '@/lib/scoring'

const SCORE_CONFIG: Record<number, {
  bg: string; text: string; border: string; ring: string; dot: string; shadow: string; label: string; labelEn: string
}> = {
  10: {
    bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-500',
    ring: 'ring-emerald-200', dot: 'bg-emerald-500', shadow: 'shadow-emerald-200/60',
    label: 'Mükemmel', labelEn: 'Perfect',
  },
  7: {
    bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-500',
    ring: 'ring-blue-200', dot: 'bg-blue-500', shadow: 'shadow-blue-200/60',
    label: 'İyi', labelEn: 'Good',
  },
  5: {
    bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-500',
    ring: 'ring-amber-200', dot: 'bg-amber-500', shadow: 'shadow-amber-200/60',
    label: 'Orta', labelEn: 'Fair',
  },
  0: {
    bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-500',
    ring: 'ring-rose-200', dot: 'bg-rose-500', shadow: 'shadow-rose-200/60',
    label: 'Yanlış', labelEn: 'Wrong',
  },
}

export function StepCriteria() {
  const { lang, t } = useLanguage()
  const { criteriaScores, setCriteriaScore, setCriteriaComment, isCriteriaComplete } = useFormStore()
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const scoredCount = Object.keys(criteriaScores).length
  const pct = Math.round((scoredCount / 10) * 100)

  return (
    <div className="space-y-3">

      {/* ── Progress card ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-gray-900">
              {lang === 'tr' ? 'Kriter Değerlendirmesi' : 'Criteria Evaluation'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {lang === 'tr' ? 'Her kriter için bir puan seçin' : 'Select a score for each criterion'}
            </p>
          </div>
          <div className={`text-right transition-colors ${scoredCount === 10 ? 'text-emerald-600' : 'text-gray-400'}`}>
            <p className="text-2xl font-black tabular-nums leading-none">{scoredCount}</p>
            <p className="text-xs font-medium">/ 10</p>
          </div>
        </div>

        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#52B788] via-emerald-400 to-emerald-300"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          />
        </div>

        <AnimatePresence>
          {isCriteriaComplete() && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="flex items-center gap-2 text-xs font-semibold text-emerald-600 overflow-hidden"
            >
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              {lang === 'tr' ? 'Tüm kriterler tamamlandı!' : 'All criteria completed!'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Criteria list ────────────────────────────────────── */}
      {CRITERIA.map((criterion, idx) => {
        const entry = criteriaScores[criterion.number]
        const scored = !!entry
        const needsComment = scored && isCommentRequired(entry.scoreValue)
        const hasComment = scored && entry.comment.trim().length > 0
        const isExpanded = !!expanded[criterion.number]
        const criterionLabel = lang === 'tr' ? criterion.labelTr : criterion.labelEn
        const questions = lang === 'tr' ? criterion.questionsTr : criterion.questionsEn
        const cfg = scored ? SCORE_CONFIG[entry.scoreValue] : null

        return (
          <motion.div
            key={criterion.number}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
              needsComment && !hasComment
                ? 'border-amber-200 shadow-amber-100/50'
                : scored
                ? 'border-gray-200'
                : 'border-gray-100'
            }`}
          >
            {/* Left color accent bar */}
            {scored && cfg && (
              <div className={`h-0.5 w-full ${cfg.bg} opacity-70`} />
            )}

            <div className="p-4 sm:p-5">
              {/* Question header */}
              <div className="flex items-start gap-3.5 mb-4">
                {/* Number / score badge */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 transition-all duration-300 ${
                    scored && cfg
                      ? `${cfg.bg} ${cfg.text} shadow-lg ${cfg.shadow}`
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {scored && entry.scoreValue === 10
                    ? <Check className="w-4 h-4" />
                    : scored
                    ? entry.scoreValue
                    : criterion.number}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{criterionLabel}</p>
                  {scored && cfg && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`text-xs font-semibold mt-0.5 ${
                        entry.scoreValue === 10 ? 'text-emerald-600'
                        : entry.scoreValue === 7 ? 'text-blue-600'
                        : entry.scoreValue === 5 ? 'text-amber-600'
                        : 'text-rose-600'
                      }`}
                    >
                      {lang === 'tr' ? cfg.label : cfg.labelEn} · {entry.scoreValue} puan
                    </motion.p>
                  )}
                </div>

                {/* Expand button */}
                <button
                  type="button"
                  onClick={() => setExpanded(p => ({ ...p, [criterion.number]: !p[criterion.number] }))}
                  className="flex-shrink-0 p-1 text-gray-300 hover:text-gray-500 transition-colors"
                  title={lang === 'tr' ? 'Alt sorular' : 'Sub-questions'}
                >
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>
              </div>

              {/* Sub-questions accordion */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="bg-gray-50/80 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {lang === 'tr' ? 'Değerlendirme soruları' : 'Evaluation questions'}
                        </p>
                      </div>
                      {questions.map((q, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="text-[#52B788] mt-0.5 flex-shrink-0 font-bold text-sm leading-none">›</span>
                          <span className="leading-relaxed">{q}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Score buttons — forms.app style ───────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SCORE_OPTIONS.map(opt => {
                  const isSelected = entry?.scoreValue === opt.value
                  const c = SCORE_CONFIG[opt.value]
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCriteriaScore(criterion.number, opt.value)}
                      className={`relative flex flex-col items-center justify-center gap-1.5 py-4 sm:py-5 rounded-2xl border-2 font-bold transition-all duration-200 overflow-hidden ${
                        isSelected
                          ? `${c.bg} ${c.text} ${c.border} shadow-lg ${c.shadow} scale-[1.02]`
                          : `bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600`
                      }`}
                    >
                      <span className={`text-2xl sm:text-3xl font-black leading-none tabular-nums ${isSelected ? '' : 'text-gray-600'}`}>
                        {opt.value === 10 ? <Check className="w-6 h-6" /> : opt.value}
                      </span>
                      <span className={`text-[10px] sm:text-xs font-semibold leading-tight text-center ${
                        isSelected ? 'opacity-90' : 'text-gray-400'
                      }`}>
                        {lang === 'tr' ? opt.labelTr : opt.labelEn}
                      </span>
                      {isSelected && (
                        <motion.div
                          layoutId={`score-selected-${criterion.number}`}
                          className="absolute inset-0 rounded-2xl ring-4 ring-current opacity-20 pointer-events-none"
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Comment textarea */}
              <AnimatePresence>
                {needsComment && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className={`rounded-xl border p-3 ${
                      !hasComment ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200 bg-gray-50/50'
                    }`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${
                        !hasComment ? 'text-amber-600' : 'text-gray-400'
                      }`}>
                        {t.form.step2.commentRequired} *
                      </p>
                      <textarea
                        value={entry.comment}
                        onChange={e => setCriteriaComment(criterion.number, e.target.value)}
                        placeholder={t.form.step2.commentPlaceholder}
                        rows={2}
                        className={`w-full px-3 py-2 rounded-lg border text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15 focus:border-[#1B4332] transition-all resize-none ${
                          !hasComment ? 'border-amber-200 placeholder-amber-300' : 'border-gray-200'
                        }`}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
