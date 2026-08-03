'use client'

import type { Language } from '@/types'

const LANGUAGES: { value: Language; label: string; activeClass: string }[] = [
  {
    value: 'tr',
    label: 'TR',
    activeClass: 'from-[#c0c0c0]/40 to-white shadow-[0_0_18px_rgba(192,192,192,0.42),inset_0_0_10px_rgba(255,255,255,0.55)]',
  },
  {
    value: 'en',
    label: 'EN',
    activeClass: 'from-[#ffd700]/35 to-[#ffcc00] shadow-[0_0_18px_rgba(255,215,0,0.42),inset_0_0_10px_rgba(255,235,150,0.45)]',
  },
  {
    value: 'it',
    label: 'IT',
    activeClass: 'from-[#d0e7ff]/40 to-[#a0d8ff] shadow-[0_0_18px_rgba(160,216,255,0.45),inset_0_0_10px_rgba(200,240,255,0.45)]',
  },
]

interface GlassLanguageToggleProps {
  value: Language
  onChange: (value: Language) => void
  className?: string
  ariaLabel?: string
}

export function GlassLanguageToggle({
  value,
  onChange,
  className = '',
  ariaLabel = 'Language',
}: GlassLanguageToggleProps) {
  const activeIndex = Math.max(0, LANGUAGES.findIndex(language => language.value === value))
  const activeLanguage = LANGUAGES[activeIndex]

  return (
    <div
      className={`relative inline-flex overflow-hidden rounded-2xl bg-white/10 p-1 shadow-[inset_1px_1px_4px_rgba(255,255,255,0.28),inset_-1px_-1px_6px_rgba(0,0,0,0.16),0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl ${className}`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      <span
        className={`absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-xl bg-gradient-to-br transition-all duration-500 ease-[cubic-bezier(0.37,1.95,0.66,0.56)] ${activeLanguage.activeClass}`}
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
        aria-hidden="true"
      />
      {LANGUAGES.map(language => (
        <button
          key={language.value}
          type="button"
          role="radio"
          aria-checked={value === language.value}
          onClick={() => onChange(language.value)}
          className={`relative z-10 min-w-[44px] rounded-xl px-3 py-1.5 text-[11px] font-black tracking-[0.18em] transition-colors duration-300 ${
            value === language.value
              ? 'text-[#1B4332]'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {language.label}
        </button>
      ))}
    </div>
  )
}
