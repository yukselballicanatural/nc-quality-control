'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFormStore } from '@/stores/formStore'
import { calculateFinalScore } from '@/lib/scoring'
import type { ChannelType, CriteriaScore, EvaluationStatus } from '@/types/supabase'
import { EXTENDED_STAGES, SECOND_VISIT_STAGE } from '@/types/supabase'

export function useEvaluation(editingId: string | null = null) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // The id of the record this specific form session is working on.
  // For edit mode this is the existing evaluation id; for a new form it stays
  // null until we insert, then holds the created id so follow-up draft saves
  // update the same row. Crucially this is per-mount, so a fresh new-evaluation
  // form always inserts even if the global store still holds a stale id.
  const createdIdRef = useRef<string | null>(null)

  async function save(status: EvaluationStatus): Promise<string | null> {
    setIsSaving(true)
    setSaveError(null)

    try {
      const supabase = createClient()
      const {
        step1,
        stageAnswers,
        offerAnswers,
        dealAnswers,
        secondVisitAnswers,
        criteriaScores,
        channelChecks,
        criticalErrors,
        isAutoFailed,
        step5,
        step6,
        getRawScore,
        getCriticalErrorCount,
        getStageScore,
        setEvaluationId,
      } = useFormStore.getState()

      const isExtendedStage    = EXTENDED_STAGES.includes(step1.stage as typeof EXTENDED_STAGES[number])
      const isDealStage        = step1.stage === 'deal'
      const isSecondVisitStage = step1.stage === SECOND_VISIT_STAGE

      // Minimum required fields (DB constraints)
      if (
        !step1.consultantId ||
        !step1.evaluatorId ||
        !step1.customerPhone.trim() ||
        step1.channels.length === 0 ||
        !step1.reviewStartDate
      ) {
        setSaveError("Kayıt için Adım 1'deki zorunlu alanları doldurun.")
        return null
      }

      // Stage-based forms use getStageScore(); old criteria forms use getRawScore()
      const rawScore = step1.stage ? getStageScore() : getRawScore()
      const critCount = getCriticalErrorCount()
      const finalScore = calculateFinalScore(rawScore, critCount, isAutoFailed)

      const evalPayload = {
        consultant_id: null,
        agent_id: step1.consultantId || null,
        consultant_name: step1.consultantName || null,
        region: step1.region || null,
        team_leader_name: step1.agentTeamLeaderName || null,
        team_leader_id: step1.teamLeaderId || null,
        team_id: step1.teamId || null,
        evaluator_id: step1.evaluatorId,
        customer_name: step1.customerPhone,
        lead_id: step1.stage || null,
        channel: (step1.channels[0] ?? 'whatsapp') as ChannelType,
        conversation_date: step1.reviewStartDate,
        evaluation_date: step1.controlDate || new Date().toISOString().slice(0, 10),
        conversation_result: 'open' as const,
        general_note: step1.generalNote || null,
        raw_score: rawScore,
        final_score: finalScore,
        critical_error_count: critCount,
        is_auto_failed: isAutoFailed,
        status,
        sales_understood_motivation: step5.understoodMotivation || null,
        sales_eased_decision: step5.easedDecision || null,
        sales_opportunity_used: step5.opportunityUsed || null,
        sales_result_reason: step5.resultReason || null,
        sales_best_behavior: step5.bestBehavior || null,
        sales_risk_behavior: step5.riskBehavior || null,
        dev_strengths: step6.strengths || null,
        dev_areas_to_improve: step6.areasToImprove || null,
        dev_coaching_topic: step6.coachingTopic || null,
        dev_team_leader_comment: step6.teamLeaderComment || null,
        dev_consultant_plan: step6.consultantPlan || null,
        dev_recheck_date: step6.recheckDate || null,
        updated_at: new Date().toISOString(),
        stage_answers:        step1.stage && !isDealStage && !isSecondVisitStage ? stageAnswers as unknown as Record<string, unknown> : null,
        offer_answers:        isExtendedStage ? offerAnswers as unknown as Record<string, unknown> : null,
        deal_answers:         isDealStage ? dealAnswers as unknown as Record<string, unknown> : null,
        second_visit_answers: isSecondVisitStage ? secondVisitAnswers as unknown as Record<string, unknown> : null,
      }

      // Decide insert vs update from the form-session id, NOT the global store,
      // so a stale evaluationId lingering in the store can never turn a brand-new
      // evaluation into an accidental update of a previous record.
      const targetId = editingId ?? createdIdRef.current
      let evalId = targetId

      const wasEditing = Boolean(targetId)

      if (targetId) {
        const { error } = await supabase
          .from('evaluations')
          .update(evalPayload)
          .eq('id', targetId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('evaluations')
          .insert(evalPayload)
          .select('id')
          .single()
        if (error) throw error
        evalId = data.id
        createdIdRef.current = evalId
        setEvaluationId(evalId)
      }

      if (!evalId) throw new Error('Değerlendirme ID alınamadı.')

      // Delete existing child rows, then re-insert fresh
      await Promise.all([
        supabase.from('criteria_scores').delete().eq('evaluation_id', evalId),
        supabase.from('channel_checks').delete().eq('evaluation_id', evalId),
        supabase.from('critical_errors').delete().eq('evaluation_id', evalId),
      ])

      const childInserts: PromiseLike<void>[] = []

      const criteriaRows = Object.values(criteriaScores).map(e => ({
        evaluation_id: evalId!,
        criteria_number: e.criteriaNumber,
        score: String(e.scoreValue) as CriteriaScore,
        score_value: e.scoreValue,
        comment: e.comment || null,
      }))
      if (criteriaRows.length > 0) {
        childInserts.push(
          supabase
            .from('criteria_scores')
            .insert(criteriaRows)
            .then(({ error }) => {
              if (error) throw error
            })
        )
      }

      if (step1.channels.length > 0) {
        const checkRows = step1.channels.flatMap(ch =>
          Object.values(channelChecks).map(c => ({
            evaluation_id: evalId!,
            channel: ch as ChannelType,
            question_number: c.questionNumber,
            answer: c.answer,
          }))
        )
        if (checkRows.length > 0) {
          childInserts.push(
            supabase
              .from('channel_checks')
              .insert(checkRows)
              .then(({ error }) => {
                if (error) throw error
              })
          )
        }
      }

      if (criticalErrors.length > 0) {
        const errorRows = criticalErrors.map(ce => ({
          evaluation_id: evalId!,
          error_type: ce.errorType,
          description: ce.description,
        }))
        childInserts.push(
          supabase
            .from('critical_errors')
            .insert(errorRows)
            .then(({ error }) => {
              if (error) throw error
            })
        )
      }

      await Promise.all(childInserts)

      await fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: wasEditing ? 'evaluation_updated' : 'evaluation_created',
          entityType: 'evaluation',
          entityId: evalId,
          metadata: {
            status,
            score: finalScore,
            consultant_id: step1.consultantId,
          },
        }),
      }).catch(() => null)

      return evalId
    } catch (err) {
      console.error('useEvaluation save error:', err)
      const msg =
        err instanceof Error
          ? err.message
          : (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' && err.message)
            ? err.message
            : 'Kayıt sırasında bir hata oluştu.'
      setSaveError(msg)
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function saveDraft(): Promise<boolean> {
    const id = await save('draft')
    return id !== null
  }

  async function submit(): Promise<void> {
    const id = await save('submitted')
    if (id) {
      createdIdRef.current = null
      useFormStore.getState().resetForm()
      router.push('/evaluations')
      router.refresh()
    }
  }

  function clearError() {
    setSaveError(null)
  }

  return { saveDraft, submit, isSaving, saveError, clearError }
}
