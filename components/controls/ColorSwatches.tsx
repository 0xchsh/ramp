'use client'
import { useCardStore } from '@/store/cardStore'
import { COLORS } from '@/lib/colors'

export function ColorSwatches() {
  const { baseColor, set } = useCardStore()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
      {COLORS.map((c) => {
        const active = baseColor.toLowerCase() === c.base.toLowerCase()
        return (
          <button
            key={c.label}
            onClick={() => set({ baseColor: c.base, baseColor2: c.base2 })}
            title={c.label}
            className="color-swatch"
            style={{
              width: '100%', aspectRatio: '1',
              borderRadius: '50%',
              background: active ? c.base : 'transparent',
              border: active ? 'none' : '1px solid #d4d4d8',
              padding: active ? 2 : 0,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '100%', height: '100%',
                borderRadius: '50%',
                background: c.base,
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
