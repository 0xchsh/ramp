'use client'
import { MATERIALS } from '@/lib/materials'
import { useCardStore } from '@/store/cardStore'

export function MaterialPicker() {
  const { material, set } = useCardStore()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
      {MATERIALS.map((m) => {
        const active = material === m.id
        return (
          <button
            key={m.id}
            onClick={() => set({ material: m.id })}
            title={m.label}
            className="preset-swatch"
            data-active={active}
            style={{
              width: '100%', aspectRatio: '1.586', borderRadius: 5,
              background: active ? m.thumb : 'transparent',
              border: active ? 'none' : '1px solid rgba(0,0,0,0.12)',
              cursor: 'pointer',
              padding: active ? 2 : 0,
              transition: 'padding 220ms cubic-bezier(0.22, 1, 0.36, 1), background 220ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div
              style={{
                width: '100%', height: '100%',
                background: m.thumb,
                borderRadius: active ? 3 : 4,
                border: active ? '2px solid #ffffff' : 'none',
                boxSizing: 'border-box',
              }}
            />
          </button>
        )
      })}
    </div>
  )
}
