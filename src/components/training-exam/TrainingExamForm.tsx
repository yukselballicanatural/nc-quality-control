'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  User,
  Users,
  Save,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'

const CRITERIA_EN = [
  'Professional Greeting / Clear Introduction',
  'Objection Handling',
  'Builds Rapport',
  'Authority Tone & Pace and Language',
  'Identifies Main Problem + Goals',
  'Collects Photos / X-ray & Medical Info',
  'Medical Information Accuracy',
  'Sets Expectations (Timeline / Visit Plan)',
]

const CRITERIA_TR = [
  'Profesyonel Karşılama / Net Tanıtım',
  'İtiraz Karşılama',
  'Bağ Kurma',
  'Otorite Tonu, Konuşma Hızı ve Dil Kullanımı',
  'Ana Problemi ve Hedefleri Belirleme',
  'Fotoğraf / Röntgen ve Medikal Bilgi Toplama',
  'Medikal Bilgi Doğruluğu',
  'Beklentileri Belirleme (Zaman Planı / Ziyaret Planı)',
]

const PASS_THRESHOLDS = { junior: 32, senior: 35 } as const

const SCORE_STYLES: Record<number, string> = {
  1: 'border-red-400 bg-red-50 text-red-700',
  2: 'border-orange-400 bg-orange-50 text-orange-700',
  3: 'border-yellow-400 bg-yellow-50 text-yellow-700',
  4: 'border-blue-400 bg-blue-50 text-blue-700',
  5: 'border-green-400 bg-green-50 text-green-700',
}

const SCORE_SELECTED_STYLES: Record<number, string> = {
  1: 'border-red-500 bg-red-500 text-white shadow-lg shadow-red-300/30',
  2: 'border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-300/30',
  3: 'border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-300/30',
  4: 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-300/30',
  5: 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-300/40',
}

function scoreSummaryBg(score: number): string {
  if (score >= 35) return 'bg-emerald-50 border-emerald-200 text-emerald-700'
  if (score >= 32) return 'bg-blue-50 border-blue-200 text-blue-700'
  if (score >= 24) return 'bg-amber-50 border-amber-200 text-amber-700'
  return 'bg-red-50 border-red-200 text-red-600'
}

function isMissingTeamLeaderColumn(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
    error.message?.includes('team_leader_id') &&
    (error.code === '42703' || error.code === 'PGRST204')
  )
}

function isMissingConsultantNameColumn(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
    error.message?.includes('consultant_name') &&
    (error.code === '42703' || error.code === 'PGRST204')
  )
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase('tr-TR')
}

const SCORE_LABELS_TR: Record<number, string> = { 1: 'Çok Zayıf', 2: 'Zayıf', 3: 'Orta', 4: 'İyi', 5: 'Mükemmel' }
const SCORE_LABELS_EN: Record<number, string> = { 1: 'Very Weak', 2: 'Weak', 3: 'Average', 4: 'Good', 5: 'Excellent' }
const inputCls =
  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15 focus:border-[#1B4332] transition-all hover:border-gray-300'
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2'
const sectionCls = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4'

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1 pb-3 border-b border-gray-50">
      <div className="w-7 h-7 rounded-lg bg-[#1B4332]/8 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-[#1B4332]" />
      </div>
      <span className="text-sm font-bold text-gray-700">{title}</span>
    </div>
  )
}

type Level = 'junior' | 'senior'
type Phase = 'level' | 'scoring' | 'result'

interface Props {
  consultants?: { id: string; full_name: string | null }[]
  evaluatorId: string
  evaluatorName: string
}

export function TrainingExamForm({ consultants, evaluatorId, evaluatorName }: Props) {
  const { lang } = useLanguage()
  const isTr = lang === 'tr'
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('level')
  const [level, setLevel] = useState<Level | null>(null)
  const [consultantName, setConsultantName] = useState('')
  const [scores, setScores] = useState<number[]>(Array(8).fill(0))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const criteria = isTr ? CRITERIA_TR : CRITERIA_EN
  const scoreLabels = isTr ? SCORE_LABELS_TR : SCORE_LABELS_EN
  const totalScore = scores.reduce((sum, s) => sum + s, 0)
  const threshold = level ? PASS_THRESHOLDS[level] : 0
  const passed = totalScore >= threshold
  const trimmedConsultantName = consultantName.trim()
  const ratedCount = scores.filter(Boolean).length
  const phaseIndex = phase === 'level' ? 0 : phase === 'scoring' ? 1 : 2
  const progress = (phaseIndex / 2) * 100

  const steps = [
    {
      phase: 'level' as Phase,
      title: isTr ? 'Seviye Seçimi' : 'Level Selection',
      description: isTr ? 'Danışmanı ve sınav seviyesini belirleyin.' : 'Choose the consultant and exam level.',
    },
    {
      phase: 'scoring' as Phase,
      title: isTr ? 'Kriter Değerlendirmesi' : 'Criteria Scoring',
      description: isTr ? '8 kriteri 1-5 arası puanlayın.' : 'Score 8 criteria from 1 to 5.',
    },
    {
      phase: 'result' as Phase,
      title: isTr ? 'Sınav Sonucu' : 'Exam Result',
      description: isTr ? 'Sonucu kontrol edip kaydedin.' : 'Review and save the result.',
    },
  ]

  const activeStep = steps[phaseIndex]

  function handleStartExam() {
    if (!level) { setError(isTr ? 'Seviye seçilmesi zorunludur.' : 'Level selection is required.'); return }
    if (!trimmedConsultantName) { setError(isTr ? 'Danışman adı girilmesi zorunludur.' : 'Consultant name is required.'); return }
    setError('')
    setPhase('scoring')
  }

  function handleFinish() {
    if (scores.some(s => s === 0)) { setError(isTr ? 'Tüm 8 kriter puanlanmalıdır.' : 'All 8 criteria must be scored.'); return }
    setError('')
    setPhase('result')
  }

  function handleReset() {
    setPhase('level')
    setLevel(null)
    setConsultantName('')
    setScores(Array(8).fill(0))
    setError('')
    setSaved(false)
  }

  function setScore(index: number, value: number) {
    const next = [...scores]
    next[index] = value
    setScores(next)
    setError('')
  }

  function handleBackPhase() {
    setError('')
    if (phase === 'scoring') setPhase('level')
    if (phase === 'result' && !saved) setPhase('scoring')
  }

  function handlePrimaryAction() {
    if (phase === 'level') handleStartExam()
    if (phase === 'scoring') handleFinish()
    if (phase === 'result') handleSave()
  }

  function findMatchingConsultant() {
    const consultantOptions = Array.isArray(consultants) ? consultants : []
    const normalizedInput = normalizeName(consultantName)

    for (const consultant of consultantOptions) {
      if (normalizeName(consultant.full_name ?? '') === normalizedInput) {
        return consultant
      }
    }

    return null
  }

  async function handleSave() {
    if (!level) return
    setSaving(true)
    try {
      const supabase = createClient()
      const matchedConsultant = findMatchingConsultant()
      const payload = {
        evaluator_id: evaluatorId,
        consultant_id: matchedConsultant?.id ?? null,
        consultant_name: trimmedConsultantName,
        level,
        criteria_scores: scores.map((score, i) => ({ criteriaNumber: i + 1, score })),
        total_score: totalScore,
        passed,
      }
      let savedExamId: string | null = null
      let { data: savedExam, error: err } = await supabase
        .from('training_exams')
        .insert(payload)
        .select('id')
        .single()
      savedExamId = savedExam?.id ?? null

      if (isMissingTeamLeaderColumn(err)) {
        const payloadWithoutTeamLeader = {
          evaluator_id: payload.evaluator_id,
          consultant_id: payload.consultant_id,
          consultant_name: payload.consultant_name,
          level: payload.level,
          criteria_scores: payload.criteria_scores,
          total_score: payload.total_score,
          passed: payload.passed,
        }
        const retry = await supabase
          .from('training_exams')
          .insert(payloadWithoutTeamLeader)
          .select('id')
          .single()
        err = retry.error
        savedExamId = retry.data?.id ?? null
      }

      if (isMissingConsultantNameColumn(err)) {
        const payloadWithoutConsultantName = {
          evaluator_id: payload.evaluator_id,
          consultant_id: matchedConsultant?.id ?? null,
          level: payload.level,
          criteria_scores: payload.criteria_scores,
          total_score: payload.total_score,
          passed: payload.passed,
        }
        const retry = await supabase
          .from('training_exams')
          .insert(payloadWithoutConsultantName)
          .select('id')
          .single()
        err = retry.error
        savedExamId = retry.data?.id ?? null
      }

      if (err) throw err
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'training_exam_created',
          entityType: 'training_exam',
          entityId: savedExamId,
          metadata: {
            full_name: trimmedConsultantName,
            level,
            score: totalScore,
            passed,
          },
        }),
      }).catch(() => null)
      setSaved(true)
      router.push('/training-exam-results')
      router.refresh()
    } catch (err) {
      console.error('Training exam save error:', err)
      setError(isTr ? 'Kayıt sırasında hata oluştu.' : 'Error saving result.')
    } finally {
      setSaving(false)
    }
  }

  const primaryLabel =
    phase === 'level'
      ? (isTr ? 'Değerlendirmeyi Başlat' : 'Start Evaluation')
      : phase === 'scoring'
        ? (isTr ? 'Sonucu Görüntüle' : 'View Result')
        : saved
          ? (isTr ? 'Kaydedildi' : 'Saved')
          : saving
            ? (isTr ? 'Kaydediliyor...' : 'Saving...')
            : (isTr ? 'Sonucu Kaydet' : 'Save Result')

  return (
    <div className="w-full space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gray-100 relative">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#52B788] to-[#1B4332]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          />
        </div>

        <div className="px-4 sm:px-5 pt-3.5 sm:pt-4 pb-4 sm:pb-5 flex items-start gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 mb-2.5 sm:mb-3 flex-wrap">
                {steps.map((step, i) => (
                  <div key={step.phase} className="flex items-center gap-1.5">
                    <div
                      className={`transition-all duration-300 flex items-center justify-center font-bold rounded-full flex-shrink-0 ${
                        i < phaseIndex
                          ? 'w-5 h-5 sm:w-6 sm:h-6 bg-[#52B788] text-white text-[9px] sm:text-[10px]'
                          : i === phaseIndex
                            ? 'w-6 h-6 sm:w-7 sm:h-7 bg-[#1B4332] text-white text-[10px] sm:text-xs ring-4 ring-[#1B4332]/10'
                            : 'w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 text-gray-400 text-[9px] sm:text-[10px]'
                      }`}
                    >
                      {i < phaseIndex ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : i + 1}
                    </div>
                  </div>
                ))}
                <span className="ml-1 text-xs text-gray-400 font-medium">{phaseIndex + 1}/3</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`title-${phase}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  <h2 className="text-base sm:text-xl font-bold text-gray-900 leading-tight">
                    {activeStep.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-0.5 hidden sm:block leading-relaxed">
                    {activeStep.description}
                  </p>
                </motion.div>
              </AnimatePresence>
          </div>

          <motion.div
            key={`${totalScore}-${ratedCount}-${threshold}`}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            className="flex-shrink-0 min-w-[68px] sm:min-w-[84px] text-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-transparent bg-[#1B4332]/8"
          >
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-0.5 sm:mb-1">
              {isTr ? 'Canlı Skor' : 'Live Score'}
            </div>
            <div className="text-2xl sm:text-3xl font-black leading-none tabular-nums text-[#1B4332]">
              {totalScore}
            </div>
            <div className="text-[10px] font-semibold mt-1 sm:mt-1.5 text-[#1B4332]/60">
              {threshold
                ? (isTr ? `Geçme: ${threshold}` : `Pass: ${threshold}`)
                : (isTr ? 'Seviye seçin' : 'Select level')}
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            key="exam-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-hidden">
        <AnimatePresence mode="wait">
          {phase === 'level' && (
            <motion.div
              key="level"
              initial={{ opacity: 0, x: 48, filter: 'blur(5px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -48, filter: 'blur(5px)' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            >
              <div className={sectionCls}>
                <SectionHeader icon={Users} title={isTr ? 'Kişiler' : 'People'} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>
                      {isTr ? 'Danışman' : 'Consultant'} <span className="text-red-400 normal-case tracking-normal">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                      <input
                        value={consultantName}
                        onChange={event => {
                          setConsultantName(event.target.value)
                          setError('')
                        }}
                        placeholder={isTr ? 'Danışman adını girin' : 'Enter consultant name'}
                        className={`${inputCls} pl-10`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>
                      {isTr ? 'Değerlendiren Kişi' : 'Evaluator'}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
                      <div className={`${inputCls} pl-10 bg-gray-50 text-gray-400 cursor-default`}>
                        {evaluatorName}
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <label className={labelCls + ' mb-0'}>
                        {isTr ? 'Seviye' : 'Level'} <span className="text-red-400 normal-case tracking-normal">*</span>
                      </label>
                      <span className="text-[10px] font-semibold text-gray-400">
                        {isTr ? 'Geçme eşiği seviyeye göre belirlenir' : 'Pass threshold depends on level'}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      {(['junior', 'senior'] as Level[]).map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => { setLevel(lvl); setError('') }}
                          className={`group flex items-center gap-3 py-3.5 px-4 rounded-xl border-2 text-left transition-all duration-200 ${
                            level === lvl
                              ? 'border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332] shadow-sm'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            level === lvl ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-bold leading-tight capitalize ${level === lvl ? 'text-[#1B4332]' : 'text-gray-700'}`}>
                              {lvl}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {isTr ? `Geçme eşiği: ${PASS_THRESHOLDS[lvl]} puan` : `Pass threshold: ${PASS_THRESHOLDS[lvl]} points`}
                            </p>
                          </div>
                          {level === lvl && (
                            <div className="ml-auto w-5 h-5 rounded-full bg-[#1B4332] flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'scoring' && (
            <motion.div
              key="scoring"
              initial={{ opacity: 0, x: 48, filter: 'blur(5px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -48, filter: 'blur(5px)' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            >
              <div className="space-y-3">
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="h-1.5 bg-gray-100">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#52B788] to-[#1B4332]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(ratedCount / 8) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                    />
                  </div>
                  <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-0.5">
                        {isTr ? 'Eğitim Sınavı Kriterleri' : 'Training Exam Criteria'}
                      </p>
                      <p className="text-sm font-bold text-gray-700">
                        {ratedCount}
                        <span className="text-gray-400 font-medium">/8 </span>
                        {isTr ? 'kriter puanlandı' : 'criteria scored'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {trimmedConsultantName} · <span className="capitalize font-semibold text-[#1B4332]">{level}</span>
                      </p>
                    </div>

                    <motion.div
                      key={`${totalScore}-${threshold}`}
                      initial={{ scale: 0.75, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      className={`text-center px-4 py-2.5 rounded-2xl border-2 min-w-[92px] transition-all duration-300 ${scoreSummaryBg(totalScore)}`}
                    >
                      <p className="text-2xl font-black tabular-nums leading-none">{totalScore}</p>
                      <p className="text-[10px] font-bold mt-0.5 opacity-70">
                        {isTr ? `Eşik ${threshold}` : `Target ${threshold}`}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {isTr ? 'Kriter Değerlendirmesi' : 'Criteria Scoring'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {trimmedConsultantName} · <span className="capitalize font-semibold text-[#1B4332]">{level}</span>
                    </p>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                    {[1, 2, 3, 4, 5].map(s => (
                      <div key={s} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold flex-shrink-0 ${SCORE_STYLES[s]}`}>
                        <span>{s}</span>
                        <span className="hidden sm:inline">{scoreLabels[s]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {criteria.map((criterion, i) => (
                    <motion.div
                      key={criterion}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.035, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className={`relative rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
                        scores[i] ? 'border-[#1B4332]/20 bg-white' : 'border-gray-100 bg-white'
                      }`}
                    >
                      <AnimatePresence>
                        {scores[i] > 0 && (
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
                        <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                              scores[i] ? 'bg-[#1B4332] shadow-md shadow-[#1B4332]/25' : 'bg-gray-100'
                            }`}>
                              {scores[i] ? (
                                <motion.div
                                  initial={{ scale: 0, rotate: -30 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                                >
                                  <Check className="w-4 h-4 text-white" />
                                </motion.div>
                              ) : (
                                <span className="text-xs font-black text-gray-400">{i + 1}</span>
                              )}
                            </div>
                            <div className="pt-0.5 min-w-0">
                              <p className="text-sm font-bold text-gray-800 leading-snug">
                                {criterion}
                              </p>
                              <p className="text-[11px] text-gray-400 font-medium mt-1">
                                {scores[i]
                                  ? (isTr ? `${scores[i]} puan seçildi` : `${scores[i]} points selected`)
                                  : (isTr ? '1 ile 5 arasında bir puan seçin' : 'Select a score between 1 and 5')}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 xl:w-[360px]">
                            {[1, 2, 3, 4, 5].map(score => {
                              const selected = scores[i] === score

                              return (
                                <motion.button
                                  key={score}
                                  type="button"
                                  onClick={() => setScore(i, score)}
                                  whileTap={{ scale: 0.94 }}
                                  className={`relative h-12 sm:h-14 rounded-2xl border-2 flex flex-col items-center justify-center overflow-hidden transition-all duration-200 ${
                                    selected
                                      ? SCORE_SELECTED_STYLES[score]
                                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:scale-[1.02]'
                                  }`}
                                >
                                  {selected && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.6 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center"
                                    >
                                      <Check className="w-2.5 h-2.5 text-white" />
                                    </motion.div>
                                  )}
                                  <span className="text-base sm:text-lg font-black leading-none">{score}</span>
                                  <span className={`text-[9px] sm:text-[10px] mt-0.5 leading-none font-semibold ${selected ? 'opacity-75' : 'text-gray-400'}`}>
                                    {scoreLabels[score]}
                                  </span>
                                </motion.button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 48, filter: 'blur(5px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -48, filter: 'blur(5px)' }}
              transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            >
              <div className="grid lg:grid-cols-[340px_1fr] gap-3">
                <div className={`rounded-2xl border p-6 text-center shadow-sm ${
                  passed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
                }`}>
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.08 }}
                  >
                    {passed
                      ? <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
                      : <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
                    }
                    <p className={`text-4xl font-black tracking-widest mb-2 ${passed ? 'text-green-700' : 'text-red-700'}`}>
                      {passed ? (isTr ? 'GEÇTİ' : 'PASSED') : (isTr ? 'KALDI' : 'FAILED')}
                    </p>
                    <p className={`text-sm font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
                      {trimmedConsultantName}
                    </p>
                  </motion.div>

                  <div className="h-px bg-black/5 my-5" />

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-white/70 p-3">
                      <p className="text-2xl font-black text-gray-900">{totalScore}</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-1">{isTr ? 'Puan' : 'Score'}</p>
                    </div>
                    <div className="rounded-xl bg-white/70 p-3">
                      <p className="text-2xl font-black text-gray-900">{threshold}</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-1">{isTr ? 'Eşik' : 'Target'}</p>
                    </div>
                    <div className="rounded-xl bg-white/70 p-3">
                      <p className="text-2xl font-black text-gray-900">{level ? level.slice(0, 1).toUpperCase() : '-'}</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-1">{isTr ? 'Seviye' : 'Level'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-[0.16em]">
                      {isTr ? 'Kriter Detayları' : 'Criteria Breakdown'}
                    </p>
                    <p className="text-sm font-black text-[#1B4332]">
                      {isTr ? `${totalScore} puan` : `${totalScore} points`}
                    </p>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {criteria.map((criterion, i) => (
                      <div key={criterion} className="flex items-center gap-3 px-5 py-3.5">
                        <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-500 text-xs font-black flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-700 flex-1 leading-snug">{criterion}</p>
                        <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-sm font-black flex-shrink-0 ${SCORE_STYLES[scores[i]] ?? 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                          {scores[i]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-3">
        <button
          type="button"
          onClick={handleBackPhase}
          disabled={phase === 'level' || saving || saved}
          className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-xl transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">{isTr ? 'Geri' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          {phase === 'result' && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium text-[#1B4332] hover:bg-[#1B4332]/8 rounded-xl transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{isTr ? 'Yeni Sınav' : 'New Exam'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={saving || (phase === 'result' && saved)}
            className={`group flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-lg active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed ${
              phase === 'result' && saved
                ? 'bg-green-500 shadow-green-200/60'
                : 'bg-[#1B4332] hover:bg-[#163728] shadow-[#1B4332]/20 hover:shadow-xl hover:shadow-[#1B4332]/30'
            }`}
          >
            {phase === 'result' && saved ? <CheckCircle2 className="w-4 h-4" /> : phase === 'result' ? <Save className="w-4 h-4" /> : null}
            {primaryLabel}
            {phase !== 'result' && <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
          </button>
        </div>
      </div>
    </div>
  )
}
