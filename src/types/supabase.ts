export type UserRole = 'quality_team' | 'team_leader' | 'manager' | 'consultant'
export type ChannelType = 'whatsapp' | 'call'
export type ConversationResult = 'won' | 'open' | 'follow_up' | 'lost' | 'no_answer'
export type SalesStage =
  | 'fresh_lead'
  | 'new_sales_opportunities'
  | 'warm_lead'
  | 'offer_created'
  | 'offer_shared'
  | 'deal'
  | 'platform_agents'
  | 'second_visit'

export const EARLY_STAGES: SalesStage[] = ['fresh_lead', 'new_sales_opportunities', 'warm_lead']
export const EXTENDED_STAGES: SalesStage[] = ['offer_created', 'offer_shared', 'platform_agents']
export const SECOND_VISIT_STAGE: SalesStage  = 'second_visit'

export type ResponseTimeAnswer = '<15' | '=15' | '>15' | ''
export type DeliveryTimingAnswer = '<24h' | '>24h' | ''
export type FollowUpCountAnswer = 0 | 1 | 2 | 3 | -1
export type Score4Answer = 1 | 5 | 7 | 10 | -1   // -1 = seçilmedi
export type YesNoAnswer = 'yes' | 'no' | ''
export type Score10Answer = 0 | 5 | 7 | 10 | -1   // -1 = seçilmedi
export type CriteriaScore = '10' | '7' | '5' | '0'
export type CheckAnswer = 'successful' | 'partially' | 'unsuccessful' | 'not_applicable'
export type EvaluationStatus = 'draft' | 'submitted' | 'approved' | 'rejected'
export type CriticalErrorType =
  | 'wrong_price'
  | 'wrong_package'
  | 'result_guarantee'
  | 'medical_misleading'
  | 'rude_behavior'
  | 'unanswered_question'
  | 'wrong_payment_guide'
  | 'wrong_appointment'
  | 'no_crm_record'
  | 'missed_followup'

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: UserRole
          team_id: string | null
          team_leader_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role?: UserRole
          team_id?: string | null
          team_leader_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: UserRole
          team_id?: string | null
          team_leader_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profiles_team_leader_id_fkey'
            columns: ['team_leader_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      evaluations: {
        Row: {
          id: string
          consultant_id: string
          team_leader_id: string | null
          team_id: string | null
          evaluator_id: string
          customer_name: string
          lead_id: string | null
          channel: ChannelType
          conversation_date: string
          evaluation_date: string
          conversation_result: ConversationResult
          general_note: string | null
          raw_score: number
          final_score: number
          critical_error_count: number
          is_auto_failed: boolean
          status: EvaluationStatus
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
        Insert: {
          id?: string
          consultant_id: string
          team_leader_id?: string | null
          team_id?: string | null
          evaluator_id: string
          customer_name: string
          lead_id?: string | null
          channel: ChannelType
          conversation_date: string
          evaluation_date?: string
          conversation_result: ConversationResult
          general_note?: string | null
          raw_score?: number
          final_score?: number
          critical_error_count?: number
          is_auto_failed?: boolean
          status?: EvaluationStatus
          sales_understood_motivation?: string | null
          sales_eased_decision?: string | null
          sales_opportunity_used?: string | null
          sales_result_reason?: string | null
          sales_best_behavior?: string | null
          sales_risk_behavior?: string | null
          dev_strengths?: string | null
          dev_areas_to_improve?: string | null
          dev_coaching_topic?: string | null
          dev_team_leader_comment?: string | null
          dev_consultant_plan?: string | null
          dev_recheck_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          consultant_id?: string
          team_leader_id?: string | null
          team_id?: string | null
          evaluator_id?: string
          customer_name?: string
          lead_id?: string | null
          channel?: ChannelType
          conversation_date?: string
          evaluation_date?: string
          conversation_result?: ConversationResult
          general_note?: string | null
          raw_score?: number
          final_score?: number
          critical_error_count?: number
          is_auto_failed?: boolean
          status?: EvaluationStatus
          sales_understood_motivation?: string | null
          sales_eased_decision?: string | null
          sales_opportunity_used?: string | null
          sales_result_reason?: string | null
          sales_best_behavior?: string | null
          sales_risk_behavior?: string | null
          dev_strengths?: string | null
          dev_areas_to_improve?: string | null
          dev_coaching_topic?: string | null
          dev_team_leader_comment?: string | null
          dev_consultant_plan?: string | null
          dev_recheck_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'evaluations_consultant_id_fkey'
            columns: ['consultant_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'evaluations_team_leader_id_fkey'
            columns: ['team_leader_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'evaluations_team_id_fkey'
            columns: ['team_id']
            isOneToOne: false
            referencedRelation: 'teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'evaluations_evaluator_id_fkey'
            columns: ['evaluator_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      criteria_scores: {
        Row: {
          id: string
          evaluation_id: string
          criteria_number: number
          score: CriteriaScore
          score_value: number
          comment: string | null
        }
        Insert: {
          id?: string
          evaluation_id: string
          criteria_number: number
          score: CriteriaScore
          score_value: number
          comment?: string | null
        }
        Update: {
          id?: string
          evaluation_id?: string
          criteria_number?: number
          score?: CriteriaScore
          score_value?: number
          comment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'criteria_scores_evaluation_id_fkey'
            columns: ['evaluation_id']
            isOneToOne: false
            referencedRelation: 'evaluations'
            referencedColumns: ['id']
          },
        ]
      }
      channel_checks: {
        Row: {
          id: string
          evaluation_id: string
          channel: ChannelType
          question_number: number
          answer: CheckAnswer
        }
        Insert: {
          id?: string
          evaluation_id: string
          channel: ChannelType
          question_number: number
          answer: CheckAnswer
        }
        Update: {
          id?: string
          evaluation_id?: string
          channel?: ChannelType
          question_number?: number
          answer?: CheckAnswer
        }
        Relationships: [
          {
            foreignKeyName: 'channel_checks_evaluation_id_fkey'
            columns: ['evaluation_id']
            isOneToOne: false
            referencedRelation: 'evaluations'
            referencedColumns: ['id']
          },
        ]
      }
      critical_errors: {
        Row: {
          id: string
          evaluation_id: string
          error_type: CriticalErrorType
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          evaluation_id: string
          error_type: CriticalErrorType
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          evaluation_id?: string
          error_type?: CriticalErrorType
          description?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'critical_errors_evaluation_id_fkey'
            columns: ['evaluation_id']
            isOneToOne: false
            referencedRelation: 'evaluations'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      channel_type: ChannelType
      conversation_result: ConversationResult
      criteria_score: CriteriaScore
      check_answer: CheckAnswer
      evaluation_status: EvaluationStatus
      critical_error_type: CriticalErrorType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type Evaluation = Database['public']['Tables']['evaluations']['Row']
export type CriteriaScoreRow = Database['public']['Tables']['criteria_scores']['Row']
export type ChannelCheck = Database['public']['Tables']['channel_checks']['Row']
export type CriticalError = Database['public']['Tables']['critical_errors']['Row']
