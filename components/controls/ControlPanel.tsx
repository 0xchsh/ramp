'use client'
import { SliderRow } from './SliderRow'
import { MaterialPicker } from './MaterialPicker'
import { ShaderPresetPicker } from './ShaderPresetPicker'
import { ColorSwatches } from './ColorSwatches'
import { useCardStore, HOLO_PATTERNS } from '@/store/cardStore'
import { randomizeCard } from '@/lib/randomize'

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ padding: '10px 14px 6px' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.55)', fontFamily: 'Inter, sans-serif', letterSpacing: 0 }}>
        {title}
      </span>
    </div>
  )
}


function HoloPatternPicker() {
  const { holoPattern, set } = useCardStore()
  return (
    <div style={{ padding: '0 14px 4px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
        {HOLO_PATTERNS.map(p => {
          const active = holoPattern === p
          return (
            <button
              key={p}
              onClick={() => set({ holoPattern: p })}
              className="pill-button"
              data-active={active}
              style={{
                height: 26, borderRadius: 5, padding: '0 6px',
                border: 'none',
                background: active ? '#18181b' : 'rgba(0,0,0,0.04)',
                cursor: 'pointer',
                fontSize: 11, fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                color: active ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.6)',
                textTransform: 'capitalize',
              }}
            >
              {p}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ControlPanel() {
  const store = useCardStore()
  const previewOpen = store.previewOpen
  return (
    <div
      style={{
        position: 'fixed', top: 16, left: 16, bottom: 16,
        width: 240,
        zIndex: 100,
        transform: previewOpen ? 'translateX(calc(-100% - 32px))' : 'translateX(0)',
        transition: 'transform 480ms cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform',
      }}
    >
    <div
      className="animate-panel-in"
      style={{
        width: '100%', height: '100%',
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 12,
        overflowY: 'auto',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        animationDelay: '0.4s',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px 4px',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.82)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>
          Customize Ramp Card
        </span>
      </div>

      {/* Name */}
      <div style={{ padding: '2px 10px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 10px', height: 32, borderRadius: 6,
          background: 'rgba(0,0,0,0.04)',
        }}>
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', fontFamily: 'Inter, sans-serif' }}>Name</span>
          <input
            value={store.cardName}
            onChange={e => store.set({ cardName: e.target.value })}
            placeholder="Charles Shin"
            style={{
              border: 'none', background: 'none', outline: 'none',
              fontSize: 12, fontFamily: 'Inter, sans-serif', color: 'rgba(0,0,0,0.75)',
              textAlign: 'right', width: 120, padding: 0,
            }}
          />
        </div>
      </div>

      {/* Randomize */}
      <div style={{ padding: '4px 10px 6px' }}>
        <button
          onClick={() => randomizeCard(store.set)}
          title="Randomize"
          aria-label="Randomize"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', height: 32, borderRadius: 6, border: 'none', cursor: 'pointer',
            background: 'rgba(0,0,0,0.04)', color: 'rgba(0,0,0,0.7)',
            fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" />
            <circle cx="5" cy="5" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="11" cy="5" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="8" cy="8" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="5" cy="11" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="11" cy="11" r="0.8" fill="currentColor" stroke="none" />
          </svg>
          Randomize
        </button>
      </div>

      {/* Material — surface type (matte, metal, glass, holo) */}
      <SectionTitle title="Material" />
      <div style={{ padding: '0 14px 10px' }}>
        <MaterialPicker />
      </div>

      {/* Color — curated pure-color swatches */}
      <SectionTitle title="Color" />
      <div style={{ padding: '0 14px 10px' }}>
        <ColorSwatches />
      </div>

      {/* Presets — whole-card shader shortcuts */}
      <SectionTitle title="Presets" />
      <div style={{ padding: '0 14px 8px' }}>
        <ShaderPresetPicker />
      </div>

      {/* Patterns — just the picker; tuning lives in Settings below */}
      <SectionTitle title="Patterns" />
      <HoloPatternPicker />

      {/* Settings — modifiers that shape whichever pattern is active */}
      <SectionTitle title="Settings" />
      <SliderRow label="Intensity" value={store.holoIntensity} onChange={v => store.set({ holoIntensity: v })} />
      <SliderRow label="Speed" value={store.holoSpeed} onChange={v => store.set({ holoSpeed: v })} />
      <SliderRow label="Scale" value={store.holoScale} onChange={v => store.set({ holoScale: v })} />
      <SliderRow label="Variance" value={store.holoVariance} onChange={v => store.set({ holoVariance: v })} />
      <SliderRow label="Rotation" value={store.holoRotation} onChange={v => store.set({ holoRotation: v })} />

      {/* Scene */}
      <SectionTitle title="Scene" />
      <SliderRow label="Shadow" value={store.shadowDepth} onChange={v => store.set({ shadowDepth: v })} />
      <div style={{ height: 16 }} />
    </div>
    </div>
  )
}
