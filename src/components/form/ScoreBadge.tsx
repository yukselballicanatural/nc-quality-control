'use client'

import { getScoreLevel } from '@/lib/scoring'
import type { Language } from '@/types'

interface ScoreBadgeProps {
  score: number
  lang: Language
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function ScoreBadge({ score, lang, size = 'md', showLabel = true }: ScoreBadgeProps) {
  const level = getScoreLevel(score)

  const sizeClasses = {
    sm: 'text-sm px-2 py-0.5 gap-1',
    md: 'text-base px-2.5 py-1 gap-1.5',
    lg: 'text-2xl px-3 py-1.5 gap-2',
  }

  const fontClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
  }

  return (
    <span
      className={`inline-flex items-center rounded-xl font-bold ${level.bgColor} ${level.textColor} ${sizeClasses[size]}`}
    >
      {score}
      {showLabel && (
        <span className={`font-normal opacity-75 ${fontClasses[size]}`}>
          {lang === 'tr' ? level.label : level.labelEn}
        </span>
      )}
    </span>
  )
}
