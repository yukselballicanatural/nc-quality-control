'use client'

import { motion, type Variants } from 'framer-motion'

/**
 * Log-out icon whose arrow slides out of the door on hover.
 *
 * The supplied version imported `motion/react` plus an `animate-ui` icon
 * scaffold (IconWrapper / useAnimateIconContext / getVariants). `motion` is the
 * same library this project already has as `framer-motion` v12 — it was renamed
 * upstream — so pulling it in would ship a duplicate copy of the animation
 * engine, and the scaffold exists only to route a hover state into the variants.
 * Here the parent button owns that state: it declares `whileHover="animate"`
 * and Framer propagates the variant name down to `group` below.
 */
const groupVariants: Variants = {
  initial: { x: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
  animate: { x: 2, transition: { duration: 0.3, ease: 'easeInOut' } },
}

interface AnimatedLogOutIconProps {
  size?: number
  className?: string
}

export function AnimatedLogOutIcon({ size = 18, className = '' }: AnimatedLogOutIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Arrow — the only part that moves */}
      <motion.g variants={groupVariants}>
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </motion.g>
      {/* Door frame — stays put */}
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </svg>
  )
}

export default AnimatedLogOutIcon
