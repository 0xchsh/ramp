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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
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
                width: '100%', aspectRatio: '1.586', borderRadius: 3,
                background: p.swatch,
                border: active ? '1.5px solid rgba(0,0,0,0.7)' : '1.5px solid rgba(0,0,0,0.1)',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
