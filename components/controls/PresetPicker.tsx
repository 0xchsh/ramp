'use client'
import { PRESETS, PresetKey } from '@/lib/presets'
import { useCardStore } from '@/store/cardStore'

export function PresetPicker() {
  const { preset, set } = useCardStore()

  const handleSelect = (key: PresetKey) => {
    const p = PRESETS[key]
    set({ preset: key, ...p.shaderDefaults })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 9, color: 'rgba(0,0,0,0.38)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
        Material
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(Object.keys(PRESETS) as PresetKey[]).map((key) => {
          const p = PRESETS[key]
          const active = preset === key
          return (
            <button
              key={key}
              className="preset-swatch"
              data-active={active}
              onClick={() => handleSelect(key)}
              title={p.label}
              style={{
                width: 22, height: 22, borderRadius: '50%',
                background: p.swatch,
                border: active ? '2px solid rgba(0,0,0,0.7)' : '2px solid rgba(0,0,0,0.12)',
                cursor: 'pointer',
                boxShadow: active ? '0 0 0 3px rgba(0,0,0,0.08)' : 'none',
                padding: 0,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
