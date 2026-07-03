'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Ban, ShieldAlert } from 'lucide-react'
import { useFormStore } from '@/stores/formStore'
import { useLanguage } from '@/lib/i18n'
import { CRITICAL_ERROR_LABELS } from '@/lib/constants'
import { getMaxScoreWithErrors } from '@/lib/scoring'
import type { CriticalErrorType } from '@/types/supabase'

const ERROR_TYPES = Object.keys(CRITICAL_ERROR_LABELS) as CriticalErrorType[]

export function StepCriticalErrors() {
  const { lang, t } = useLanguage()
  const {
    criticalErrors,
    isAutoFailed,
    getCriticalErrorCount,
    hasCriticalError,
    toggleCriticalError,
    setCriticalErrorDescription,
    setAutoFailed,
  } = useFormStore()

  const count = getCriticalErrorCount()
  const step4 = t.form.step4

  return (
    <div className="space-y-2.5">

      {/* Auto-fail toggle */}
      <div
        className={`bg-white rounded-2xl border shadow-sm px-5 py-4 flex items-center gap-4 transition-all duration-300 ${
          isAutoFailed ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
          isAutoFailed ? 'bg-red-100' : 'bg-gray-100'
        }`}>
          <Ban className={`w-5 h-5 transition-colors ${isAutoFailed ? 'text-red-500' : 'text-gray-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{step4.autoFail}</p>
          <p className="text-xs text-gray-400 mt-0.5">{step4.autoFailWarning}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isAutoFailed}
          onClick={() => setAutoFailed(!isAutoFailed)}
          className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1 ${
            isAutoFailed ? 'bg-red-500' : 'bg-gray-200'
          }`}
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
            style={{ x: isAutoFailed ? 24 : 0 }}
          />
        </button>
      </div>

      {/* Warning banners */}
      <AnimatePresence mode="wait">
        {!isAutoFailed && count === 1 && (
          <motion.div key="w1" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 bg-yellow-50 border border-yellow-100 rounded-2xl text-sm text-yellow-700 font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{step4.warningOne}
            </div>
          </motion.div>
        )}
        {!isAutoFailed && count === 2 && (
          <motion.div key="w2" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 bg-orange-50 border border-orange-100 rounded-2xl text-sm text-orange-700 font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{step4.warningTwo}
            </div>
          </motion.div>
        )}
        {!isAutoFailed && count >= 3 && (
          <motion.div key="w3" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 font-bold">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />{step4.warningThreeOrMore(count)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error list */}
      <div className="space-y-2">
        {ERROR_TYPES.map((errorType, idx) => {
          const labels = CRITICAL_ERROR_LABELS[errorType]
          const isChecked = hasCriticalError(errorType)
          const entry = criticalErrors.find(e => e.errorType === errorType)
          const errorLabel = lang === 'tr' ? labels.labelTr : labels.labelEn

          return (
            <motion.div
              key={errorType}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${
                isChecked ? 'border-red-200' : 'border-gray-100'
              }`}
            >
              <label className="flex items-center gap-3.5 px-5 py-4 cursor-pointer select-none group">
                {/* Custom checkbox */}
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    isChecked
                      ? 'bg-red-500 border-red-500'
                      : 'border-gray-300 group-hover:border-gray-400'
                  }`}
                >
                  {isChecked && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </motion.div>}
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCriticalError(errorType)}
                  className="sr-only"
                />
                <span className={`text-sm font-medium transition-colors ${isChecked ? 'text-red-700' : 'text-gray-800'}`}>
                  {errorLabel}
                </span>
              </label>

              <AnimatePresence>
                {isChecked && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4">
                      <textarea
                        value={entry?.description ?? ''}
                        onChange={e => setCriticalErrorDescription(errorType, e.target.value)}
                        placeholder={step4.errorDescriptionPlaceholder}
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50/40 text-xs text-gray-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all resize-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Footer summary */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="bg-gray-50 rounded-2xl px-5 py-3.5 flex items-center justify-between"
          >
            <span className="text-sm text-gray-500">{step4.selectedErrors(count)}</span>
            {!isAutoFailed && (
              <span className="text-sm font-bold text-gray-700">
                {step4.maxScore(getMaxScoreWithErrors(count))}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
