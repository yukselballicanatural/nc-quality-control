'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

let globalStart: (() => void) | null = null
let historyPatched = false

function patchHistory() {
  if (historyPatched || typeof window === 'undefined') return
  historyPatched = true

  const origPush = history.pushState.bind(history)
  const origReplace = history.replaceState.bind(history)

  history.pushState = (...args) => {
    const url = args[2]
    // Only trigger for actual page navigations (URL path changed)
    if (
      typeof url === 'string' &&
      url !== location.pathname + location.search + location.hash
    ) {
      globalStart?.()
    }
    return origPush(...args)
  }

  history.replaceState = (...args) => {
    // replaceState is used by Next.js for scroll restoration — skip
    return origReplace(...args)
  }
}

export function NavigationProgress() {
  const pathname = usePathname()
  const barRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const widthRef = useRef(0)
  const activeRef = useRef(false)

  const stopRaf = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    if (!activeRef.current || !barRef.current) return
    widthRef.current += (90 - widthRef.current) * 0.06 + 0.35
    if (widthRef.current >= 89.8) widthRef.current = 89.8
    barRef.current.style.width = `${widthRef.current}%`
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(() => {
    if (activeRef.current) return
    activeRef.current = true
    widthRef.current = 0
    stopRaf()

    const wrap = wrapRef.current
    const bar = barRef.current
    if (!wrap || !bar) return

    wrap.style.opacity = '1'
    bar.style.transition = 'none'
    bar.style.width = '0%'

    requestAnimationFrame(() => {
      bar.style.transition = 'width 0.08s linear'
      rafRef.current = requestAnimationFrame(tick)
    })

    // Safety: auto-finish after 8s if route never changed (error, etc.)
    timeoutRef.current = setTimeout(() => {
      if (activeRef.current) finish()
    }, 8000)
  }, [tick, stopRaf]) // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(() => {
    if (!activeRef.current) return
    activeRef.current = false
    stopRaf()

    const wrap = wrapRef.current
    const bar = barRef.current
    if (!wrap || !bar) return

    bar.style.transition = 'width 0.18s ease-out'
    bar.style.width = '100%'

    timeoutRef.current = setTimeout(() => {
      wrap.style.opacity = '0'
      timeoutRef.current = setTimeout(() => {
        bar.style.transition = 'none'
        bar.style.width = '0%'
        widthRef.current = 0
      }, 300)
    }, 150)
  }, [stopRaf])

  useEffect(() => {
    globalStart = start
    return () => { globalStart = null }
  }, [start])

  useEffect(() => {
    patchHistory()
  }, [])

  // Pathname changed = navigation complete
  useEffect(() => {
    finish()
  }, [pathname, finish])

  useEffect(() => () => stopRaf(), [stopRaf])

  return (
    <div
      ref={wrapRef}
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
    >
      <div
        ref={barRef}
        style={{
          height: '3px',
          width: '0%',
          background: 'linear-gradient(90deg, #40c47a, #52B788, #2D9A63)',
          boxShadow: '0 0 14px 3px rgba(82,183,136,0.6)',
          borderRadius: '0 3px 3px 0',
        }}
      />
    </div>
  )
}
