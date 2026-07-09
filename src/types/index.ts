export type {
  UserRole,
  ChannelType,
  ConversationResult,
  CriteriaScore,
  CheckAnswer,
  EvaluationStatus,
  CriticalErrorType,
  Profile,
  Team,
  Evaluation,
  CriteriaScoreRow,
  ChannelCheck,
  CriticalError,
} from './supabase'

export interface EvaluationWithRelations {
  id: string
  consultant: { id: string; full_name: string }
  team_leader: { id: string; full_name: string } | null
  team: { id: string; name: string } | null
  evaluator: { id: string; full_name: string }
  customer_name: string
  lead_id: string | null
  channel: import('./supabase').ChannelType
  conversation_date: string
  evaluation_date: string
  conversation_result: import('./supabase').ConversationResult
  general_note: string | null
  raw_score: number
  final_score: number
  critical_error_count: number
  is_auto_failed: boolean
  status: import('./supabase').EvaluationStatus
  criteria_scores: import('./supabase').CriteriaScoreRow[]
  channel_checks: import('./supabase').ChannelCheck[]
  critical_errors: import('./supabase').CriticalError[]
  stage_answers: Record<string, unknown> | null
  offer_answers: Record<string, unknown> | null
  deal_answers: Record<string, unknown> | null
  second_visit_answers: Record<string, unknown> | null
  sales_understood_motivation: string | null
  sales_eased_decision: string | null
  sales_opportunity_used: string | null
  sales_result_reason: string | null
  sales_best_behavior: string | null
  sales_risk_behavior: string | null
  dev_strengths: string | null
  dev_areas_to_improve: string | null
  dev_coaching_topic: string | null
  dev_team_leader_comment: string | null
  dev_consultant_plan: string | null
  dev_recheck_date: string | null
  created_at: string
  updated_at: string
}

export interface ScoreLevel {
  label: string
  labelEn: string
  color: 'green' | 'blue' | 'yellow' | 'orange' | 'red'
  bgColor: string
  textColor: string
}

export interface CriteriaScoreEntry {
  criteriaNumber: number
  scoreValue: number
  comment: string
}

export interface ChannelCheckEntry {
  questionNumber: number
  answer: import('./supabase').CheckAnswer
}

export interface CriticalErrorEntry {
  errorType: import('./supabase').CriticalErrorType
  description: string
}

export type Language = 'tr' | 'en'

export interface EvaluationListItem {
  id: string
  customer_name: string
  channel: import('./supabase').ChannelType
  conversation_date: string
  evaluation_date: string
  conversation_result: import('./supabase').ConversationResult
  final_score: number
  is_auto_failed: boolean
  status: import('./supabase').EvaluationStatus
  consultant: { id: string; full_name: string } | null
  evaluator: { id: string; full_name: string | null; email?: string | null } | null
  channel_checks?: Pick<import('./supabase').ChannelCheck, 'channel'>[]
}

export interface ConsultantPerfRow {
  consultantId: string
  consultantName: string
  evaluationCount: number
  avgScore: number
  criticalErrorCount: number
  wonRate: number
}

export interface ChannelCompRow {
  channel: import('./supabase').ChannelType
  evaluationCount: number
  avgScore: number
  criticalErrorCount: number
}

export interface CriticalErrorRow {
  errorType: import('./supabase').CriticalErrorType
  totalCount: number
  consultants: { name: string; count: number }[]
}

export interface SalesOutcomeRow {
  result: import('./supabase').ConversationResult
  evaluationCount: number
  avgScore: number
}
