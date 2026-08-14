'use client'

/**
 * Liquid-metal primary action button.
 *
 * Three stacked layers, as in the reference: a WebGL shader surface at the
 * bottom (@paper-design/shaders), a translucent green body above it, and the
 * label/icon on top; a transparent <button> covers all three and owns the
 * pointer events, the press state and the click ripple.
 *
 * Two deliberate departures from the reference snippet:
 *
 *  - The package is imported dynamically and every failure path (no WebGL, a
 *    blocked chunk, a shader compile error) falls back to the plain gradient
 *    body. This runs in production, so the button has to stay a working link
 *    even when the shader does not come up.
 *  - Cleanup calls `dispose()`. The snippet calls `destroy()`, which this
 *    version of ShaderMount does not expose — the WebGL context would leak on
 *    every unmount.
 *
 * Placed in src/components/ui/ rather than /components/ui: this project is not
 * a shadcn install, and src/components/ui is where its own primitives live
 * (Button, Input, DatePicker, GlassLangDropdown …).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'

/** Brand green, as vec4s for the shader's back/tint uniforms. */
const COLOR_BACK: [number, number, number, number] = [0.023, 0.184, 0.145, 1]
const COLOR_TINT: [number, number, number, number] = [0.051, 0.58, 0.533, 1]

interface LiquidMetalButtonProps {
  label: string
  icon?: React.ReactNode
  /** Rendered as an <a> when set, so the existing <Link> navigation is kept. */
  href?: string
  onClick?: () => void
  viewMode?: 'text' | 'icon'
  className?: string
}

export function LiquidMetalButton({
  label,
  icon,
  href,
  onClick,
  viewMode = 'text',
  className,
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
  const [textWidth, setTextWidth] = useState(0)

  const shaderRef = useRef<HTMLDivElement>(null)
  const shaderMount = useRef<{ setSpeed?: (n: number) => void; dispose?: () => void } | null>(null)
  const rootRef = useRef<HTMLElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const rippleId = useRef(0)

  useEffect(() => {
    if (labelRef.current) setTextWidth(Math.ceil(labelRef.current.getBoundingClientRect().width))
  }, [label, viewMode])

  const dimensions = useMemo(() => {
    if (viewMode === 'icon') {
      return { width: 46, height: 46 }
    }
    // 46px of chrome around the text (18px each side + the 10px icon gap).
    const width = Math.max(142, textWidth + (icon ? 62 : 40))
    return { width, height: 46 }
  }, [viewMode, textWidth, icon])

  useEffect(() => {
    const styleId = 'liquid-metal-button-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .lm-shader canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: 100px !important;
        }
        @keyframes lm-ripple {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: .6; }
          100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
        }
      `
      document.head.appendChild(style)
    }

    // Motion-sensitive users get the static body, not an endlessly moving one.
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    let cancelled = false
    ;(async () => {
      try {
        const canWebGl = Boolean(document.createElement('canvas').getContext('webgl2'))
        if (!canWebGl || !shaderRef.current) return
        const { ShaderMount, liquidMetalFragmentShader } = await import('@paper-design/shaders')
        if (cancelled || !shaderRef.current) return
        shaderMount.current = new ShaderMount(
          shaderRef.current,
          liquidMetalFragmentShader,
          {
            u_colorBack: COLOR_BACK,
            u_colorTint: COLOR_TINT,
            u_image: undefined,
            u_isImage: false,
            u_repetition: 4,
            u_softness: 0.5,
            u_shiftRed: 0.3,
            u_shiftBlue: 0.3,
            u_distortion: 0,
            u_contour: 0,
            u_angle: 45,
            u_shape: 1,
            u_fit: 0,
            u_scale: 8,
            u_rotation: 0,
            u_originX: 0.5,
            u_originY: 0.5,
            u_worldWidth: 0,
            u_worldHeight: 0,
            u_offsetX: 0.1,
            u_offsetY: -0.1,
          } as never,
          undefined,
          0.6
        ) as never
      } catch {
        // Falls through to the gradient body — nothing else to do.
      }
    })()

    return () => {
      cancelled = true
      shaderMount.current?.dispose?.()
      shaderMount.current = null
    }
  }, [])

  const setSpeed = (n: number) => shaderMount.current?.setSpeed?.(n)

  function handleActivate(e: React.MouseEvent<HTMLElement>) {
    setSpeed(2.4)
    window.setTimeout(() => setSpeed(isHovered ? 1 : 0.6), 300)
    if (rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect()
      const ripple = { x: e.clientX - rect.left, y: e.clientY - rect.top, id: rippleId.current++ }
      setRipples(prev => [...prev, ripple])
      window.setTimeout(() => setRipples(prev => prev.filter(r => r.id !== ripple.id)), 600)
    }
    onClick?.()
  }

  const layerBox: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
    transformStyle: 'preserve-3d',
    transition: 'all .8s cubic-bezier(.34,1.56,.64,1)',
  }

  const pressTransform = isPressed ? 'translateY(1px) scale(.98)' : 'translateY(0) scale(1)'

  const Tag = (href ? 'a' : 'button') as 'a'

  return (
    <div className={`relative inline-block${className ? ` ${className}` : ''}`}>
      <div style={{ perspective: '1000px', perspectiveOrigin: '50% 50%' }}>
        <div
          style={{
            position: 'relative',
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            transformStyle: 'preserve-3d',
            transition: 'width .4s ease, height .4s ease',
          }}
        >
          {/* 3 — label / icon */}
          <div
            style={{
              ...layerBox,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transform: 'translateZ(20px)',
              zIndex: 30,
              pointerEvents: 'none',
              color: '#e6fff7',
            }}
          >
            {icon && (
              <span style={{ display: 'inline-flex', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.5))' }}>
                {icon}
              </span>
            )}
            {viewMode === 'text' && (
              <span
                ref={labelRef}
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  textShadow: '0 1px 2px rgba(0,0,0,.5)',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            )}
          </div>

          {/* 2 — translucent green body */}
          <div style={{ ...layerBox, transform: `translateZ(10px) ${pressTransform}`, zIndex: 20 }}>
            <div
              style={{
                width: `${dimensions.width - 4}px`,
                height: `${dimensions.height - 4}px`,
                margin: '2px',
                borderRadius: '100px',
                background: 'linear-gradient(180deg, rgba(13,148,136,.55) 0%, rgba(6,78,59,.85) 100%)',
                boxShadow: isPressed ? 'inset 0 2px 4px rgba(0,0,0,.4)' : 'none',
                transition: 'box-shadow .15s ease',
              }}
            />
          </div>

          {/* 1 — shader surface + lift shadow */}
          <div style={{ ...layerBox, transform: `translateZ(0) ${pressTransform}`, zIndex: 10 }}>
            <div
              style={{
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                borderRadius: '100px',
                background: 'rgb(0 0 0 / 0)',
                transition: 'box-shadow .15s ease',
                boxShadow: isPressed
                  ? '0 0 0 1px rgba(13,148,136,.5), 0 1px 2px rgba(0,0,0,.3)'
                  : isHovered
                    ? '0 0 0 1px rgba(13,148,136,.5), 0 12px 24px rgba(13,148,136,.25), 0 4px 10px rgba(0,0,0,.2)'
                    : '0 0 0 1px rgba(13,148,136,.35), 0 8px 20px rgba(13,148,136,.15), 0 2px 6px rgba(0,0,0,.15)',
              }}
            >
              <div
                ref={shaderRef}
                className="lm-shader"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '100px',
                  width: `${dimensions.width}px`,
                  height: `${dimensions.height}px`,
                }}
              />
            </div>
          </div>

          {/* 4 — hit area */}
          <Tag
            ref={rootRef as React.Ref<HTMLAnchorElement>}
            href={href}
            onClick={handleActivate}
            onMouseEnter={() => { setIsHovered(true); setSpeed(1) }}
            onMouseLeave={() => { setIsHovered(false); setIsPressed(false); setSpeed(0.6) }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            aria-label={label}
            style={{
              ...layerBox,
              display: 'block',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              overflow: 'hidden',
              borderRadius: '100px',
              transform: 'translateZ(25px)',
              zIndex: 40,
            }}
          >
            {ripples.map(r => (
              <span
                key={r.id}
                style={{
                  position: 'absolute',
                  left: `${r.x}px`,
                  top: `${r.y}px`,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,.4) 0%, rgba(255,255,255,0) 70%)',
                  pointerEvents: 'none',
                  animation: 'lm-ripple .6s ease-out',
                }}
              />
            ))}
          </Tag>
        </div>
      </div>
    </div>
  )
}
