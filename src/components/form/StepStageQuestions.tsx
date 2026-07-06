'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useFormStore } from '@/stores/formStore'
import { useLanguage } from '@/lib/i18n'
import type { ResponseTimeAnswer, Score4Answer, YesNoAnswer, Score10Answer } from '@/types/supabase'
import { EXTENDED_STAGES } from '@/types/supabase'

// ─── Skor rengini hesapla ─────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-500'
}
function scoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200'
  if (score >= 60) return 'bg-blue-50 border-blue-200'
  if (score >= 40) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}
function scoreBar(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
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
    default:  'border-[#1B4332] bg-[#1B4332] text-white shadow-lg shadow-[#1B4332]/25',
    success:  'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-300/40',
    danger:   'border-red-400 bg-red-400 text-white shadow-lg shadow-red-300/30',
    neutral:  'border-gray-500 bg-gray-500 text-white shadow-lg shadow-gray-300/30',
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
          layoutId={undefined}
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
        answered ? 'border-[#1B4332]/20' : 'border-gray-100'
      }`}
    >
      {/* Answered indicator bar */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'left' }}
            className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#52B788] to-[#1B4332]"
          />
        )}
      </AnimatePresence>

      <div className="p-4 sm:p-5">
        {/* Başlık */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            answered ? 'bg-[#1B4332] shadow-md shadow-[#1B4332]/25' : 'bg-gray-100'
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

export function StepStageQuestions() {
  const { lang, t } = useLanguage()
  const { stageAnswers, updateStageAnswers, getStageScore, step1 } = useFormStore()
  const isExtended = EXTENDED_STAGES.includes(step1.stage as typeof EXTENDED_STAGES[number])

  const score = getStageScore()
  const sq = t.form.stageQuestions
  const pts = sq.pts

  // Extended stage'de her puanın gerçek katkısı yarıya düşer
  function sub(v: number): string {
    const actual = isExtended ? Math.round(v / 2) : v
    return `${actual} ${pts}`
  }

  const answeredCount = [
    stageAnswers.q1ResponseTime !== '',
    stageAnswers.q2ProfessionalIntro !== -1,
    stageAnswers.q3NeedsAssessment !== -1,
    stageAnswers.q4BuildTrust !== -1,
    stageAnswers.q5InfoPhotoCollection !== -1,
    stageAnswers.q6ProfessionalComm !== -1,
    stageAnswers.q7CrmDocumentation !== '',
    stageAnswers.q8ConfirmNextSteps !== '',
    stageAnswers.q9NoPriceDiscussion !== '',
    stageAnswers.q10FollowUp !== -1,
  ].filter(Boolean).length

  const score4Opts: { value: Score4Answer; label: string }[] = [
    { value: 1,  label: '1' },
    { value: 5,  label: '5' },
    { value: 7,  label: '7' },
    { value: 10, label: '10' },
  ]

  const score10Opts: { value: Score10Answer; label: string }[] = [
    { value: 10, label: '10' },
    { value: 7,  label: '7' },
    { value: 5,  label: '5' },
    { value: 0,  label: '0' },
  ]

  const yes = t.common.yes
  const no  = t.common.no

  return (
    <div className="space-y-3">

      {/* ── Üst özet kartı ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <motion.div
            className={`h-full ${scoreBar(score)}`}
            initial={{ width: 0 }}
            animate={{ width: `${(answeredCount / 10) * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>

        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-0.5">
              {sq.header}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">
                {answeredCount}
                <span className="text-gray-400 font-medium">/10 </span>
                {sq.answered}
              </span>
            </div>
          </div>

          {/* Canlı skor */}
          <motion.div
            key={score}
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className={`text-center px-4 py-2.5 rounded-2xl border-2 min-w-[80px] transition-all duration-300 ${scoreBg(score)}`}
          >
            <p className={`text-2xl font-black tabular-nums leading-none ${scoreColor(score)}`}>{score}</p>
            <p className={`text-[10px] font-bold mt-0.5 ${scoreColor(score)} opacity-70`}>{isExtended ? '/ 50' : '/ 100'}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Q1 — Response Time ───────────────────────────── */}
      <QuestionCard
        index={1}
        title={sq.q1}
        answered={stageAnswers.q1ResponseTime !== ''}
        delay={0.05}
      >
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: '<15' as ResponseTimeAnswer, label: '< 15 min', raw: 10, variant: 'success' as const },
            { value: '=15' as ResponseTimeAnswer, label: '= 15 min', raw: 5,  variant: 'neutral' as const },
            { value: '>15' as ResponseTimeAnswer, label: '> 15 min', raw: 0,  variant: 'danger' as const },
          ]).map(opt => (
            <AnswerBtn
              key={opt.value}
              label={opt.label}
              sublabel={sub(opt.raw)}
              selected={stageAnswers.q1ResponseTime === opt.value}
              onClick={() => updateStageAnswers({ q1ResponseTime: opt.value })}
              variant={opt.variant}
            />
          ))}
        </div>
      </QuestionCard>

      {/* ── Q2–Q6 — Score 1/5/7/10 ──────────────────────── */}
      {([
        { key: 'q2ProfessionalIntro'  as const, title: sq.q2, idx: 2 },
        { key: 'q3NeedsAssessment'    as const, title: sq.q3, idx: 3 },
        { key: 'q4BuildTrust'         as const, title: sq.q4, idx: 4 },
        { key: 'q5InfoPhotoCollection'as const, title: sq.q5, idx: 5 },
        { key: 'q6ProfessionalComm'   as const, title: sq.q6, idx: 6 },
      ]).map(({ key, title, idx }) => (
        <QuestionCard
          key={key}
          index={idx}
          title={title}
          answered={stageAnswers[key] !== -1}
          delay={idx * 0.04}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {score4Opts.map(opt => (
              <AnswerBtn
                key={opt.value}
                label={opt.label}
                sublabel={sub(opt.value)}
                selected={stageAnswers[key] === opt.value}
                onClick={() => updateStageAnswers({ [key]: opt.value } as never)}
                variant={opt.value === 10 ? 'success' : opt.value === 1 ? 'danger' : 'default'}
              />
            ))}
          </div>
        </QuestionCard>
      ))}

      {/* ── Q7–Q9 — Yes / No ─────────────────────────────── */}
      {([
        { key: 'q7CrmDocumentation'  as const, title: sq.q7, idx: 7 },
        { key: 'q8ConfirmNextSteps'  as const, title: sq.q8, idx: 8 },
        { key: 'q9NoPriceDiscussion' as const, title: sq.q9, idx: 9 },
      ]).map(({ key, title, idx }) => (
        <QuestionCard
          key={key}
          index={idx}
          title={title}
          answered={stageAnswers[key] !== ''}
          delay={idx * 0.04}
        >
          <div className="grid grid-cols-2 gap-2">
            <AnswerBtn
              label={yes}
              sublabel={sub(10)}
              selected={stageAnswers[key] === 'yes'}
              onClick={() => updateStageAnswers({ [key]: 'yes' as YesNoAnswer } as never)}
              variant="success"
            />
            <AnswerBtn
              label={no}
              sublabel={sub(0)}
              selected={stageAnswers[key] === 'no'}
              onClick={() => updateStageAnswers({ [key]: 'no' as YesNoAnswer } as never)}
              variant="danger"
            />
          </div>
        </QuestionCard>
      ))}

      {/* ── Q10 — Follow-Up Within One Week ──────────────── */}
      <QuestionCard
        index={10}
        title={sq.q10}
        answered={stageAnswers.q10FollowUp !== -1}
        delay={0.42}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {score10Opts.map(opt => (
            <AnswerBtn
              key={opt.value}
              label={String(opt.value)}
              sublabel={sub(opt.value)}
              selected={stageAnswers.q10FollowUp === opt.value}
              onClick={() => updateStageAnswers({ q10FollowUp: opt.value })}
              variant={opt.value === 10 ? 'success' : opt.value === 0 ? 'danger' : 'default'}
            />
          ))}
        </div>
      </QuestionCard>

      {/* ── Tamamlandı mesajı ─────────────────────────────── */}
      <AnimatePresence>
        {answeredCount === 10 && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex items-center gap-3 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-300/40">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">{sq.allAnswered}</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {sq.totalScore}: {score} / {isExtended ? '50' : '100'}
              </p>
              {isExtended && (
                <p className="text-xs text-amber-600 font-semibold mt-1">
                  {sq.extendedNote}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
