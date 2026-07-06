import { create } from 'zustand'
import { calculateFinalScore } from '@/lib/scoring'
import type {
  ChannelType,
  SalesStage,
  CheckAnswer,
  CriticalErrorType,
  ResponseTimeAnswer,
  Score4Answer,
  YesNoAnswer,
  Score10Answer,
  DeliveryTimingAnswer,
  FollowUpCountAnswer,
} from '@/types/supabase'
import { EXTENDED_STAGES, SECOND_VISIT_STAGE } from '@/types/supabase'
import type { EvaluationWithRelations } from '@/types'

// ─── Step state types ────────────────────────────────────────────

export interface FormStep1 {
  consultantId: string
  teamLeaderId: string
  teamId: string
  evaluatorId: string
  customerPhone: string
  channels: ChannelType[]
  reviewStartDate: string
  reviewEndDate: string
  controlDate: string
  stage: SalesStage | ''
  generalNote: string
}

export interface FormCriteriaEntry {
  criteriaNumber: number
  scoreValue: number // 10 | 7 | 5 | 0
  comment: string
}

export interface FormChannelCheck {
  questionNumber: number
  answer: CheckAnswer
}

export interface FormCriticalError {
  errorType: CriticalErrorType
  description: string
}

export interface FormStageAnswers {
  q1ResponseTime: ResponseTimeAnswer
  q2ProfessionalIntro: Score4Answer
  q3NeedsAssessment: Score4Answer
  q4BuildTrust: Score4Answer
  q5InfoPhotoCollection: Score4Answer
  q6ProfessionalComm: Score4Answer
  q7CrmDocumentation: YesNoAnswer
  q8ConfirmNextSteps: YesNoAnswer
  q9NoPriceDiscussion: YesNoAnswer
  q10FollowUp: Score10Answer
}

export interface FormStep5 {
  understoodMotivation: string
  easedDecision: string
  opportunityUsed: string
  resultReason: string
  bestBehavior: string
  riskBehavior: string
}

export interface FormSecondVisitAnswers {
  q1ProfessionalFollowUp: 0 | 1 | 2 | 3 | -1
}

export interface FormDealAnswers {
  q1CrmUpdated:       'yes' | 'no' | ''
  q2PriceConfirmed:   'yes' | 'no' | ''
  q3TravelConfirmed:  'yes' | 'no' | ''
  q4FollowUp:         0 | 1 | 2 | 3 | -1
}

export interface FormOfferAnswers {
  q11TreatmentPlanSent: 'yes' | 'no' | ''
  q12DeliveryTiming: DeliveryTimingAnswer
  q13ProfessionalPDF: 'yes' | 'no' | ''
  q14ClearExplanation: 'yes' | 'no' | ''
  q15BeforeAfterPhotos: 'yes' | 'no' | ''
  q16ConciseCommunication: 'yes' | 'no' | ''
  q17FollowUpWeek: FollowUpCountAnswer
}

export interface FormStep6 {
  strengths: string
  areasToImprove: string
  coachingTopic: string
  teamLeaderComment: string
  consultantPlan: string
  recheckDate: string
}

// ─── Store interface ─────────────────────────────────────────────

export interface FormStore {
  // Edit mode (null = new form)
  evaluationId: string | null

  // Navigation
  currentStep: number

  // Steps
  step1: FormStep1
  stageAnswers: FormStageAnswers
  offerAnswers: FormOfferAnswers
  dealAnswers: FormDealAnswers
  secondVisitAnswers: FormSecondVisitAnswers
  criteriaScores: Record<number, FormCriteriaEntry> // key = criteriaNumber 1-10
  channelChecks: Record<number, FormChannelCheck>   // key = questionNumber 1-10
  criticalErrors: FormCriticalError[]
  isAutoFailed: boolean
  step5: FormStep5
  step6: FormStep6

  // Computed selectors
  getRawScore: () => number
  getCriticalErrorCount: () => number
  getFinalScore: () => number
  isCriteriaComplete: () => boolean
  isChannelChecksComplete: () => boolean
  hasCriticalError: (errorType: CriticalErrorType) => boolean

  // Navigation
  setCurrentStep: (step: number) => void

  // Step 1
  updateStep1: (data: Partial<FormStep1>) => void

  // Step 2 — Criteria
  setCriteriaScore: (criteriaNumber: number, scoreValue: number) => void
  setCriteriaComment: (criteriaNumber: number, comment: string) => void

  // Step 3 — Channel checks
  setChannelAnswer: (questionNumber: number, answer: CheckAnswer) => void

  // Step 4 — Critical errors
  toggleCriticalError: (errorType: CriticalErrorType) => void
  setCriticalErrorDescription: (errorType: CriticalErrorType, description: string) => void
  setAutoFailed: (value: boolean) => void

  // Stage questions
  updateStageAnswers: (data: Partial<FormStageAnswers>) => void
  isStageQuestionsComplete: () => boolean
  getStageScore: () => number

  // Offer questions (extended stages)
  updateOfferAnswers: (data: Partial<FormOfferAnswers>) => void
  isOfferQuestionsComplete: () => boolean
  getOfferScore: () => number

  // Deal questions
  updateDealAnswers: (data: Partial<FormDealAnswers>) => void
  isDealQuestionsComplete: () => boolean
  getDealScore: () => number

  // Second Visit questions
  updateSecondVisitAnswers: (data: Partial<FormSecondVisitAnswers>) => void
  isSecondVisitQuestionsComplete: () => boolean
  getSecondVisitScore: () => number

  // Step 5 — Sales analysis
  updateStep5: (data: Partial<FormStep5>) => void

  // Step 6 — Development plan
  updateStep6: (data: Partial<FormStep6>) => void

  // Lifecycle
  setEvaluationId: (id: string | null) => void
  initFromEvaluation: (evaluation: EvaluationWithRelations) => void
  resetForm: () => void
}

// ─── Initial state factories ─────────────────────────────────────

function makeStep1(): FormStep1 {
  const today = new Date().toISOString().split('T')[0]
  return {
    consultantId: '',
    teamLeaderId: '',
    teamId: '',
    evaluatorId: '',
    customerPhone: '',
    channels: [],
    reviewStartDate: '',
    reviewEndDate: '',
    controlDate: today,
    stage: '',
    generalNote: '',
  }
}

const EMPTY_STAGE_ANSWERS: FormStageAnswers = {
  q1ResponseTime: '',
  q2ProfessionalIntro: -1,
  q3NeedsAssessment: -1,
  q4BuildTrust: -1,
  q5InfoPhotoCollection: -1,
  q6ProfessionalComm: -1,
  q7CrmDocumentation: '',
  q8ConfirmNextSteps: '',
  q9NoPriceDiscussion: '',
  q10FollowUp: -1,
}

const EMPTY_SECOND_VISIT_ANSWERS: FormSecondVisitAnswers = {
  q1ProfessionalFollowUp: -1,
}

const EMPTY_DEAL_ANSWERS: FormDealAnswers = {
  q1CrmUpdated:     '',
  q2PriceConfirmed: '',
  q3TravelConfirmed:'',
  q4FollowUp:       -1,
}

const EMPTY_OFFER_ANSWERS: FormOfferAnswers = {
  q11TreatmentPlanSent: '',
  q12DeliveryTiming: '',
  q13ProfessionalPDF: '',
  q14ClearExplanation: '',
  q15BeforeAfterPhotos: '',
  q16ConciseCommunication: '',
  q17FollowUpWeek: -1,
}

const EMPTY_STEP5: FormStep5 = {
  understoodMotivation: '',
  easedDecision: '',
  opportunityUsed: '',
  resultReason: '',
  bestBehavior: '',
  riskBehavior: '',
}

const EMPTY_STEP6: FormStep6 = {
  strengths: '',
  areasToImprove: '',
  coachingTopic: '',
  teamLeaderComment: '',
  consultantPlan: '',
  recheckDate: '',
}

// ─── Store ───────────────────────────────────────────────────────

export const useFormStore = create<FormStore>()((set, get) => ({
  evaluationId: null,
  currentStep: 1,
  step1: makeStep1(),
  stageAnswers: { ...EMPTY_STAGE_ANSWERS },
  offerAnswers:        { ...EMPTY_OFFER_ANSWERS },
  dealAnswers:         { ...EMPTY_DEAL_ANSWERS },
  secondVisitAnswers:  { ...EMPTY_SECOND_VISIT_ANSWERS },
  criteriaScores: {},
  channelChecks: {},
  criticalErrors: [],
  isAutoFailed: false,
  step5: { ...EMPTY_STEP5 },
  step6: { ...EMPTY_STEP6 },

  // ── Computed selectors ──────────────────────────────────────────

  getRawScore: () =>
    Object.values(get().criteriaScores).reduce((sum, e) => sum + e.scoreValue, 0),

  getCriticalErrorCount: () => get().criticalErrors.length,

  getFinalScore: () => {
    const { isAutoFailed } = get()
    const rawScore = get().getRawScore()
    const critCount = get().getCriticalErrorCount()
    return calculateFinalScore(rawScore, critCount, isAutoFailed)
  },

  isCriteriaComplete: () => Object.keys(get().criteriaScores).length === 10,

  isChannelChecksComplete: () => Object.keys(get().channelChecks).length === 10,

  hasCriticalError: (errorType) =>
    get().criticalErrors.some(e => e.errorType === errorType),

  // ── Navigation ──────────────────────────────────────────────────

  setCurrentStep: (step) => set({ currentStep: step }),

  // ── Step 1 ──────────────────────────────────────────────────────

  updateStep1: (data) =>
    set(state => ({ step1: { ...state.step1, ...data } })),

  // ── Stage questions ─────────────────────────────────────────────

  updateStageAnswers: (data) =>
    set(state => ({ stageAnswers: { ...state.stageAnswers, ...data } })),

  isStageQuestionsComplete: () => {
    const { stageAnswers } = get()
    return (
      stageAnswers.q1ResponseTime !== '' &&
      stageAnswers.q2ProfessionalIntro !== -1 &&
      stageAnswers.q3NeedsAssessment !== -1 &&
      stageAnswers.q4BuildTrust !== -1 &&
      stageAnswers.q5InfoPhotoCollection !== -1 &&
      stageAnswers.q6ProfessionalComm !== -1 &&
      stageAnswers.q7CrmDocumentation !== '' &&
      stageAnswers.q8ConfirmNextSteps !== '' &&
      stageAnswers.q9NoPriceDiscussion !== '' &&
      stageAnswers.q10FollowUp !== -1
    )
  },

  getStageScore: () => {
    const { stageAnswers, offerAnswers, dealAnswers, secondVisitAnswers, step1 } = get()

    // Second Visit: tek soru, 100 puan
    if (step1.stage === SECOND_VISIT_STAGE) {
      const v = secondVisitAnswers.q1ProfessionalFollowUp
      return v === 3 ? 100 : v === 2 ? 60 : v === 1 ? 25 : 0
    }

    // Deal stage: tamamen farklı 4 soru
    if (step1.stage === 'deal') {
      const d1 = dealAnswers.q1CrmUpdated     === 'yes' ? 25 : 0
      const d2 = dealAnswers.q2PriceConfirmed === 'yes' ? 25 : 0
      const d3 = dealAnswers.q3TravelConfirmed=== 'yes' ? 25 : 0
      const d4 = dealAnswers.q4FollowUp === 3 ? 25 : dealAnswers.q4FollowUp === 2 ? 15 : dealAnswers.q4FollowUp === 1 ? 8 : 0
      return d1 + d2 + d3 + d4
    }

    const q1  = stageAnswers.q1ResponseTime === '<15' ? 10 : stageAnswers.q1ResponseTime === '=15' ? 5 : 0
    const q2  = stageAnswers.q2ProfessionalIntro   === -1 ? 0 : stageAnswers.q2ProfessionalIntro
    const q3  = stageAnswers.q3NeedsAssessment     === -1 ? 0 : stageAnswers.q3NeedsAssessment
    const q4  = stageAnswers.q4BuildTrust          === -1 ? 0 : stageAnswers.q4BuildTrust
    const q5  = stageAnswers.q5InfoPhotoCollection === -1 ? 0 : stageAnswers.q5InfoPhotoCollection
    const q6  = stageAnswers.q6ProfessionalComm    === -1 ? 0 : stageAnswers.q6ProfessionalComm
    const q7  = stageAnswers.q7CrmDocumentation    === 'yes' ? 10 : 0
    const q8  = stageAnswers.q8ConfirmNextSteps    === 'yes' ? 10 : 0
    const q9  = stageAnswers.q9NoPriceDiscussion   === 'yes' ? 10 : 0
    const q10 = stageAnswers.q10FollowUp === -1 ? 0 : stageAnswers.q10FollowUp
    const base = q1 + q2 + q3 + q4 + q5 + q6 + q7 + q8 + q9 + q10

    const isExtended = EXTENDED_STAGES.includes(step1.stage as typeof EXTENDED_STAGES[number])
    if (!isExtended) return base

    const part1 = Math.round(base / 2)
    const q11 = offerAnswers.q11TreatmentPlanSent    === 'yes'  ? 10 : 0
    const q12 = offerAnswers.q12DeliveryTiming       === '<24h' ? 10 : 0
    const q13 = offerAnswers.q13ProfessionalPDF      === 'yes'  ? 10 : 0
    const q14 = offerAnswers.q14ClearExplanation     === 'yes'  ?  5 : 0
    const q15 = offerAnswers.q15BeforeAfterPhotos    === 'yes'  ?  5 : 0
    const q16 = offerAnswers.q16ConciseCommunication === 'yes'  ?  5 : 0
    const q17 = offerAnswers.q17FollowUpWeek === 3 ? 5 : offerAnswers.q17FollowUpWeek === 2 ? 3 : offerAnswers.q17FollowUpWeek === 1 ? 2 : 0
    return part1 + q11 + q12 + q13 + q14 + q15 + q16 + q17
  },

  getOfferScore: () => {
    const { offerAnswers } = get()
    const q11 = offerAnswers.q11TreatmentPlanSent    === 'yes'  ? 10 : 0
    const q12 = offerAnswers.q12DeliveryTiming       === '<24h' ? 10 : 0
    const q13 = offerAnswers.q13ProfessionalPDF      === 'yes'  ? 10 : 0
    const q14 = offerAnswers.q14ClearExplanation     === 'yes'  ?  5 : 0
    const q15 = offerAnswers.q15BeforeAfterPhotos    === 'yes'  ?  5 : 0
    const q16 = offerAnswers.q16ConciseCommunication === 'yes'  ?  5 : 0
    const q17 = offerAnswers.q17FollowUpWeek === 3 ? 5 : offerAnswers.q17FollowUpWeek === 2 ? 3 : offerAnswers.q17FollowUpWeek === 1 ? 2 : 0
    return q11 + q12 + q13 + q14 + q15 + q16 + q17
  },

  // ── Deal questions ───────────────────────────────────────────────

  updateDealAnswers: (data) =>
    set(state => ({ dealAnswers: { ...state.dealAnswers, ...data } })),

  isDealQuestionsComplete: () => {
    const { dealAnswers } = get()
    return (
      dealAnswers.q1CrmUpdated      !== '' &&
      dealAnswers.q2PriceConfirmed  !== '' &&
      dealAnswers.q3TravelConfirmed !== '' &&
      dealAnswers.q4FollowUp        !== -1
    )
  },

  getDealScore: () => {
    const { dealAnswers } = get()
    const d1 = dealAnswers.q1CrmUpdated     === 'yes' ? 25 : 0
    const d2 = dealAnswers.q2PriceConfirmed === 'yes' ? 25 : 0
    const d3 = dealAnswers.q3TravelConfirmed=== 'yes' ? 25 : 0
    const d4 = dealAnswers.q4FollowUp === 3 ? 25 : dealAnswers.q4FollowUp === 2 ? 15 : dealAnswers.q4FollowUp === 1 ? 8 : 0
    return d1 + d2 + d3 + d4
  },

  // ── Second Visit questions ───────────────────────────────────────

  updateSecondVisitAnswers: (data) =>
    set(state => ({ secondVisitAnswers: { ...state.secondVisitAnswers, ...data } })),

  isSecondVisitQuestionsComplete: () => get().secondVisitAnswers.q1ProfessionalFollowUp !== -1,

  getSecondVisitScore: () => {
    const v = get().secondVisitAnswers.q1ProfessionalFollowUp
    return v === 3 ? 100 : v === 2 ? 60 : v === 1 ? 25 : 0
  },

  // ── Offer questions ─────────────────────────────────────────────

  updateOfferAnswers: (data) =>
    set(state => ({ offerAnswers: { ...state.offerAnswers, ...data } })),

  isOfferQuestionsComplete: () => {
    const { offerAnswers } = get()
    return (
      offerAnswers.q11TreatmentPlanSent    !== '' &&
      offerAnswers.q12DeliveryTiming       !== '' &&
      offerAnswers.q13ProfessionalPDF      !== '' &&
      offerAnswers.q14ClearExplanation     !== '' &&
      offerAnswers.q15BeforeAfterPhotos    !== '' &&
      offerAnswers.q16ConciseCommunication !== '' &&
      offerAnswers.q17FollowUpWeek         !== -1
    )
  },

  // ── Step 2 — Criteria ───────────────────────────────────────────

  setCriteriaScore: (criteriaNumber, scoreValue) =>
    set(state => ({
      criteriaScores: {
        ...state.criteriaScores,
        [criteriaNumber]: {
          criteriaNumber,
          scoreValue,
          comment: state.criteriaScores[criteriaNumber]?.comment ?? '',
        },
      },
    })),

  setCriteriaComment: (criteriaNumber, comment) =>
    set(state => {
      const existing = state.criteriaScores[criteriaNumber]
      return {
        criteriaScores: {
          ...state.criteriaScores,
          [criteriaNumber]: existing
            ? { ...existing, comment }
            : { criteriaNumber, scoreValue: 10, comment },
        },
      }
    }),

  // ── Step 3 — Channel checks ─────────────────────────────────────

  setChannelAnswer: (questionNumber, answer) =>
    set(state => ({
      channelChecks: {
        ...state.channelChecks,
        [questionNumber]: { questionNumber, answer },
      },
    })),

  // ── Step 4 — Critical errors ────────────────────────────────────

  toggleCriticalError: (errorType) =>
    set(state => {
      const exists = state.criticalErrors.some(e => e.errorType === errorType)
      return {
        criticalErrors: exists
          ? state.criticalErrors.filter(e => e.errorType !== errorType)
          : [...state.criticalErrors, { errorType, description: '' }],
      }
    }),

  setCriticalErrorDescription: (errorType, description) =>
    set(state => ({
      criticalErrors: state.criticalErrors.map(e =>
        e.errorType === errorType ? { ...e, description } : e
      ),
    })),

  setAutoFailed: (value) => set({ isAutoFailed: value }),

  // ── Step 5 — Sales analysis ─────────────────────────────────────

  updateStep5: (data) =>
    set(state => ({ step5: { ...state.step5, ...data } })),

  // ── Step 6 — Development plan ───────────────────────────────────

  updateStep6: (data) =>
    set(state => ({ step6: { ...state.step6, ...data } })),

  // ── Lifecycle ───────────────────────────────────────────────────

  setEvaluationId: (id) => set({ evaluationId: id }),

  initFromEvaluation: (ev) => {
    const criteriaScores: Record<number, FormCriteriaEntry> = {}
    ev.criteria_scores.forEach(cs => {
      criteriaScores[cs.criteria_number] = {
        criteriaNumber: cs.criteria_number,
        scoreValue: cs.score_value,
        comment: cs.comment ?? '',
      }
    })

    const channelChecks: Record<number, FormChannelCheck> = {}
    ev.channel_checks.forEach(cc => {
      channelChecks[cc.question_number] = {
        questionNumber: cc.question_number,
        answer: cc.answer,
      }
    })

    const criticalErrors: FormCriticalError[] = ev.critical_errors.map(ce => ({
      errorType: ce.error_type,
      description: ce.description,
    }))

    set({
      evaluationId: ev.id,
      currentStep: 1,
      step1: {
        consultantId: ev.consultant.id,
        teamLeaderId: ev.team_leader?.id ?? '',
        teamId: ev.team?.id ?? '',
        evaluatorId: ev.evaluator.id,
        customerPhone: ev.customer_name ?? '',
        channels: ev.channel ? [ev.channel] : [],
        reviewStartDate: ev.conversation_date ?? '',
        reviewEndDate: '',
        controlDate: ev.evaluation_date ?? '',
        stage: (ev.lead_id ?? '') as SalesStage | '',
        generalNote: ev.general_note ?? '',
      },
      criteriaScores,
      channelChecks,
      criticalErrors,
      isAutoFailed: ev.is_auto_failed,
      step5: {
        understoodMotivation: ev.sales_understood_motivation ?? '',
        easedDecision: ev.sales_eased_decision ?? '',
        opportunityUsed: ev.sales_opportunity_used ?? '',
        resultReason: ev.sales_result_reason ?? '',
        bestBehavior: ev.sales_best_behavior ?? '',
        riskBehavior: ev.sales_risk_behavior ?? '',
      },
      step6: {
        strengths: ev.dev_strengths ?? '',
        areasToImprove: ev.dev_areas_to_improve ?? '',
        coachingTopic: ev.dev_coaching_topic ?? '',
        teamLeaderComment: ev.dev_team_leader_comment ?? '',
        consultantPlan: ev.dev_consultant_plan ?? '',
        recheckDate: ev.dev_recheck_date ?? '',
      },
    })
  },

  resetForm: () =>
    set({
      evaluationId: null,
      currentStep: 1,
      step1: makeStep1(),
      stageAnswers:       { ...EMPTY_STAGE_ANSWERS },
      offerAnswers:       { ...EMPTY_OFFER_ANSWERS },
      dealAnswers:        { ...EMPTY_DEAL_ANSWERS },
      secondVisitAnswers: { ...EMPTY_SECOND_VISIT_ANSWERS },
      criteriaScores: {},
      channelChecks: {},
      criticalErrors: [],
      isAutoFailed: false,
      step5: { ...EMPTY_STEP5 },
      step6: { ...EMPTY_STEP6 },
    }),
}))
