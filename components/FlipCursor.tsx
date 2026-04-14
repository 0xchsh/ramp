'use client'
import { useEffect, useRef } from 'react'
import { useCardStore } from '@/store/cardStore'

/**
 * Custom cursor that replaces the native pointer while hovering the 3D card.
 * Uses a fixed-position div that follows the mouse via direct DOM mutation
 * (so React doesn't re-render on every move) plus an inner div whose scale
 * animates via CSS transition on press — native cursors can't animate, so
 * the only way to get a smooth squish on click is to render our own.
 */
export function FlipCursor() {
  const visible = useCardStore((s) => s.cursorOverCard)
  const pressed = useCardStore((s) => s.cursorPressed)
  const posRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const el = posRef.current
      if (!el) return
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
    }
    window.addEventListener('pointermove', handleMove)
    return () => window.removeEventListener('pointermove', handleMove)
  }, [])

  return (
    <div
      ref={posRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 10000,
        opacity: visible ? 1 : 0,
        transition: 'opacity 120ms ease-out',
        willChange: 'transform',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: -24,
          top: -24,
          width: 48,
          height: 48,
          transform: `scale(${pressed ? 0.78 : 1})`,
          transformOrigin: 'center',
          transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          willChange: 'transform',
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          style={{
            display: 'block',
            overflow: 'visible',
            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))',
          }}
        >
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="rgba(20,20,30,0.9)"
          />
          <g
            transform="translate(6 6)"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M24 13a7 7 0 1 0 1.6 6.5" />
            <polyline points="24 9 24 13 20 13" />
          </g>
        </svg>
      </div>
    </div>
  )
}
