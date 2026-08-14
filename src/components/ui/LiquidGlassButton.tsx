'use client'

/**
 * Liquid-glass button.
 *
 * The design from the reference snippet, rebuilt against this project's stack.
 * The snippet itself is written for Tailwind v4 + shadcn: `bg-linear-to-t`,
 * `inset-shadow-2xs`, `text-primary`, `ring-ring/50` and friends. This project
 * is Tailwind 3.4 with no shadcn CSS variables, so pasted verbatim those
 * classes compile to nothing and the button renders as bare text — which is
 * how the previous attempt looked wrong. The two things that actually carry
 * the effect are kept exactly:
 *
 *  - the layered inset box-shadow that draws the rim, the bevel and the
 *    inner haze (see .lqg-rim in liquid-glass.css / liquid-glass-dark.css),
 *  - the SVG turbulence + displacement map used as a backdrop filter.
 *
 * `backdrop-filter: url(#…)` is a Firefox-only capability; Chrome and Safari
 * drop it silently. So the warp layer also declares a plain blur(), which is
 * what those browsers fall back to — glass everywhere, refraction where the
 * engine can do it.
 */

import type React from 'react'

interface LiquidGlassButtonProps {
  children: React.ReactNode
  /** Rendered as an <a> when set, keeping the existing navigation. */
  href?: string
  onClick?: () => void
  size?: 'default' | 'lg' | 'xl'
  className?: string
}

/** One filter definition per document, however many buttons are on the page. */
function GlassFilter() {
  return (
    <svg className="hidden" aria-hidden="true">
      <title>Liquid glass displacement</title>
      <defs>
        <filter
          id="lqg-container-glass"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="70"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}

export function LiquidGlassButton({
  children,
  href,
  onClick,
  size = 'default',
  className,
}: LiquidGlassButtonProps) {
  const Tag = (href ? 'a' : 'button') as 'a'

  return (
    <Tag
      href={href}
      onClick={onClick}
      data-slot="button"
      data-size={size}
      className={`lqg-btn${className ? ` ${className}` : ''}`}
    >
      <span className="lqg-rim" aria-hidden="true" />
      <span className="lqg-warp" aria-hidden="true" />
      <span className="lqg-label">{children}</span>
      <GlassFilter />
    </Tag>
  )
}
