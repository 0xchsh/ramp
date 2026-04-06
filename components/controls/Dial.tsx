'use client'
import { useDrag } from '@/hooks/useDrag'
import { useCallback } from 'react'

interface DialProps {
  label: string
  value: number          // 0–1
  onChange: (v: number) => void
  color?: string
}

const SIZE = 52
const STROKE = 4
const R = (SIZE - STROKE) / 2 - 2
const GAP_DEG = 60    // degrees left open at bottom
const ARC_DEG = 360 - GAP_DEG

function polarToXY(deg: number) {
  const rad = (deg - 90) * (Math.PI / 180)
  const cx = SIZE / 2
  const cy = SIZE / 2
  return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) }
}

export function Dial({ label, value, onChange, color = '#ffffff' }: DialProps) {
  const handleDelta = useCallback((dy: number) => {
    onChange(Math.min(1, Math.max(0, value + dy * 0.008)))
  }, [value, onChange])

  const { onPointerDown, onPointerMove, onPointerUp } = useDrag(handleDelta)

  const startDeg = 90 + GAP_DEG / 2
  const endDeg   = startDeg + ARC_DEG
  const start = polarToXY(startDeg)
  const end   = polarToXY(endDeg)
  const filled = polarToXY(startDeg + value * ARC_DEG)

  const cx = SIZE / 2
  const cy = SIZE / 2

  const trackPath = `M ${start.x} ${start.y} A ${R} ${R} 0 1 1 ${end.x} ${end.y}`
  const fillPath  = `M ${start.x} ${start.y} A ${R} ${R} 0 ${value > 0.5 ? 1 : 0} 1 ${filled.x} ${filled.y}`

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'ns-resize', userSelect: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <svg width={SIZE} height={SIZE} style={{ display: 'block' }}>
        {/* Track */}
        <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={STROKE} strokeLinecap="round" />
        {/* Fill */}
        {value > 0.01 && (
          <path d={fillPath} fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
        )}
        {/* Center value */}
        <text x={cx} y={cy + 5} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11" fontFamily="Inter, sans-serif">
          {Math.round(value * 100)}
        </text>
      </svg>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
    </div>
  )
}
