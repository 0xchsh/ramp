'use client'
import { useCallback } from 'react'

interface SliderRowProps {
  label: string
  value: number         // 0–1
  onChange: (v: number) => void
  accentColor?: string
}

export function SliderRow({ label, value, onChange, accentColor = 'rgba(0, 0, 0, 0.08)' }: SliderRowProps) {
  // Absolute-position slider: click anywhere to snap to that value, drag to
  // continue scrubbing. Window-level listeners keep the slider responsive even
  // when the cursor leaves the track, panel, or browser window.
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const rect = e.currentTarget.getBoundingClientRect()
      const compute = (clientX: number) =>
        Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))

      onChange(compute(e.clientX))

      const handleMove = (ev: PointerEvent) => onChange(compute(ev.clientX))
      const handleUp = () => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
        window.removeEventListener('pointercancel', handleUp)
      }

      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
      window.addEventListener('pointercancel', handleUp)
    },
    [onChange],
  )

  return (
    <div style={{ padding: '3px 14px' }}>
      <div
        style={{
          position: 'relative', height: 32,
          display: 'flex', alignItems: 'center',
          cursor: 'ew-resize', userSelect: 'none',
          borderRadius: 6, background: 'rgba(0,0,0,0.04)', overflow: 'hidden',
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
      >
        <div
          className="slider-fill"
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%',
            transform: `scaleX(${value})`, background: accentColor,
            borderRadius: '0 2px 2px 0',
          }}
        />
        <span style={{ position: 'relative', flex: 1, paddingLeft: 10, fontSize: 12, color: 'rgba(0,0,0,0.75)', fontFamily: 'Inter, sans-serif' }}>
          {label}
        </span>
        <span style={{ position: 'relative', paddingRight: 10, fontSize: 12, color: 'rgba(0,0,0,0.38)', fontFamily: 'Inter, sans-serif', minWidth: 38, textAlign: 'right' }}>
          {value.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
