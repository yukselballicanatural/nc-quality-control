'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { Language } from '@/types'

/**
 * Liquid-glass language picker for the sidebar.
 *
 * Deliberately NOT a native <select> enhanced by public/api/liquid-ui.js: that
 * widget always drops downwards, and this control sits near the bottom of the
 * sidebar where a downward panel would open off-screen. The markup here is the
 * shape the styling in liquid-glass{,-dark}.css expects (.lang-trigger /
 * .lang-menu / .lang-item), and the panel is anchored above the trigger.
 *
 * Changing the language re-renders through the existing language context, so no
 * page reload is needed — the whole tree already reacts to `lang`.
 */

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
]

interface GlassLangDropdownProps {
  value: Language
  onChange: (next: Language) => void
  ariaLabel: string
}

export function GlassLangDropdown({ value, onChange, ariaLabel }: GlassLangDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = LANGUAGES.find(l => l.code === value) ?? LANGUAGES[0]

  useEffect(() => {
    if (!open) return
    // Capture phase: closes even when the click lands on a control that stops
    // propagation on its own bubbling listener.
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`lang-dd${open ? ' lang-open' : ''}`}>
      <button
        type="button"
        className="lang-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}
      >
        <span className="lang-code">{value.toUpperCase()}</span>
        <span className="lang-name">{current.label}</span>
        <ChevronDown className="lang-chev" aria-hidden="true" />
      </button>

      {/* Kept mounted so the stagger animation restarts from the same nodes and
          the closed panel costs nothing (display:none in the stylesheet). */}
      <div className="lang-menu" role="listbox" aria-label={ariaLabel}>
        {LANGUAGES.map((item, i) => {
          const selected = item.code === value
          return (
            <button
              key={item.code}
              type="button"
              role="option"
              aria-selected={selected}
              // Drives the per-row entrance delay in CSS.
              style={{ '--i': i } as React.CSSProperties}
              className={`lang-item${selected ? ' lang-on' : ''}`}
              onClick={() => {
                setOpen(false)
                if (!selected) onChange(item.code)
              }}
            >
              <span className="lang-code">{item.code.toUpperCase()}</span>
              <span className="lang-name">{item.label}</span>
              <Check className="lang-check" aria-hidden="true" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
