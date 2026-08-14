'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, parseISO, isValid,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths,
  setMonth, setYear,
  isSameDay, isSameMonth, isToday,
} from 'date-fns'
import { tr, enUS, it } from 'date-fns/locale'
import { useLanguage } from '@/lib/i18n'
import { textFor } from '@/lib/localization'

interface DatePickerProps {
  value: string // 'yyyy-MM-dd'
  onChange: (value: string) => void
  placeholder?: string
  minDate?: string // 'yyyy-MM-dd' — bu tarihten öncesi seçilemez
  maxDate?: string // 'yyyy-MM-dd' — bu tarihten sonrası seçilemez
  /**
   * Marks a filter-bar usage as opposed to a form field. This only adds a
   * class name — no Tailwind utilities change — so every account outside the
   * Liquid Glass theme renders exactly as before. The compact chip sizing
   * lives in liquid-glass{,-dark}.css against `.nc-date-compact`.
   */
  compact?: boolean
}

type ViewMode = 'days' | 'months' | 'years'

const YEAR_PAGE = 12

export function DatePicker({ value, onChange, placeholder, minDate, maxDate, compact }: DatePickerProps) {
  const { lang } = useLanguage()
  const locale = lang === 'tr' ? tr : lang === 'it' ? it : enUS
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('days')
  const [yearPageStart, setYearPageStart] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDate = value && isValid(parseISO(value)) ? parseISO(value) : null
  const [viewMonth, setViewMonth] = useState(selectedDate ?? new Date())

  useEffect(() => {
    if (open) {
      setViewMonth(selectedDate ?? new Date())
      setViewMode('days')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let d = gridStart
  while (d <= gridEnd) {
    days.push(d)
    d = addDays(d, 1)
  }

  const weekDayLabels = lang === 'tr'
    ? ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']
    : lang === 'it'
      ? ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do']
      : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  const monthLabels = Array.from({ length: 12 }, (_, i) =>
    format(setMonth(new Date(), i), 'MMM', { locale })
  )

  function openYearPicker() {
    setYearPageStart(Math.floor(viewMonth.getFullYear() / YEAR_PAGE) * YEAR_PAGE)
    setViewMode('years')
  }

  function selectDay(day: Date) {
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  function selectMonth(monthIndex: number) {
    setViewMonth(m => setMonth(m, monthIndex))
    setViewMode('days')
  }

  function selectYear(year: number) {
    setViewMonth(m => setYear(m, year))
    setViewMode('months')
  }

  function clearDate(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setOpen(false)
  }

  const displayValue = selectedDate
    ? format(selectedDate, 'd MMMM yyyy', { locale })
    : (placeholder ?? textFor(lang, 'Tarih seçin', 'Select date', 'Seleziona data'))

  return (
    /* The `nc-…` class names are styling hooks only — no utility classes were
       removed, so this renders identically outside the glass theme. They exist
       because the glass sheets used to target this calendar through
       [class*="z-[200]"] / [class*="bg-[#1B4332]"] substrings, and a Tailwind
       variant name that merely *contains* the base utility (every unselected
       day carries `hover:bg-[#1B4332]/8`) matched just as well — which painted
       every day cell as selected. Stable class names remove that whole trap. */
    <div ref={containerRef} className={`nc-date relative${compact ? ' nc-date-compact' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        data-open={open ? 'true' : undefined}
        data-filled={selectedDate ? 'true' : undefined}
        className={`nc-date-trigger w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm transition-all hover:border-gray-300 bg-white ${
          open ? 'border-[#1B4332] ring-2 ring-[#1B4332]/15' : 'border-gray-200'
        }`}
      >
        <CalendarIcon className={`nc-date-icon w-4 h-4 flex-shrink-0 transition-colors ${selectedDate ? 'text-[#1B4332]' : 'text-gray-400'}`} />
        <span className={`nc-date-label flex-1 text-left truncate ${selectedDate ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
          {displayValue}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="nc-cal-popup absolute z-[200] top-full left-0 mt-2 w-[300px] bg-white/98 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-2xl shadow-black/[0.12] overflow-hidden origin-top-left"
          >
            {/* Üst aksan çizgisi */}
            <div className="h-[3px] bg-gradient-to-r from-[#52B788] via-[#1B4332] to-[#52B788]" />

            <div className="p-4">
              {/* Ay / Yıl navigasyonu */}
              <div className="flex items-center justify-between mb-3.5">
                <button
                  type="button"
                  onClick={() => {
                    if (viewMode === 'days') setViewMonth(m => subMonths(m, 1))
                    else if (viewMode === 'years') setYearPageStart(y => y - YEAR_PAGE)
                    else setViewMonth(m => setYear(m, m.getFullYear() - 1))
                  }}
                  className="nc-cal-nav p-1.5 rounded-lg text-gray-400 hover:text-[#1B4332] hover:bg-[#1B4332]/8 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {viewMode === 'days' ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('months')}
                      className="text-sm font-black text-gray-900 capitalize tracking-tight px-2 py-1 rounded-lg hover:bg-[#1B4332]/8 hover:text-[#1B4332] transition-colors"
                    >
                      {format(viewMonth, 'MMMM', { locale })}
                    </button>
                    <button
                      type="button"
                      onClick={openYearPicker}
                      className="text-sm font-black text-gray-900 tracking-tight px-2 py-1 rounded-lg hover:bg-[#1B4332]/8 hover:text-[#1B4332] transition-colors"
                    >
                      {format(viewMonth, 'yyyy')}
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-black text-gray-900 tracking-tight">
                    {viewMode === 'months'
                      ? format(viewMonth, 'yyyy')
                      : `${yearPageStart} – ${yearPageStart + YEAR_PAGE - 1}`}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (viewMode === 'days') setViewMonth(m => addMonths(m, 1))
                    else if (viewMode === 'years') setYearPageStart(y => y + YEAR_PAGE)
                    else setViewMonth(m => setYear(m, m.getFullYear() + 1))
                  }}
                  className="nc-cal-nav p-1.5 rounded-lg text-gray-400 hover:text-[#1B4332] hover:bg-[#1B4332]/8 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {viewMode === 'days' && (
                  <motion.div
                    key="days"
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.14 }}
                  >
                    {/* Gün başlıkları */}
                    <div className="nc-cal-weekdays grid grid-cols-7 mb-0.5">
                      {weekDayLabels.map(w => (
                        <div key={w} className="text-center text-[10px] font-black text-gray-300 uppercase py-1.5 tracking-wide">
                          {w}
                        </div>
                      ))}
                    </div>

                    {/* Gün ızgarası */}
                    <div className="nc-cal-grid grid grid-cols-7 gap-y-1">
                      {days.map((day, i) => {
                        const inMonth = isSameMonth(day, viewMonth)
                        const selected = !!selectedDate && isSameDay(day, selectedDate)
                        const today = isToday(day)
                        const dayStr = format(day, 'yyyy-MM-dd')
                        const disabled = (!!minDate && dayStr < minDate) || (!!maxDate && dayStr > maxDate)
                        return (
                          <div key={i} className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => !disabled && selectDay(day)}
                              disabled={disabled}
                              data-selected={selected ? 'true' : undefined}
                              data-muted={!inMonth && !selected ? 'true' : undefined}
                              data-disabled={disabled ? 'true' : undefined}
                              className={`nc-cal-day relative w-9 h-9 flex items-center justify-center text-xs font-bold rounded-xl transition-all duration-150 ${
                                disabled
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : selected
                                  ? 'bg-gradient-to-br from-[#1B4332] to-[#0f2a20] text-white shadow-lg shadow-[#1B4332]/35 scale-[1.06]'
                                  : inMonth
                                  ? 'text-gray-700 hover:bg-[#1B4332]/8 hover:text-[#1B4332]'
                                  : 'text-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {format(day, 'd')}
                              {today && !selected && !disabled && (
                                <span className="nc-cal-today-dot absolute bottom-[3px] w-1 h-1 rounded-full bg-[#52B788]" />
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}

                {viewMode === 'months' && (
                  <motion.div
                    key="months"
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.14 }}
                    className="grid grid-cols-3 gap-1.5"
                  >
                    {monthLabels.map((label, i) => {
                      const active = i === viewMonth.getMonth()
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => selectMonth(i)}
                          className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all duration-150 ${
                            active
                              ? 'bg-gradient-to-br from-[#1B4332] to-[#0f2a20] text-white shadow-lg shadow-[#1B4332]/35'
                              : 'text-gray-600 hover:bg-[#1B4332]/8 hover:text-[#1B4332]'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </motion.div>
                )}

                {viewMode === 'years' && (
                  <motion.div
                    key="years"
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.14 }}
                    className="grid grid-cols-3 gap-1.5"
                  >
                    {Array.from({ length: YEAR_PAGE }, (_, i) => yearPageStart + i).map(year => {
                      const active = year === viewMonth.getFullYear()
                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => selectYear(year)}
                          className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                            active
                              ? 'bg-gradient-to-br from-[#1B4332] to-[#0f2a20] text-white shadow-lg shadow-[#1B4332]/35'
                              : 'text-gray-600 hover:bg-[#1B4332]/8 hover:text-[#1B4332]'
                          }`}
                        >
                          {year}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Alt aksiyonlar */}
              {viewMode === 'days' && (
                <div className="nc-cal-actions flex items-center justify-between mt-3.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={clearDate}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {textFor(lang, 'Temizle', 'Clear', 'Pulisci')}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectDay(new Date())}
                    className="text-xs font-black text-[#1B4332] hover:text-[#163728] transition-colors px-2.5 py-1 rounded-lg hover:bg-[#1B4332]/8"
                  >
                    {textFor(lang, 'Bugün', 'Today', 'Oggi')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
