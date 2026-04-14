'use client'
import { MATERIALS } from '@/lib/materials'
import { useCardStore } from '@/store/cardStore'
import { useIsMobile } from '@/hooks/useIsMobile'

export function MaterialPicker() {
  const { material, set } = useCardStore()
  const isMobile = useIsMobile()
  // Mobile gets a chunkier corner radius so the swatches read as small cards
  // instead of tight chips — matches the beefier touch-target feel.
  const outerR = isMobile ? 12 : 5
  const innerR = isMobile ? 10 : 4
  const innerActiveR = isMobile ? 9 : 3

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, minWidth: 0 }}>
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
              width: '100%', aspectRatio: '1.586', minWidth: 0, borderRadius: outerR,
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
                borderRadius: active ? innerActiveR : innerR,
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
