'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  Check,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { useFormStore } from '@/stores/formStore'
import { useLanguage } from '@/lib/i18n'
import { useEvaluation } from '@/hooks/useEvaluation'
import { StepBasicInfo } from './StepBasicInfo'
import { StepStageQuestions } from './StepStageQuestions'
import { StepOfferQuestions } from './StepOfferQuestions'
import { StepDealQuestions } from './StepDealQuestions'
import { StepSecondVisitQuestions } from './StepSecondVisitQuestions'
import { StepActionPlan } from './StepActionPlan'
import type { UserRole } from '@/types/supabase'
import { EARLY_STAGES, EXTENDED_STAGES, SECOND_VISIT_STAGE } from '@/types/supabase'
import type { EvaluationWithRelations } from '@/types'

export interface FormStepperProps {
  role: UserRole
  evaluatorId: string
  evaluatorName: string
  consultants: { id: string; full_name: string }[]
  teamLeaders: { id: string; full_name: string }[]
  teams: { id: string; name: string }[]
  initialEvaluation?: EvaluationWithRelations
}

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 72 : -72,
    opacity: 0,
    filter: 'blur(5px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -72 : 72,
    opacity: 0,
    filter: 'blur(5px)',
  }),
}

// totalSteps is computed per render below based on stage

export function FormStepper({
  role,
  evaluatorId,
  evaluatorName,
  consultants,
  teamLeaders,
  teams,
  initialEvaluation,
}: FormStepperProps) {
  const { lang, t } = useLanguage()
  const { saveDraft, submit, isSaving, saveError, clearError } = useEvaluation(initialEvaluation?.id ?? null)

  const {
    currentStep,
    setCurrentStep,
    updateStep1,
    step1,
    isStageQuestionsComplete,
    isOfferQuestionsComplete,
    isDealQuestionsComplete,
    isSecondVisitQuestionsComplete,
    initFromEvaluation,
    resetForm,
  } = useFormStore()

  const isEarlyStage       = EARLY_STAGES.includes(step1.stage as typeof EARLY_STAGES[number])
  const isExtendedStage    = EXTENDED_STAGES.includes(step1.stage as typeof EXTENDED_STAGES[number])
  const isDealStage        = step1.stage === 'deal'
  const isSecondVisitStage = step1.stage === SECOND_VISIT_STAGE
  const totalSteps         = isExtendedStage ? 4 : 3

  const [direction, setDirection] = useState(1)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [savedOk, setSavedOk] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (initialEvaluation) {
      initFromEvaluation(initialEvaluation)
    } else {
      resetForm()
      updateStep1({ evaluatorId })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { getStageScore } = useFormStore()
  const stageScore = getStageScore()

  function getStepError(step: number): string | null {
    if (step === 1) {
      if (!step1.consultantId) return lang === 'tr' ? 'Danışman seçilmedi.' : 'No consultant selected.'
      if (!step1.customerPhone.trim()) return lang === 'tr' ? 'Müşteri telefon numarası zorunludur.' : 'Customer phone number is required.'
      if (step1.channels.length === 0) return lang === 'tr' ? 'Görüşme kanalı seçilmedi.' : 'Channel not selected.'
      if (!step1.reviewStartDate) return lang === 'tr' ? 'İncelenen dönem başlangıç tarihi zorunludur.' : 'Review period start date is required.'
      if (!step1.reviewEndDate) return lang === 'tr' ? 'İncelenen dönem bitiş tarihi zorunludur.' : 'Review period end date is required.'
      if (!step1.controlDate) return lang === 'tr' ? 'Kontrol tarihi zorunludur.' : 'Control date is required.'
      if (!step1.stage) return lang === 'tr' ? 'Satış süreci (stage) seçilmedi.' : 'Sales stage not selected.'
    }
    if (step === 2 && isDealStage && !isDealQuestionsComplete()) {
      return lang === 'tr' ? 'Tüm deal soruları yanıtlanmalıdır.' : 'All deal questions must be answered.'
    }
    if (step === 2 && isSecondVisitStage && !isSecondVisitQuestionsComplete()) {
      return lang === 'tr' ? 'Soruyu yanıtlamanız gerekiyor.' : 'Please answer the question.'
    }
    if (step === 2 && (isEarlyStage || isExtendedStage) && !isStageQuestionsComplete()) {
      return lang === 'tr' ? 'Tüm stage soruları yanıtlanmalıdır.' : 'All stage questions must be answered.'
    }
    if (step === 3 && isExtendedStage && !isOfferQuestionsComplete()) {
      return lang === 'tr' ? 'Tüm teklif soruları yanıtlanmalıdır.' : 'All offer questions must be answered.'
    }
    return null
  }

  function handleNext() {
    const error = getStepError(currentStep)
    if (error) { setValidationError(error); return }
    setValidationError(null)
    if (currentStep < totalSteps) {
      setDirection(1)
      setCurrentStep(currentStep + 1)
    }
  }

  function handleBack() {
    setValidationError(null)
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep(currentStep - 1)
    }
  }

  async function handleSaveDraft() {
    clearError()
    const ok = await saveDraft()
    if (ok) { setSavedOk(true); setTimeout(() => setSavedOk(false), 2500) }
  }

  async function handleSubmit() {
    const stepsToValidate = isExtendedStage ? [1, 2, 3] : isDealStage ? [1, 2] : [1, 2]
    for (const step of stepsToValidate) {
      const err = getStepError(step)
      if (err) {
        setDirection(step > currentStep ? 1 : -1)
        setCurrentStep(step)
        setValidationError(err)
        return
      }
    }
    setValidationError(null)
    clearError()
    await submit()
  }

  const stageQTitle = lang === 'tr' ? 'Stage Soruları'   : 'Stage Questions'
  const stageQDesc  = lang === 'tr' ? 'Seçilen stage\'e göre değerlendirme sorularını yanıtlayın.' : 'Answer the evaluation questions for the selected stage.'
  const offerQTitle = lang === 'tr' ? 'Teklif Soruları'  : 'Offer Questions'
  const offerQDesc  = lang === 'tr' ? 'Teklif sürecine ait 7 soruyu yanıtlayın (50 puan).' : 'Answer 7 offer process questions (50 pts).'
  const dealQTitle = lang === 'tr' ? 'Deal Soruları'         : 'Deal Questions'
  const dealQDesc  = lang === 'tr' ? 'Deal sürecine ait 4 soruyu yanıtlayın (100 puan).' : 'Answer 4 deal process questions (100 pts).'
  const svQTitle   = lang === 'tr' ? 'İkinci Ziyaret Sorusu' : 'Second Visit Question'
  const svQDesc    = lang === 'tr' ? 'İkinci ziyaret takip sorusunu yanıtlayın (100 puan).' : 'Answer the second visit follow-up question (100 pts).'

  const stepTitles = isExtendedStage
    ? [t.form.step1.title, stageQTitle, offerQTitle, t.form.step6.title]
    : isDealStage
    ? [t.form.step1.title, dealQTitle, t.form.step6.title]
    : isSecondVisitStage
    ? [t.form.step1.title, svQTitle, t.form.step6.title]
    : [t.form.step1.title, stageQTitle, t.form.step6.title]

  const stepDescriptions = isExtendedStage
    ? [t.form.step1.description, stageQDesc, offerQDesc, t.form.step6.description]
    : isDealStage
    ? [t.form.step1.description, dealQDesc, t.form.step6.description]
    : isSecondVisitStage
    ? [t.form.step1.description, svQDesc, t.form.step6.description]
    : [t.form.step1.description, stageQDesc, t.form.step6.description]

  function renderStep() {
    switch (currentStep) {
      case 1: return <StepBasicInfo role={role} evaluatorId={evaluatorId} evaluatorName={evaluatorName} consultants={consultants} teamLeaders={teamLeaders} teams={teams} />
      case 2:
        if (isDealStage)        return <StepDealQuestions />
        if (isSecondVisitStage) return <StepSecondVisitQuestions />
        return <StepStageQuestions />
      case 3: return isExtendedStage ? <StepOfferQuestions /> : <StepActionPlan />
      case 4: return <StepActionPlan />
      default: return null
    }
  }

  const isLastStep = currentStep === totalSteps
  const progress   = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <div className="space-y-3">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Progress track */}
        <div className="h-1.5 bg-gray-100 relative">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#52B788] to-[#1B4332]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          />
        </div>

        <div className="px-4 sm:px-5 pt-3.5 sm:pt-4 pb-4 sm:pb-5 flex items-start gap-3 sm:gap-4">

          {/* Left: step dots + title + description */}
          <div className="flex-1 min-w-0">
            {/* Step dots */}
            <div className="flex items-center gap-1 sm:gap-1.5 mb-2.5 sm:mb-3 flex-wrap">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
                <div
                  key={step}
                  className={`transition-all duration-300 flex items-center justify-center font-bold rounded-full flex-shrink-0 ${
                    step < currentStep
                      ? 'w-5 h-5 sm:w-6 sm:h-6 bg-[#52B788] text-white text-[9px] sm:text-[10px]'
                      : step === currentStep
                      ? 'w-6 h-6 sm:w-7 sm:h-7 bg-[#1B4332] text-white text-[10px] sm:text-xs ring-4 ring-[#1B4332]/10'
                      : 'w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 text-gray-400 text-[9px] sm:text-[10px]'
                  }`}
                >
                  {step < currentStep ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : step}
                </div>
              ))}
              <span className="ml-1 text-xs text-gray-400 font-medium">
                {currentStep}/{totalSteps}
              </span>
            </div>

            {/* Animated step title */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`title-${currentStep}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-base sm:text-xl font-bold text-gray-900 leading-tight">
                  {stepTitles[currentStep - 1]}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 hidden sm:block leading-relaxed">
                  {stepDescriptions[currentStep - 1]}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: stage score */}
          <motion.div
            key={stageScore}
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            className="flex-shrink-0 min-w-[68px] sm:min-w-[84px] text-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-transparent bg-[#1B4332]/8"
          >
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-0.5 sm:mb-1">
              {t.form.liveScore}
            </div>
            <div className="text-2xl sm:text-3xl font-black leading-none tabular-nums text-[#1B4332]">
              {stageScore}
            </div>
            <div className="text-[10px] font-semibold mt-1 sm:mt-1.5 text-[#1B4332]/60">
              / 100
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Step content ────────────────────────────────────────── */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 380, damping: 32, mass: 0.85 },
              opacity: { duration: 0.18 },
              filter: { duration: 0.22 },
            }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Banners ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {(validationError || saveError) && (
          <motion.div
            key="err"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {validationError ?? saveError}
            </div>
          </motion.div>
        )}
        {savedOk && (
          <motion.div
            key="ok"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 bg-green-50 border border-green-100 rounded-2xl text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {lang === 'tr' ? 'Taslak kaydedildi.' : 'Draft saved.'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom navigation ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-3">
        <button
          onClick={handleBack}
          disabled={currentStep === 1 || isSaving}
          className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-900 border border-transparent hover:border-gray-200 hover:bg-gray-50 rounded-xl transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">{t.common.back}</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium text-[#1B4332] hover:bg-[#1B4332]/8 rounded-xl transition-all"
          >
            <Save className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">
              {isSaving ? (lang === 'tr' ? 'Kaydediliyor…' : 'Saving…') : t.form.saveDraft}
            </span>
          </button>

          {!isLastStep ? (
            <button
              onClick={handleNext}
              disabled={isSaving}
              className="group flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2.5 text-sm font-bold text-white bg-[#1B4332] hover:bg-[#163728] active:scale-[0.97] rounded-xl transition-all shadow-lg shadow-[#1B4332]/20 hover:shadow-xl hover:shadow-[#1B4332]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.common.next}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2.5 text-sm font-bold text-white bg-[#1B4332] hover:bg-[#163728] active:scale-[0.97] rounded-xl transition-all shadow-lg shadow-[#1B4332]/20 hover:shadow-xl hover:shadow-[#1B4332]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">
                {isSaving ? (lang === 'tr' ? 'Gönderiliyor…' : 'Submitting…') : t.form.saveAndApprove}
              </span>
              <span className="sm:hidden">
                {isSaving ? '…' : (lang === 'tr' ? 'Gönder' : 'Submit')}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
