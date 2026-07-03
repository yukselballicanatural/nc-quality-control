'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Target, Zap, HelpCircle, Star, AlertOctagon } from 'lucide-react'
import { useFormStore } from '@/stores/formStore'
import { useLanguage } from '@/lib/i18n'
import type { FormStep5 } from '@/stores/formStore'

const FIELD_ICONS = [TrendingUp, Target, Zap, HelpCircle, Star, AlertOctagon]

const FIELD_COLORS = [
  'bg-blue-100 text-blue-600',
  'bg-violet-100 text-violet-600',
  'bg-amber-100 text-amber-600',
  'bg-teal-100 text-teal-600',
  'bg-emerald-100 text-emerald-600',
  'bg-rose-100 text-rose-600',
]

export function StepSalesAnalysis() {
  const { lang, t } = useLanguage()
  const { step5, updateStep5 } = useFormStore()

  const fields: Array<{ key: keyof FormStep5; label: string }> = [
    { key: 'understoodMotivation', label: t.form.step5.understoodMotivation },
    { key: 'easedDecision',        label: t.form.step5.easedDecision },
    { key: 'opportunityUsed',      label: t.form.step5.opportunityUsed },
    { key: 'resultReason',         label: t.form.step5.resultReason },
    { key: 'bestBehavior',         label: t.form.step5.bestBehavior },
    { key: 'riskBehavior',         label: t.form.step5.riskBehavior },
  ]

  const filledCount = fields.filter(f => step5[f.key]?.trim()).length

  return (
    <div className="space-y-3">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">
              {lang === 'tr' ? 'Satış Analizi' : 'Sales Analysis'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {lang === 'tr' ? 'İsteğe bağlı — doldurulan alanlar kaydedilir' : 'Optional — filled fields are saved'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black tabular-nums text-gray-400 leading-none">{filledCount}</p>
            <p className="text-xs text-gray-400 font-medium">/ {fields.length}</p>
          </div>
        </div>
      </div>

      {/* ── Fields ─────────────────────────────────────────── */}
      {fields.map((field, idx) => {
        const Icon = FIELD_ICONS[idx]
        const colorCls = FIELD_COLORS[idx]
        const value = step5[field.key]
        const hasValue = !!value?.trim()

        return (
          <motion.div
            key={field.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${
              hasValue ? 'border-gray-200' : 'border-gray-100'
            }`}
          >
            {hasValue && <div className="h-0.5 bg-gradient-to-r from-[#52B788] to-[#1B4332]" />}

            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{field.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lang === 'tr' ? 'İsteğe bağlı' : 'Optional'}
                  </p>
                </div>
              </div>

              <textarea
                value={value}
                onChange={e => updateStep5({ [field.key]: e.target.value } as Partial<FormStep5>)}
                placeholder={t.form.step5.textareaPlaceholder}
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15 focus:border-[#1B4332] transition-all resize-none ${
                  hasValue ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'
                }`}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
