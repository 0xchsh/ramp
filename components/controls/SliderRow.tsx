'use client'
import { useCallback } from 'react'

interface SliderRowProps {
  label: string
  value: number         // 0–1
  onChange: (v: number) => void
  accentColor?: string
}

export function SliderRow({ label, value, onChange, accentColor = 'rgba(0, 0, 0, 0.08)' }: SliderRowProps) {
  // Drag handler uses window-level listeners so the slider keeps receiving
  // events even when the cursor leaves the element, the panel, or the browser
  // window entirely. The current value is tracked in a local closure variable
  // instead of reading the React prop on every move, so fast drags aren't
  // throttled by React render batching.
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      let lastX = e.clientX
      let current = value

      const handleMove = (ev: PointerEvent) => {
        const dx = ev.clientX - lastX
        lastX = ev.clientX
        current = Math.min(1, Math.max(0, current + dx * 0.006))
        onChange(current)
      }

      const handleUp = () => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
        window.removeEventListener('pointercancel', handleUp)
      }

      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
      window.addEventListener('pointercancel', handleUp)
    },
    [value, onChange],
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
