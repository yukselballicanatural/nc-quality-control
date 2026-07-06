'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, GraduationCap, RotateCcw, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'

const CRITERIA = [
  'Professional Greeting / Clear Introduction',
  'Objection Handling',
  'Builds Rapport',
  'Authority Tone & Pace and Language',
  'Identifies Main Problem + Goals',
  'Collects Photos / X-ray & Medical Info',
  'Medical Information Accuracy',
  'Sets Expectations (Timeline / Visit Plan)',
]

const PASS_THRESHOLDS = { junior: 32, senior: 35 } as const

const SCORE_STYLES: Record<number, string> = {
  1: 'border-red-400 bg-red-50 text-red-700',
  2: 'border-orange-400 bg-orange-50 text-orange-700',
  3: 'border-yellow-400 bg-yellow-50 text-yellow-700',
  4: 'border-blue-400 bg-blue-50 text-blue-700',
  5: 'border-green-400 bg-green-50 text-green-700',
}

const SCORE_LABELS_TR: Record<number, string> = { 1: 'Çok Zayıf', 2: 'Zayıf', 3: 'Orta', 4: 'İyi', 5: 'Mükemmel' }
const SCORE_LABELS_EN: Record<number, string> = { 1: 'Very Weak', 2: 'Weak', 3: 'Average', 4: 'Good', 5: 'Excellent' }

type Level = 'junior' | 'senior'
type Phase = 'level' | 'scoring' | 'result'

interface Props {
  consultants: { id: string; full_name: string }[]
  evaluatorId: string
}

export function TrainingExamForm({ consultants, evaluatorId }: Props) {
  const { lang } = useLanguage()
  const isTr = lang === 'tr'

  const [phase, setPhase] = useState<Phase>('level')
  const [level, setLevel] = useState<Level | null>(null)
  const [consultantId, setConsultantId] = useState('')
  const [scores, setScores] = useState<number[]>(Array(8).fill(0))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const scoreLabels = isTr ? SCORE_LABELS_TR : SCORE_LABELS_EN
  const totalScore = scores.reduce((sum, s) => sum + s, 0)
  const threshold = level ? PASS_THRESHOLDS[level] : 0
  const passed = totalScore >= threshold

  function handleStartExam() {
    if (!level) { setError(isTr ? 'Seviye seçilmesi zorunludur.' : 'Level selection is required.'); return }
    if (!consultantId) { setError(isTr ? 'Danışman seçilmesi zorunludur.' : 'Consultant selection is required.'); return }
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
    setConsultantId('')
    setScores(Array(8).fill(0))
    setError('')
    setSaved(false)
  }

  function setScore(index: number, value: number) {
    const next = [...scores]
    next[index] = value
    setScores(next)
  }

  async function handleSave() {
    if (!level) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.from('training_exams').insert({
        evaluator_id: evaluatorId,
        consultant_id: consultantId,
        level,
        criteria_scores: scores.map((score, i) => ({ criteriaNumber: i + 1, score })),
        total_score: totalScore,
        passed,
      })
      if (err) throw err
      setSaved(true)
    } catch (err) {
      console.error('Training exam save error:', err)
      setError(isTr ? 'Kayıt sırasında hata oluştu.' : 'Error saving result.')
    } finally {
      setSaving(false)
    }
  }

  const consultant = consultants.find(c => c.id === consultantId)

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">

        {/* ── LEVEL SELECTION ── */}
        {phase === 'level' && (
          <motion.div
            key="level"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-xl bg-[#1B4332]/10 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-[#1B4332]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {isTr ? 'Seviye Seçimi' : 'Level Selection'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {isTr ? 'Değerlendirme yapılacak danışmanı ve seviyeyi seçin.' : 'Select the consultant and level for evaluation.'}
                  </p>
                </div>
              </div>

              {/* Consultant */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {isTr ? 'Danışman' : 'Consultant'}
                </label>
                <select
                  value={consultantId}
                  onChange={e => { setConsultantId(e.target.value); setError('') }}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-colors"
                >
                  <option value="">{isTr ? 'Danışman seçin...' : 'Select consultant...'}</option>
                  {consultants.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              {/* Level cards */}
              <div className="mb-7">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {isTr ? 'Seviye' : 'Level'}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {(['junior', 'senior'] as Level[]).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => { setLevel(lvl); setError('') }}
                      className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                        level === lvl
                          ? 'border-[#1B4332] bg-[#1B4332]/5 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <p className="text-2xl font-black text-gray-900 capitalize mb-1.5 tracking-tight">{lvl}</p>
                      <p className="text-xs text-gray-500">
                        {isTr ? `Geçme eşiği: ${PASS_THRESHOLDS[lvl]}/40` : `Pass threshold: ${PASS_THRESHOLDS[lvl]}/40`}
                      </p>
                      {level === lvl && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#1B4332] flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <button
                onClick={handleStartExam}
                className="w-full h-12 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors flex items-center justify-center gap-2"
              >
                {isTr ? 'Değerlendirmeyi Başlat' : 'Start Evaluation'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── SCORING ── */}
        {phase === 'scoring' && (
          <motion.div
            key="scoring"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {isTr ? 'Kriter Değerlendirmesi' : 'Criteria Scoring'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {consultant?.full_name} · <span className="capitalize font-semibold text-[#1B4332]">{level}</span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-3xl font-black text-[#1B4332] leading-none">
                    {totalScore}
                    <span className="text-base font-normal text-gray-400"> / 40</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{isTr ? 'Toplam Puan' : 'Total Score'}</p>
                </div>
              </div>

              <div className="h-px bg-gray-100 mb-6" />

              {/* Score legend */}
              <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <div key={s} className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium flex-shrink-0 ${SCORE_STYLES[s]}`}>
                    <span className="font-bold">{s}</span>
                    <span className="hidden sm:inline">— {scoreLabels[s]}</span>
                  </div>
                ))}
              </div>

              {/* Criteria rows */}
              <div className="space-y-5">
                {CRITERIA.map((criterion, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-gray-800 mb-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#1B4332]/10 text-[#1B4332] text-xs font-bold mr-2">{i + 1}</span>
                      {criterion}
                    </p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map(score => (
                        <button
                          key={score}
                          onClick={() => setScore(i, score)}
                          className={`h-12 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-150 ${
                            scores[i] === score
                              ? SCORE_STYLES[score]
                              : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-base font-bold leading-none">{score}</span>
                          <span className="text-[9px] mt-0.5 leading-none hidden sm:block">{scoreLabels[score]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {error && <p className="text-sm text-red-600 mt-5">{error}</p>}

              <div className="flex gap-3 mt-7">
                <button
                  onClick={() => setPhase('level')}
                  className="h-11 px-5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {isTr ? 'Geri' : 'Back'}
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-1 h-11 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors flex items-center justify-center gap-2"
                >
                  {isTr ? 'Sonucu Görüntüle' : 'View Result'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── RESULT ── */}
        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35 }}
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              {/* Result badge */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
                className={`rounded-2xl p-8 mb-6 text-center ${passed ? 'bg-green-50' : 'bg-red-50'}`}
              >
                {passed
                  ? <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
                  : <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
                }
                <p className={`text-4xl font-black tracking-widest mb-2 ${passed ? 'text-green-700' : 'text-red-700'}`}>
                  {passed ? (isTr ? 'GEÇTİ' : 'PASSED') : (isTr ? 'KALDI' : 'FAILED')}
                </p>
                <p className={`text-sm font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
                  {isTr
                    ? `${level === 'junior' ? 'Junior' : 'Senior'} seviyesi geçme puanı: ${threshold}/40`
                    : `${level} level pass threshold: ${threshold}/40`
                  }
                </p>
              </motion.div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3.5 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-black text-gray-900">{totalScore}</p>
                  <p className="text-xs text-gray-500 mt-1">{isTr ? 'Toplam Puan' : 'Total Score'}</p>
                </div>
                <div className="text-center p-3.5 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-black text-gray-900 capitalize">{level}</p>
                  <p className="text-xs text-gray-500 mt-1">{isTr ? 'Seviye' : 'Level'}</p>
                </div>
                <div className="text-center p-3.5 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-black text-gray-900">{threshold}</p>
                  <p className="text-xs text-gray-500 mt-1">{isTr ? 'Geçme Eşiği' : 'Threshold'}</p>
                </div>
              </div>

              {/* Criteria breakdown */}
              <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {isTr ? 'Kriter Detayları' : 'Criteria Breakdown'}
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {CRITERIA.map((criterion, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-xs text-gray-400 font-bold w-4 flex-shrink-0">{i + 1}</span>
                      <p className="text-sm text-gray-700 flex-1">{criterion}</p>
                      <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 ${SCORE_STYLES[scores[i]] ?? ''}`}>
                        {scores[i]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex justify-between items-center">
                  <p className="text-sm font-semibold text-gray-700">{isTr ? 'Toplam' : 'Total'}</p>
                  <p className="text-lg font-black text-[#1B4332]">{totalScore} / 40</p>
                </div>
              </div>

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 h-11 px-5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {isTr ? 'Yeni Sınav' : 'New Exam'}
                </button>

                {saved ? (
                  <div className="flex-1 h-11 rounded-xl bg-green-500 flex items-center justify-center gap-2 text-white text-sm font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    {isTr ? 'Kaydedildi' : 'Saved'}
                  </div>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 h-11 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors disabled:opacity-60"
                  >
                    {saving ? (isTr ? 'Kaydediliyor...' : 'Saving...') : (isTr ? 'Sonucu Kaydet' : 'Save Result')}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
