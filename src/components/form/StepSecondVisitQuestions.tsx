'use client'

import { motion } from 'framer-motion'
import { useFormStore } from '@/stores/formStore'
import { useLanguage } from '@/lib/i18n'

function AnswerBtn({
  label, sublabel, selected, onClick, variant = 'default',
}: {
  label: string; sublabel?: string; selected: boolean; onClick: () => void
  variant?: 'default' | 'success' | 'good' | 'neutral' | 'danger'
}) {
  const sel: Record<string, string> = {
    default: 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-300/30',
    success: 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-300/40',
    good:    'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-300/30',
    neutral: 'border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-300/30',
    danger:  'border-red-400 bg-red-400 text-white shadow-lg shadow-red-300/30',
  }
  const idle = 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:scale-[1.02]'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`relative flex flex-col items-center justify-center gap-1 px-3 py-5 rounded-2xl border-2 font-bold transition-all duration-200 cursor-pointer overflow-hidden ${
        selected ? sel[variant] : idle
      }`}
    >
      {selected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/30 flex items-center justify-center"
        >
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>
      )}
      <span className="text-2xl font-black leading-none">{label}</span>
      {sublabel && (
        <span className={`text-xs font-bold leading-none ${selected ? 'opacity-80' : 'text-gray-400'}`}>
          {sublabel}
        </span>
      )}
    </motion.button>
  )
}

export function StepSecondVisitQuestions() {
  const { lang, t } = useLanguage()
  const { secondVisitAnswers, updateSecondVisitAnswers, getSecondVisitScore } = useFormStore()

  const score    = getSecondVisitScore()
  const sv       = t.form.secondVisitQuestions
  const pts      = sv.pts
  const answered = secondVisitAnswers.q1ProfessionalFollowUp !== -1

  const opts = [
    { v: 3 as const, p: 100, variant: 'success' as const },
    { v: 2 as const, p: 60,  variant: 'good'    as const },
    { v: 1 as const, p: 25,  variant: 'neutral' as const },
    { v: 0 as const, p: 0,   variant: 'danger'  as const },
  ]

  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-blue-600' : score >= 25 ? 'text-amber-600' : 'text-red-500'
  const scoreBg    = score >= 80 ? 'bg-emerald-50 border-emerald-200' : score >= 50 ? 'bg-blue-50 border-blue-200' : score >= 25 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <div className="space-y-4">

      {/* ── Üst özet ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className={`h-1.5 bg-gray-100`}>
          <motion.div
            className={`h-full ${answered ? 'bg-emerald-500' : 'bg-gray-200'}`}
            initial={{ width: 0 }}
            animate={{ width: answered ? '100%' : '0%' }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-0.5">{sv.header}</p>
            <p className="text-sm font-bold text-gray-700">
              {answered
                ? (lang === 'tr' ? '1/1 soru yanıtlandı' : '1/1 question answered')
                : (lang === 'tr' ? '0/1 soru yanıtlandı' : '0/1 question answered')}
            </p>
          </div>
          <motion.div
            key={score}
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className={`text-center px-4 py-2.5 rounded-2xl border-2 min-w-[80px] ${scoreBg}`}
          >
            <p className={`text-2xl font-black tabular-nums leading-none ${scoreColor}`}>{score}</p>
            <p className={`text-[10px] font-bold mt-0.5 ${scoreColor} opacity-70`}>/ 100</p>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Soru kartı ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
          answered ? 'border-emerald-200' : 'border-gray-100'
        }`}
      >
        {answered && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'left' }}
            className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600"
          />
        )}

        <div className="p-5 sm:p-6">
          {/* Başlık */}
          <div className="flex items-start gap-3 mb-6">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
              answered ? 'bg-emerald-500 shadow-md shadow-emerald-300/25' : 'bg-orange-100'
            }`}>
              {answered ? (
                <motion.svg
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="w-4 h-4 text-white"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </motion.svg>
              ) : (
                <span className="text-sm font-black text-orange-600">1</span>
              )}
            </div>
            <div>
              <p className="text-base font-bold text-gray-800 leading-snug">{sv.q1}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">
                {lang === 'tr'
                  ? 'İkinci ziyaret sürecinde kaç kez profesyonel takip yapıldı?'
                  : 'How many professional follow-ups were made during the second visit process?'}
              </p>
            </div>
          </div>

          {/* Cevap butonları */}
          <div className="grid grid-cols-4 gap-3">
            {opts.map(opt => (
              <AnswerBtn
                key={opt.v}
                label={String(opt.v)}
                sublabel={`${opt.p} ${pts}`}
                selected={secondVisitAnswers.q1ProfessionalFollowUp === opt.v}
                onClick={() => updateSecondVisitAnswers({ q1ProfessionalFollowUp: opt.v })}
                variant={opt.variant}
              />
            ))}
          </div>

          {/* Puanlama bilgi şeridi */}
          <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
            <div className="flex-1 grid grid-cols-4 gap-2 text-center">
              {opts.map(opt => (
                <div key={opt.v} className={`text-[11px] font-bold transition-colors ${
                  secondVisitAnswers.q1ProfessionalFollowUp === opt.v ? 'text-orange-600' : 'text-gray-400'
                }`}>
                  <span className="text-base font-black">{opt.v}</span>
                  <span className="block mt-0.5">{opt.p} {pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Tamamlandı mesajı ─────────────────────────────── */}
      {answered && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="flex items-center gap-3 px-5 py-4 bg-orange-50 border border-orange-200 rounded-2xl"
        >
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-300/40">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-orange-800">{sv.allAnswered}</p>
            <p className="text-xs text-orange-600 mt-0.5">{sv.totalScore}: {score} / 100</p>
          </div>
        </motion.div>
      )}

    </div>
  )
}
