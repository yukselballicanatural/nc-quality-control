import type { ScoreLevel } from '@/types'

export function calculateFinalScore(
  rawScore: number,
  criticalErrorCount: number,
  isAutoFailed: boolean
): number {
  if (isAutoFailed) return 0
  if (criticalErrorCount >= 3) return 0
  if (criticalErrorCount === 2) return Math.min(rawScore, 59)
  if (criticalErrorCount === 1) return Math.min(rawScore, 69)
  return rawScore
}

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 90) {
    return {
      label: 'Mükemmel',
      labelEn: 'Excellent',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
    }
  }
  if (score >= 80) {
    return {
      label: 'İyi',
      labelEn: 'Good',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
    }
  }
  if (score >= 70) {
    return {
      label: 'Geliştirilmeli',
      labelEn: 'Needs Improvement',
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
    }
  }
  return {
    label: 'Başarısız',
    labelEn: 'Unsuccessful',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
  }
}

export function isCommentRequired(scoreValue: number): boolean {
  return scoreValue < 10
}

export function getMaxScoreWithErrors(criticalErrorCount: number): number {
  if (criticalErrorCount >= 3) return 0
  if (criticalErrorCount === 2) return 59
  if (criticalErrorCount === 1) return 69
  return 100
}
