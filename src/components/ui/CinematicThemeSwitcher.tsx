'use client'

import { Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Particle {
  id: number
  delay: number
  duration: number
}

interface CinematicThemeSwitcherProps {
  /** Track width in px. The rest of the geometry is derived from it. */
  width?: number
  className?: string
  ariaLabel?: string
}

/**
 * Cinematic light/dark switch.
 *
 * Adapted from the supplied component in one respect: it drives this app's own
 * theme mechanism (the `app_theme` localStorage key plus the `data-theme`
 * attribute that the boot script in app/layout.tsx reads) instead of pulling in
 * next-themes. Introducing a second theme owner would fight the existing one on
 * a live system, and the visual result is identical either way.
 */
export function CinematicThemeSwitcher({
  width = 58,
  className = '',
  ariaLabel,
}: CinematicThemeSwitcherProps) {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  // Derived geometry, so a single `width` keeps every layer in proportion.
  const pad = Math.round(width * 0.069)
  const height = Math.round(width * 0.6)
  const thumb = height - pad * 2
  const travel = width - pad * 2 - thumb
  const icon = Math.round(thumb * 0.54)

  // Read the theme the boot script already applied. Runs after mount so the
  // server-rendered markup and the first client render always agree.
  useEffect(() => {
    setMounted(true)
    setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
  }, [])

  // Keep in sync if anything else flips the attribute (e.g. another control).
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  function generateParticles() {
    setParticles(
      Array.from({ length: 3 }, (_, i) => ({
        id: i,
        delay: i * 0.1,
        duration: 0.6 + i * 0.1,
      }))
    )
    setIsAnimating(true)
    setTimeout(() => {
      setIsAnimating(false)
      setParticles([])
    }, 1000)
  }

  function handleToggle() {
    generateParticles()
    const next = isDark ? 'light' : 'dark'
    try {
      localStorage.setItem('app_theme', next)
    } catch (err) {
      // Private mode / storage disabled: the toggle should still work for this
      // session even if the choice cannot be remembered.
      console.error('Theme preference could not be saved:', err)
    }
    document.documentElement.setAttribute('data-theme', next)
    setIsDark(next === 'dark')
  }

  // Placeholder keeps the row height stable until the theme is known.
  if (!mounted) {
    return (
      <div
        className={`relative inline-block ${className}`}
        style={{ width, height }}
        aria-hidden="true"
      />
    )
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <motion.button
        type="button"
        onClick={handleToggle}
        className="lg-cine-switch relative flex items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
        style={{
          width,
          height,
          padding: pad,
          background: isDark
            ? 'radial-gradient(ellipse at top left, #1e293b 0%, #0f172a 40%, #020617 100%)'
            : 'radial-gradient(ellipse at top left, #ffffff 0%, #f1f5f9 40%, #cbd5e1 100%)',
          boxShadow: isDark
            ? `inset 3px 3px 7px rgba(0, 0, 0, 0.9),
               inset -3px -3px 7px rgba(71, 85, 105, 0.4),
               inset 0 1px 2px rgba(0, 0, 0, 1),
               inset 0 0 12px rgba(0, 0, 0, 0.6),
               0 1px 1px rgba(255, 255, 255, 0.05),
               0 2px 4px rgba(0, 0, 0, 0.4),
               0 6px 14px rgba(0, 0, 0, 0.35)`
            : `inset 3px 3px 7px rgba(148, 163, 184, 0.5),
               inset -3px -3px 7px rgba(255, 255, 255, 1),
               inset 0 1px 2px rgba(148, 163, 184, 0.4),
               inset 0 0 12px rgba(203, 213, 225, 0.3),
               0 1px 2px rgba(255, 255, 255, 1),
               0 2px 4px rgba(0, 0, 0, 0.1),
               0 6px 14px rgba(0, 0, 0, 0.07)`,
          border: isDark
            ? '1.5px solid rgba(51, 65, 85, 0.6)'
            : '1.5px solid rgba(203, 213, 225, 0.6)',
        }}
        aria-label={ariaLabel ?? `Switch to ${isDark ? 'light' : 'dark'} mode`}
        role="switch"
        aria-checked={isDark}
        whileTap={{ scale: 0.96 }}
      >
        {/* Inner groove */}
        <span
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: 2,
            boxShadow: isDark
              ? 'inset 0 1px 4px rgba(0, 0, 0, 0.9), inset 0 -1px 2px rgba(71, 85, 105, 0.3)'
              : 'inset 0 1px 4px rgba(100, 116, 139, 0.4), inset 0 -1px 2px rgba(255, 255, 255, 0.8)',
          }}
        />

        {/* Glossy overlay */}
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at top, rgba(71, 85, 105, 0.15) 0%, transparent 50%), linear-gradient(to bottom, rgba(71, 85, 105, 0.2) 0%, transparent 30%, transparent 70%, rgba(0, 0, 0, 0.3) 100%)'
              : 'radial-gradient(ellipse at top, rgba(255, 255, 255, 0.8) 0%, transparent 50%), linear-gradient(to bottom, rgba(255, 255, 255, 0.7) 0%, transparent 30%, transparent 70%, rgba(148, 163, 184, 0.15) 100%)',
            mixBlendMode: 'overlay',
          }}
        />

        {/* Ambient occlusion */}
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: isDark
              ? 'inset 0 0 10px rgba(0, 0, 0, 0.5)'
              : 'inset 0 0 10px rgba(148, 163, 184, 0.2)',
          }}
        />

        {/* Track icons */}
        <span
          className="absolute inset-0 flex items-center justify-between pointer-events-none"
          style={{ paddingLeft: pad + 2, paddingRight: pad + 2 }}
        >
          <Sun size={icon} className={isDark ? 'text-yellow-100/70' : 'text-amber-600'} />
          <Moon size={icon} className={isDark ? 'text-yellow-100' : 'text-slate-500/70'} />
        </span>

        {/* Thumb */}
        <motion.span
          className="relative z-10 flex items-center justify-center rounded-full overflow-hidden"
          style={{
            width: thumb,
            height: thumb,
            background: isDark
              ? 'linear-gradient(145deg, #64748b 0%, #475569 50%, #334155 100%)'
              : 'linear-gradient(145deg, #ffffff 0%, #fefefe 50%, #f8fafc 100%)',
            boxShadow: isDark
              ? `inset 1px 1px 3px rgba(100, 116, 139, 0.4),
                 inset -1px -1px 3px rgba(0, 0, 0, 0.8),
                 0 1px 2px rgba(255, 255, 255, 0.1),
                 0 4px 14px rgba(0, 0, 0, 0.55),
                 0 2px 5px rgba(0, 0, 0, 0.4)`
              : `inset 1px 1px 3px rgba(203, 213, 225, 0.3),
                 inset -1px -1px 3px rgba(255, 255, 255, 1),
                 0 1px 2px rgba(255, 255, 255, 1),
                 0 4px 14px rgba(0, 0, 0, 0.16),
                 0 2px 5px rgba(0, 0, 0, 0.1)`,
            border: isDark
              ? '1.5px solid rgba(148, 163, 184, 0.3)'
              : '1.5px solid rgba(255, 255, 255, 0.9)',
          }}
          animate={{ x: isDark ? travel : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {/* Thumb shine */}
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 0%, transparent 40%, rgba(0, 0, 0, 0.1) 100%)',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Expanding grainy particles on toggle */}
          {isAnimating &&
            particles.map(particle => (
              <span
                key={particle.id}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <motion.span
                  className="absolute rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background: isDark
                      ? 'radial-gradient(circle, rgba(147, 197, 253, 0.5) 0%, rgba(147, 197, 253, 0) 70%)'
                      : 'radial-gradient(circle, rgba(251, 191, 36, 0.7) 0%, rgba(251, 191, 36, 0) 70%)',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: isDark ? 6 : 8, opacity: [0, 1, 0] }}
                  transition={{
                    duration: isDark ? 0.5 : particle.duration,
                    delay: particle.delay,
                    ease: 'easeOut',
                  }}
                >
                  <span
                    className="absolute inset-0 rounded-full opacity-40"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                      mixBlendMode: 'overlay',
                    }}
                  />
                </motion.span>
              </span>
            ))}

          <span className="relative z-10 flex items-center justify-center">
            {isDark ? (
              <Moon size={icon} className="text-yellow-200" />
            ) : (
              <Sun size={icon} className="text-amber-500" />
            )}
          </span>
        </motion.span>
      </motion.button>
    </div>
  )
}

export default CinematicThemeSwitcher
