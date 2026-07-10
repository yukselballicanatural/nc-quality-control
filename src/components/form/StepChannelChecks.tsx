'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, MessageSquare, Phone, Check } from 'lucide-react'
import { useFormStore } from '@/stores/formStore'
import { useLanguage } from '@/lib/i18n'
import { WHATSAPP_QUESTIONS, CALL_QUESTIONS, CHECK_ANSWER_OPTIONS } from '@/lib/constants'
import type { CheckAnswer, ChannelType } from '@/types/supabase'

const ANSWER_CONFIG: Record<CheckAnswer, {
  icon: string; activeBg: string; activeText: string; activeBorder: string; activeShadow: string; idleHover: string
}> = {
  successful: {
    icon: '✓',
    activeBg: 'bg-emerald-500', activeText: 'text-white', activeBorder: 'border-emerald-500',
    activeShadow: 'shadow-emerald-200/60', idleHover: 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700',
  },
  partially: {
    icon: '≈',
    activeBg: 'bg-amber-500', activeText: 'text-white', activeBorder: 'border-amber-500',
    activeShadow: 'shadow-amber-200/60', idleHover: 'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700',
  },
  unsuccessful: {
    icon: '✗',
    activeBg: 'bg-rose-500', activeText: 'text-white', activeBorder: 'border-rose-500',
    activeShadow: 'shadow-rose-200/60', idleHover: 'hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700',
  },
  not_applicable: {
    icon: '—',
    activeBg: 'bg-gray-500', activeText: 'text-white', activeBorder: 'border-gray-500',
    activeShadow: 'shadow-gray-200/60', idleHover: 'hover:border-gray-400 hover:bg-gray-100 hover:text-gray-700',
  },
}

function ChannelSection({ channel }: { channel: ChannelType }) {
  const { lang } = useLanguage()
  const { channelChecks, setChannelAnswer } = useFormStore()
  const questions = channel === 'whatsapp' ? WHATSAPP_QUESTIONS : CALL_QUESTIONS
  const answers = channelChecks
  const answeredCount = Object.keys(answers).length
  const pct = Math.round((answeredCount / questions.length) * 100)
  const isWA = channel === 'whatsapp'
  const isComplete = answeredCount === questions.length

  return (
    <div className="space-y-3">
      {/* ── Header card ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isWA ? 'bg-emerald-100' : 'bg-blue-100'
            }`}>
              {isWA
                ? <MessageSquare className="w-5 h-5 text-emerald-600" />
                : <Phone className="w-5 h-5 text-blue-600" />
              }
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {isWA ? 'WhatsApp Kontrolleri' : (lang === 'tr' ? 'Arama Kontrolleri' : 'Call Checks')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {lang === 'tr' ? 'Her soru için yanıt seçin' : 'Select an answer for each question'}
              </p>
            </div>
          </div>
          <div className={`text-right transition-colors ${isComplete ? (isWA ? 'text-emerald-600' : 'text-blue-600') : 'text-gray-400'}`}>
            <p className="text-2xl font-black tabular-nums leading-none">{answeredCount}</p>
            <p className="text-xs font-medium">/ {questions.length}</p>
          </div>
        </div>

        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isWA ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          />
        </div>

        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="flex items-center gap-2 text-xs font-semibold text-emerald-600 overflow-hidden"
            >
              <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5" />
              </div>
              {lang === 'tr' ? 'Tüm sorular yanıtlandı!' : 'All questions answered!'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Questions ────────────────────────────────────────── */}
      {questions.map((q, idx) => {
        const check = answers[q.number]
        const questionLabel = lang === 'tr' ? q.labelTr : q.labelEn
        const answered = !!check

        return (
          <motion.div
            key={q.number}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
              answered ? 'border-gray-200' : 'border-gray-100'
            }`}
          >
            {/* Top color bar when answered */}
            {answered && check && (
              <div className={`h-0.5 w-full ${ANSWER_CONFIG[check.answer as CheckAnswer].activeBg} opacity-60`} />
            )}

            <div className="p-4 sm:p-5">
              {/* Question label */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
                  answered ? 'bg-[#1B4332] text-white shadow-md shadow-[#1B4332]/20' : 'bg-gray-100 text-gray-400'
                }`}>
                  {answered ? <Check className="w-3.5 h-3.5" /> : q.number}
                </div>
                <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">{questionLabel}</p>
              </div>

              {/* ── Answer options — 2×2 on mobile, 4×1 on desktop ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CHECK_ANSWER_OPTIONS.map(opt => {
                  const isSelected = check?.answer === opt.value
                  const cfg = ANSWER_CONFIG[opt.value as CheckAnswer]
                  const label = lang === 'tr' ? opt.labelTr : opt.labelEn

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setChannelAnswer(q.number, opt.value as CheckAnswer)}
                      className={`flex flex-col items-center justify-center gap-2 py-4 sm:py-5 rounded-2xl border-2 font-bold transition-all duration-200 ${
                        isSelected
                          ? `${cfg.activeBg} ${cfg.activeText} ${cfg.activeBorder} shadow-lg ${cfg.activeShadow} scale-[1.02]`
                          : `bg-white border-gray-200 text-gray-400 ${cfg.idleHover}`
                      }`}
                    >
                      <span className={`text-xl sm:text-2xl font-black leading-none ${isSelected ? '' : 'text-gray-500'}`}>
                        {cfg.icon}
                      </span>
                      <span className={`text-[10px] sm:text-xs font-semibold leading-tight text-center ${
                        isSelected ? 'opacity-90' : 'text-gray-400'
                      }`}>
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export function StepChannelChecks() {
  const { lang } = useLanguage()
  const { step1 } = useFormStore()

  if (step1.channels.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">
          {lang === 'tr' ? "Adım 1'de görüşme kanalı seçilmedi." : 'No channel selected in Step 1.'}
        </p>
      </div>
    )
  }

  const primaryChannel = step1.channels[0]

  return (
    <div className="space-y-3">
      {step1.channels.length > 1 && (
        <p className="text-xs text-gray-400 px-1">
          {lang === 'tr'
            ? 'Birden fazla kanal seçildi; aynı kontrol soruları her ikisi için de geçerli sayılır.'
            : 'Multiple channels selected; the same check answers apply to both.'}
        </p>
      )}
      <ChannelSection channel={primaryChannel} />
    </div>
  )
}
