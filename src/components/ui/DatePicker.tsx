'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, parseISO, isValid,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths,
  isSameDay, isSameMonth, isToday,
} from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { useLanguage } from '@/lib/i18n'

interface DatePickerProps {
  value: string // 'yyyy-MM-dd'
  onChange: (value: string) => void
  placeholder?: string
  minDate?: string // 'yyyy-MM-dd' — bu tarihten öncesi seçilemez
  maxDate?: string // 'yyyy-MM-dd' — bu tarihten sonrası seçilemez
}

export function DatePicker({ value, onChange, placeholder, minDate, maxDate }: DatePickerProps) {
  const { lang } = useLanguage()
  const locale = lang === 'tr' ? tr : enUS
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDate = value && isValid(parseISO(value)) ? parseISO(value) : null
  const [viewMonth, setViewMonth] = useState(selectedDate ?? new Date())

  useEffect(() => {
    if (open) setViewMonth(selectedDate ?? new Date())
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
    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

  function selectDay(day: Date) {
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  function clearDate(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setOpen(false)
  }

  const displayValue = selectedDate
    ? format(selectedDate, 'd MMMM yyyy', { locale })
    : (placeholder ?? (lang === 'tr' ? 'Tarih seçin' : 'Select date'))

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm transition-all hover:border-gray-300 bg-white ${
          open ? 'border-[#1B4332] ring-2 ring-[#1B4332]/15' : 'border-gray-200'
        }`}
      >
        <CalendarIcon className={`w-4 h-4 flex-shrink-0 transition-colors ${selectedDate ? 'text-[#1B4332]' : 'text-gray-400'}`} />
        <span className={`flex-1 text-left truncate ${selectedDate ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
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
            className="absolute z-[200] top-full left-0 mt-1.5 w-[296px] bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-black/10 p-4 origin-top-left"
          >
            {/* Ay navigasyonu */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setViewMonth(m => subMonths(m, 1))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-[#1B4332] hover:bg-[#1B4332]/8 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-black text-gray-900 capitalize tracking-tight">
                {format(viewMonth, 'MMMM yyyy', { locale })}
              </span>
              <button
                type="button"
                onClick={() => setViewMonth(m => addMonths(m, 1))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-[#1B4332] hover:bg-[#1B4332]/8 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Gün başlıkları */}
            <div className="grid grid-cols-7 mb-0.5">
              {weekDayLabels.map(w => (
                <div key={w} className="text-center text-[10px] font-black text-gray-300 uppercase py-1.5 tracking-wide">
                  {w}
                </div>
              ))}
            </div>

            {/* Gün ızgarası */}
            <div className="grid grid-cols-7 gap-y-1">
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
                      className={`relative w-9 h-9 flex items-center justify-center text-xs font-bold rounded-xl transition-all duration-150 ${
                        disabled
                          ? 'text-gray-200 cursor-not-allowed'
                          : selected
                          ? 'bg-[#1B4332] text-white shadow-lg shadow-[#1B4332]/30 scale-[1.05]'
                          : inMonth
                          ? 'text-gray-700 hover:bg-gray-100'
                          : 'text-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {format(day, 'd')}
                      {today && !selected && !disabled && (
                        <span className="absolute bottom-[3px] w-1 h-1 rounded-full bg-[#52B788]" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Alt aksiyonlar */}
            <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={clearDate}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                {lang === 'tr' ? 'Temizle' : 'Clear'}
              </button>
              <button
                type="button"
                onClick={() => selectDay(new Date())}
                className="text-xs font-black text-[#1B4332] hover:text-[#163728] transition-colors px-2.5 py-1 rounded-lg hover:bg-[#1B4332]/8"
              >
                {lang === 'tr' ? 'Bugün' : 'Today'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
