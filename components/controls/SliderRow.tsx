'use client'
import { useRef, useCallback } from 'react'

interface SliderRowProps {
  label: string
  value: number         // 0–1
  onChange: (v: number) => void
  accentColor?: string
}

export function SliderRow({ label, value, onChange, accentColor = 'rgba(0, 0, 0, 0.08)' }: SliderRowProps) {
  const dragging = useRef(false)
  const lastX = useRef(0)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    lastX.current = e.clientX
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - lastX.current
    lastX.current = e.clientX
    onChange(Math.min(1, Math.max(0, value + dx * 0.006)))
  }, [value, onChange])

  const onPointerUp = useCallback(() => { dragging.current = false }, [])

  return (
    <div style={{ padding: '3px 10px' }}>
      <div
        style={{ position: 'relative', height: 32, display: 'flex', alignItems: 'center', cursor: 'ew-resize', userSelect: 'none', borderRadius: 6, background: 'rgba(0,0,0,0.04)', overflow: 'hidden' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="slider-fill" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', transform: `scaleX(${value})`, background: accentColor, borderRadius: '0 2px 2px 0' }} />
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
