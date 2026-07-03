'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

export interface SelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  icon?: React.ElementType
  required?: boolean
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  required,
}: SearchableSelectProps) {
  const { lang } = useLanguage()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedLabel = options.find(o => o.value === value)?.label

  const filtered = search.trim()
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); setSearch('') }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  // Auto-focus search
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [open])

  function handleSelect(val: string) {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  const searchPlaceholder = lang === 'tr' ? 'Ara...' : 'Search...'
  const noResults = lang === 'tr' ? 'Sonuç bulunamadı' : 'No results'

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm transition-all hover:border-gray-300 bg-white ${
          open
            ? 'border-[#1B4332] ring-2 ring-[#1B4332]/15'
            : 'border-gray-200'
        }`}
      >
        {Icon && (
          <Icon
            className={`w-4 h-4 flex-shrink-0 transition-colors ${
              value ? 'text-[#1B4332]' : 'text-gray-400'
            }`}
          />
        )}
        <span
          className={`flex-1 text-left truncate ${
            value ? 'text-gray-900 font-medium' : 'text-gray-400'
          }`}
        >
          {selectedLabel ?? placeholder ?? (lang === 'tr' ? 'Seçiniz' : 'Select')}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-black/10 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-8 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15 focus:border-[#1B4332] transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto overscroll-contain">
            {!required && value && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="italic">{lang === 'tr' ? 'Temizle' : 'Clear'}</span>
              </button>
            )}

            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                {noResults}
              </div>
            ) : (
              filtered.map(opt => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors hover:bg-gray-50 ${
                      isSelected
                        ? 'bg-[#1B4332]/5 text-[#1B4332] font-semibold'
                        : 'text-gray-700'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#1B4332] flex-shrink-0 ml-2" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
