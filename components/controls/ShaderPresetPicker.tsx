'use client'
import { SHADER_PRESETS, ShaderPresetKey } from '@/lib/shaderPresets'
import { useCardStore } from '@/store/cardStore'

export function ShaderPresetPicker() {
  const store = useCardStore()

  const isActive = (key: ShaderPresetKey) => {
    const v = SHADER_PRESETS[key].values
    return (
      store.holoPattern === v.holoPattern &&
      Math.abs(store.holoIntensity - v.holoIntensity) < 0.01 &&
      Math.abs(store.holoSpeed - v.holoSpeed) < 0.01 &&
      Math.abs(store.holoScale - v.holoScale) < 0.01 &&
      Math.abs(store.holoVariance - v.holoVariance) < 0.01 &&
      Math.abs(store.holoRotation - v.holoRotation) < 0.01
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
      {(Object.keys(SHADER_PRESETS) as ShaderPresetKey[]).map((key) => {
        const p = SHADER_PRESETS[key]
        const active = isActive(key)
        return (
          <button
            key={key}
            onClick={() => store.set(p.values)}
            title={p.label}
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
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
