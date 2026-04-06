'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import { SliderRow } from './SliderRow'
import { PresetPicker } from './PresetPicker'
import { useCardStore } from '@/store/cardStore'

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 14px', background: 'none', border: 'none',
        borderBottom: '1px solid rgba(0,0,0,0.07)', cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.38)', fontFamily: 'Inter, sans-serif' }}>
        {title}
      </span>
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.18s' }}>
        <path d="M1 1L5 5L9 1" stroke="rgba(0,0,0,0.28)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', height: 40 }}>
      <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.75)', fontFamily: 'Inter, sans-serif' }}>{label}</span>
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.07)', borderRadius: 6, padding: 2, gap: 2 }}>
        {(['Off', 'On'] as const).map((opt) => {
          const active = (opt === 'On') === value
          return (
            <button
              key={opt}
              onClick={() => onChange(opt === 'On')}
              style={{
                padding: '3px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11,
                fontFamily: 'Inter, sans-serif', fontWeight: 500,
                background: active ? '#fff' : 'transparent',
                color: active ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.35)',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ControlPanel() {
  const store = useCardStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const origin = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const [pos, setPos] = useState({ x: 800, y: 80 })
  const [autoHolo, setAutoHolo] = useState(true)
  const [sections, setSections] = useState({ material: true, shader: true, effects: true })
  const toggleSection = (key: keyof typeof sections) => setSections(s => ({ ...s, [key]: !s[key] }))

  useEffect(() => { setPos({ x: window.innerWidth - 260, y: 80 }) }, [])

  const onHeaderDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    origin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pos])

  const onHeaderMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    setPos({ x: origin.current.px + (e.clientX - origin.current.mx), y: origin.current.py + (e.clientY - origin.current.my) })
  }, [])

  const onHeaderUp = useCallback(() => { dragging.current = false }, [])

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed', left: pos.x, top: pos.y, width: 240,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 12,
        zIndex: 100,
        boxShadow: '0 4px 24px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        onPointerDown={onHeaderDown}
        onPointerMove={onHeaderMove}
        onPointerUp={onHeaderUp}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', cursor: 'grab', userSelect: 'none',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.82)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>
          Card Controls
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,0,0,0.18)' }} />
          ))}
        </div>
      </div>

      <SectionHeader title="Material" open={sections.material} onToggle={() => toggleSection('material')} />
      {sections.material && (
        <div style={{ padding: '10px 14px 12px' }}>
          <PresetPicker />
        </div>
      )}

      <SectionHeader title="Shader" open={sections.shader} onToggle={() => toggleSection('shader')} />
      {sections.shader && (
        <div>
          <SliderRow label="Holo" value={store.holoIntensity} onChange={v => store.set({ holoIntensity: v })} accentColor="rgba(103,200,249,0.25)" />
          <SliderRow label="Noise" value={store.noiseIntensity} onChange={v => store.set({ noiseIntensity: v })} accentColor="rgba(220,100,180,0.2)" />
          <SliderRow label="Glow" value={store.glowIntensity} onChange={v => store.set({ glowIntensity: v })} accentColor="rgba(251,180,36,0.25)" />
        </div>
      )}

      <SectionHeader title="Effects" open={sections.effects} onToggle={() => toggleSection('effects')} />
      {sections.effects && (
        <div>
          <SliderRow label="Shadow" value={store.shadowDepth} onChange={v => store.set({ shadowDepth: v })} accentColor="rgba(100,120,160,0.2)" />
          <ToggleRow label="Auto Holo" value={autoHolo} onChange={setAutoHolo} />
        </div>
      )}
    </div>
  )
}
