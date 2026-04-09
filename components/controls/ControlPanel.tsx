'use client'
import { useState } from 'react'
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
        cursor: 'pointer',
        transition: 'transform 0.12s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)' }}
      onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = '' }}
      onPointerLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = '' }}
    >
      <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(0,0,0,0.75)', fontFamily: 'Inter, sans-serif' }}>
        {title}
      </span>
    </button>
  )
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', height: 40 }}>
      <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.75)', fontFamily: 'Inter, sans-serif' }}>{label}</span>
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.06)', borderRadius: 6, padding: 2, gap: 2 }}>
        {(['Off', 'On'] as const).map((opt) => {
          const active = (opt === 'On') === value
          return (
            <button
              key={opt}
              className="toggle-pill"
              onClick={() => onChange(opt === 'On')}
              style={{
                padding: '3px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11,
                fontFamily: 'Inter, sans-serif', fontWeight: 500,
                background: active ? '#fff' : 'transparent',
                color: active ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.35)',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.14)' : 'none',
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
  const [autoHolo, setAutoHolo] = useState(true)
  const [sections, setSections] = useState({
    material: true,
    shader: true,
    surface: false,
    lighting: false,
    effects: true,
  })
  const toggleSection = (key: keyof typeof sections) => setSections(s => ({ ...s, [key]: !s[key] }))

  return (
    <div
      className="animate-panel-in"
      style={{
        position: 'fixed', top: 16, left: 16, bottom: 16,
        width: 240,
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 12,
        overflowY: 'auto',
        zIndex: 100,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        animationDelay: '0.4s',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.82)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>
          Card Controls
        </span>
      </div>

      {/* Name */}
      <div style={{ padding: '6px 10px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 10px', height: 32, borderRadius: 6,
          background: 'rgba(0,0,0,0.04)',
        }}>
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', fontFamily: 'Inter, sans-serif' }}>Name</span>
          <input
            value={store.cardName}
            onChange={e => store.set({ cardName: e.target.value })}
            placeholder="Untitled"
            style={{
              border: 'none', background: 'none', outline: 'none',
              fontSize: 12, fontFamily: 'Inter, sans-serif', color: 'rgba(0,0,0,0.75)',
              textAlign: 'right', width: 120, padding: 0,
            }}
          />
        </div>
      </div>

      {/* Material */}
      <div className="animate-fade-up" style={{ animationDelay: '0.45s' }}>
        <SectionHeader title="Material" open={sections.material} onToggle={() => toggleSection('material')} />
        <div className="section-content" data-collapsed={!sections.material}>
          <div>
            <div style={{ padding: '10px 14px 12px' }}>
              <PresetPicker />
            </div>
          </div>
        </div>
      </div>

      {/* Shader */}
      <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
        <SectionHeader title="Shader" open={sections.shader} onToggle={() => toggleSection('shader')} />
        <div className="section-content" data-collapsed={!sections.shader}>
          <div>
            <SliderRow label="Holo" value={store.holoIntensity} onChange={v => store.set({ holoIntensity: v })} />
            <SliderRow label="Noise" value={store.noiseIntensity} onChange={v => store.set({ noiseIntensity: v })} />
            <SliderRow label="Glow" value={store.glowIntensity} onChange={v => store.set({ glowIntensity: v })} />
            <SliderRow label="Iridescence" value={store.iridescence} onChange={v => store.set({ iridescence: v })} />
            <SliderRow label="Gradient Wave" value={store.gradientWave} onChange={v => store.set({ gradientWave: v })} />
          </div>
        </div>
      </div>

      {/* Surface */}
      <div className="animate-fade-up" style={{ animationDelay: '0.55s' }}>
        <SectionHeader title="Surface" open={sections.surface} onToggle={() => toggleSection('surface')} />
        <div className="section-content" data-collapsed={!sections.surface}>
          <div>
            <SliderRow label="Brushed Metal" value={store.brushedMetal} onChange={v => store.set({ brushedMetal: v })} />
            <SliderRow label="Carbon Fiber" value={store.carbonFiber} onChange={v => store.set({ carbonFiber: v })} />
            <SliderRow label="Sparkle" value={store.sparkle} onChange={v => store.set({ sparkle: v })} />
            <SliderRow label="Parallax Depth" value={store.parallaxDepth} onChange={v => store.set({ parallaxDepth: v })} />
          </div>
        </div>
      </div>

      {/* Lighting */}
      <div className="animate-fade-up" style={{ animationDelay: '0.6s' }}>
        <SectionHeader title="Lighting" open={sections.lighting} onToggle={() => toggleSection('lighting')} />
        <div className="section-content" data-collapsed={!sections.lighting}>
          <div>
            <SliderRow label="Rim Light" value={store.rimLight} onChange={v => store.set({ rimLight: v })} />
            <SliderRow label="Caustics" value={store.caustics} onChange={v => store.set({ caustics: v })} />
            <SliderRow label="Scanline" value={store.scanline} onChange={v => store.set({ scanline: v })} />
          </div>
        </div>
      </div>

      {/* Effects */}
      <div className="animate-fade-up" style={{ animationDelay: '0.65s' }}>
        <SectionHeader title="Effects" open={sections.effects} onToggle={() => toggleSection('effects')} />
        <div className="section-content" data-collapsed={!sections.effects}>
          <div>
            <SliderRow label="Shadow" value={store.shadowDepth} onChange={v => store.set({ shadowDepth: v })} />
            <ToggleRow label="Auto Holo" value={autoHolo} onChange={setAutoHolo} />
          </div>
        </div>
      </div>
    </div>
  )
}
