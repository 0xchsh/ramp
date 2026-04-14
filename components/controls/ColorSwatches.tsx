'use client'
import { useCardStore } from '@/store/cardStore'
import { COLORS } from '@/lib/colors'

// Swatches that are too light to see against the panel background get a
// thin zinc outline so they read as distinct circles.
function isNearWhite(hex: string): boolean {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r + g + b) / 3 > 230
}

export function ColorSwatches() {
  const { baseColor, set } = useCardStore()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, minWidth: 0 }}>
      {COLORS.map((c) => {
        const active = baseColor.toLowerCase() === c.base.toLowerCase()
        const needsOutline = isNearWhite(c.base)
        const whiteActive = active && needsOutline
        return (
          <button
            key={c.label}
            onClick={() => set({ baseColor: c.base, baseColor2: c.base2 })}
            title={c.label}
            className="color-swatch"
            style={{
              width: '100%', aspectRatio: '1', minWidth: 0,
              borderRadius: '50%',
              background: active ? c.base : 'transparent',
              border: whiteActive
                ? '1.5px solid #18181b'
                : active
                  ? 'none'
                  : '1px solid #d4d4d8',
              padding: active && !whiteActive ? 2 : 0,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '100%', height: '100%',
                borderRadius: '50%',
                background: c.base,
                border: active && !whiteActive
                  ? '2px solid #ffffff'
                  : (!active && needsOutline)
                    ? '1px solid #d4d4d8'
                    : 'none',
                boxSizing: 'border-box',
              }}
            />
          </button>
        )
      })}
    </div>
  )
}
