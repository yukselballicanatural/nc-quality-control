'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useFormStore } from '@/stores/formStore'
import { useLanguage } from '@/lib/i18n'

// ─── Renk yardımcıları ────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 40) return 'text-emerald-600'
  if (score >= 25) return 'text-blue-600'
  if (score >= 15) return 'text-amber-600'
  return 'text-red-500'
}
function scoreBg(score: number): string {
  if (score >= 40) return 'bg-emerald-50 border-emerald-200'
  if (score >= 25) return 'bg-blue-50 border-blue-200'
  if (score >= 15) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}
function scoreBar(score: number): string {
  if (score >= 40) return 'bg-emerald-500'
  if (score >= 25) return 'bg-blue-500'
  if (score >= 15) return 'bg-amber-500'
  return 'bg-red-400'
}

// ─── Cevap butonu ─────────────────────────────────────────────────

interface AnswerBtnProps {
  label: string
  sublabel?: string
  selected: boolean
  onClick: () => void
  variant?: 'default' | 'success' | 'danger' | 'neutral'
}

function AnswerBtn({ label, sublabel, selected, onClick, variant = 'default' }: AnswerBtnProps) {
  const selectedStyles: Record<string, string> = {
    default: 'border-[#1B4332] bg-[#1B4332] text-white shadow-lg shadow-[#1B4332]/25',
    success: 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-300/40',
    danger:  'border-red-400 bg-red-400 text-white shadow-lg shadow-red-300/30',
    neutral: 'border-gray-500 bg-gray-500 text-white shadow-lg shadow-gray-300/30',
  }
  const idleStyles = 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:scale-[1.02]'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`relative flex flex-col items-center justify-center gap-0.5 px-2 py-3 rounded-2xl border-2 text-sm font-bold transition-all duration-200 cursor-pointer overflow-hidden ${
        selected ? selectedStyles[variant] : idleStyles
      }`}
    >
      {selected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center"
        >
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>
      )}
      <span className="leading-tight">{label}</span>
      {sublabel && (
        <span className={`text-[10px] font-semibold leading-none ${selected ? 'opacity-70' : 'text-gray-400'}`}>
          {sublabel}
        </span>
      )}
    </motion.button>
  )
}

// ─── Soru kartı ───────────────────────────────────────────────────

interface QuestionCardProps {
  index: number
  title: string
  answered: boolean
  children: React.ReactNode
  delay?: number
}

function QuestionCard({ index, title, answered, children, delay = 0 }: QuestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
        answered ? 'border-violet-200' : 'border-gray-100'
      }`}
    >
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'left' }}
            className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-400 to-violet-700"
          />
        )}
      </AnimatePresence>

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            answered ? 'bg-violet-600 shadow-md shadow-violet-300/25' : 'bg-gray-100'
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
              <span className="text-xs font-black text-gray-400">{index}</span>
            )}
          </div>
          <p className="text-sm font-bold text-gray-800 leading-snug pt-1">{title}</p>
        </div>
        {children}
      </div>
    </motion.div>
  )
}

// ─── Ana bileşen ──────────────────────────────────────────────────

export function StepOfferQuestions() {
  const { lang, t } = useLanguage()
  const { offerAnswers, updateOfferAnswers, getOfferScore } = useFormStore()

  const score = getOfferScore()
  const oq = t.form.offerQuestions
  const pts = oq.pts

  const yes = t.common.yes
  const no  = t.common.no

  const answeredCount = [
    offerAnswers.q11TreatmentPlanSent    !== '',
    offerAnswers.q12DeliveryTiming       !== '',
    offerAnswers.q13ProfessionalPDF      !== '',
    offerAnswers.q14ClearExplanation     !== '',
    offerAnswers.q15BeforeAfterPhotos    !== '',
    offerAnswers.q16ConciseCommunication !== '',
    offerAnswers.q17FollowUpWeek         !== -1,
  ].filter(Boolean).length

  return (
    <div className="space-y-3">

      {/* ── Üst özet kartı ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="h-1.5 bg-gray-100">
          <motion.div
            className={`h-full ${scoreBar(score)}`}
            initial={{ width: 0 }}
            animate={{ width: `${(answeredCount / 7) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-0.5">
              {oq.header}
            </p>
            <span className="text-sm font-bold text-gray-700">
              {answeredCount}
              <span className="text-gray-400 font-medium">/7 </span>
              {oq.answered}
            </span>
          </div>
          <motion.div
            key={score}
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className={`text-center px-4 py-2.5 rounded-2xl border-2 min-w-[80px] transition-all duration-300 ${scoreBg(score)}`}
          >
            <p className={`text-2xl font-black tabular-nums leading-none ${scoreColor(score)}`}>{score}</p>
            <p className={`text-[10px] font-bold mt-0.5 ${scoreColor(score)} opacity-70`}>/ 50</p>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Q11 — Treatment Plan Sent ────────────────────── */}
      <QuestionCard index={11} title={oq.q11} answered={offerAnswers.q11TreatmentPlanSent !== ''} delay={0.05}>
        <div className="grid grid-cols-2 gap-2">
          <AnswerBtn label={yes} sublabel={`10 ${pts}`}
            selected={offerAnswers.q11TreatmentPlanSent === 'yes'}
            onClick={() => updateOfferAnswers({ q11TreatmentPlanSent: 'yes' })} variant="success" />
          <AnswerBtn label={no}  sublabel={`0 ${pts}`}
            selected={offerAnswers.q11TreatmentPlanSent === 'no'}
            onClick={() => updateOfferAnswers({ q11TreatmentPlanSent: 'no' })}  variant="danger" />
        </div>
      </QuestionCard>

      {/* ── Q12 — Delivery Timing ────────────────────────── */}
      <QuestionCard index={12} title={oq.q12} answered={offerAnswers.q12DeliveryTiming !== ''} delay={0.08}>
        <div className="grid grid-cols-2 gap-2">
          <AnswerBtn label="< 24h" sublabel={`10 ${pts}`}
            selected={offerAnswers.q12DeliveryTiming === '<24h'}
            onClick={() => updateOfferAnswers({ q12DeliveryTiming: '<24h' })} variant="success" />
          <AnswerBtn label="> 24h" sublabel={`0 ${pts}`}
            selected={offerAnswers.q12DeliveryTiming === '>24h'}
            onClick={() => updateOfferAnswers({ q12DeliveryTiming: '>24h' })}  variant="danger" />
        </div>
      </QuestionCard>

      {/* ── Q13 — Professional PDF ───────────────────────── */}
      <QuestionCard index={13} title={oq.q13} answered={offerAnswers.q13ProfessionalPDF !== ''} delay={0.11}>
        <div className="grid grid-cols-2 gap-2">
          <AnswerBtn label={yes} sublabel={`10 ${pts}`}
            selected={offerAnswers.q13ProfessionalPDF === 'yes'}
            onClick={() => updateOfferAnswers({ q13ProfessionalPDF: 'yes' })} variant="success" />
          <AnswerBtn label={no}  sublabel={`0 ${pts}`}
            selected={offerAnswers.q13ProfessionalPDF === 'no'}
            onClick={() => updateOfferAnswers({ q13ProfessionalPDF: 'no' })}  variant="danger" />
        </div>
      </QuestionCard>

      {/* ── Q14 — Clear Explanation ──────────────────────── */}
      <QuestionCard index={14} title={oq.q14} answered={offerAnswers.q14ClearExplanation !== ''} delay={0.14}>
        <div className="grid grid-cols-2 gap-2">
          <AnswerBtn label={yes} sublabel={`5 ${pts}`}
            selected={offerAnswers.q14ClearExplanation === 'yes'}
            onClick={() => updateOfferAnswers({ q14ClearExplanation: 'yes' })} variant="success" />
          <AnswerBtn label={no}  sublabel={`0 ${pts}`}
            selected={offerAnswers.q14ClearExplanation === 'no'}
            onClick={() => updateOfferAnswers({ q14ClearExplanation: 'no' })}  variant="danger" />
        </div>
      </QuestionCard>

      {/* ── Q15 — Before & After ─────────────────────────── */}
      <QuestionCard index={15} title={oq.q15} answered={offerAnswers.q15BeforeAfterPhotos !== ''} delay={0.17}>
        <div className="grid grid-cols-2 gap-2">
          <AnswerBtn label={yes} sublabel={`5 ${pts}`}
            selected={offerAnswers.q15BeforeAfterPhotos === 'yes'}
            onClick={() => updateOfferAnswers({ q15BeforeAfterPhotos: 'yes' })} variant="success" />
          <AnswerBtn label={no}  sublabel={`0 ${pts}`}
            selected={offerAnswers.q15BeforeAfterPhotos === 'no'}
            onClick={() => updateOfferAnswers({ q15BeforeAfterPhotos: 'no' })}  variant="danger" />
        </div>
      </QuestionCard>

      {/* ── Q16 — Concise Communication ──────────────────── */}
      <QuestionCard index={16} title={oq.q16} answered={offerAnswers.q16ConciseCommunication !== ''} delay={0.20}>
        <div className="grid grid-cols-2 gap-2">
          <AnswerBtn label={yes} sublabel={`5 ${pts}`}
            selected={offerAnswers.q16ConciseCommunication === 'yes'}
            onClick={() => updateOfferAnswers({ q16ConciseCommunication: 'yes' })} variant="success" />
          <AnswerBtn label={no}  sublabel={`0 ${pts}`}
            selected={offerAnswers.q16ConciseCommunication === 'no'}
            onClick={() => updateOfferAnswers({ q16ConciseCommunication: 'no' })}  variant="danger" />
        </div>
      </QuestionCard>

      {/* ── Q17 — Follow-Up Count ────────────────────────── */}
      <QuestionCard index={17} title={oq.q17} answered={offerAnswers.q17FollowUpWeek !== -1} delay={0.23}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            { v: 3 as const, pts: 3,  variant: 'success'  as const },
            { v: 2 as const, pts: 2,  variant: 'default'  as const },
            { v: 1 as const, pts: 1,  variant: 'neutral'  as const },
            { v: 0 as const, pts: 0,  variant: 'danger'   as const },
          ]).map(opt => (
            <AnswerBtn
              key={opt.v}
              label={String(opt.v)}
              sublabel={`${opt.pts} ${pts}`}
              selected={offerAnswers.q17FollowUpWeek === opt.v}
              onClick={() => updateOfferAnswers({ q17FollowUpWeek: opt.v })}
              variant={opt.variant}
            />
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-2 font-medium">
          {lang === 'tr'
            ? 'Teklif gönderildikten sonra bir hafta içinde kaç kez takip edildi?'
            : 'How many follow-ups were made within one week after sending the treatment plan?'}
        </p>
      </QuestionCard>

      {/* ── Tamamlandı mesajı ─────────────────────────────── */}
      <AnimatePresence>
        {answeredCount === 7 && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex items-center gap-3 px-5 py-4 bg-violet-50 border border-violet-200 rounded-2xl"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-300/40">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-violet-800">{oq.allAnswered}</p>
              <p className="text-xs text-violet-600 mt-0.5">
                {oq.totalScore}: {score} / 50
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
