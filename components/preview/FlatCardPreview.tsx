'use client'
import { useState } from 'react'
import { useCardStore } from '@/store/cardStore'
import { RampLogo } from '../RampLogo'

function hexLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const toLin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b)
}

export function FlatCardPreview() {
  const { cardName, baseColor, baseColor2 } = useCardStore()
  const [flipped, setFlipped] = useState(false)

  const textDark = (hexLuminance(baseColor) + hexLuminance(baseColor2)) / 2 > 0.5
  const textColor = textDark ? 'rgba(30,30,30,0.85)' : 'rgba(245,245,245,0.92)'
  const stripeBg = textDark ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.22)'
  const displayName = (cardName || 'Charles Shin').toUpperCase()

  return (
    <div
      onClick={() => setFlipped(f => !f)}
      style={{
        width: 300, height: 188,
        perspective: 1200,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%', height: '100%',
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 800ms cubic-bezier(0.77, 0, 0.175, 1)',
        }}
      >
        {/* Front */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: 12,
            background: `linear-gradient(155deg, ${baseColor} 0%, ${baseColor2} 100%)`,
            boxShadow: '0 8px 28px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)',
            padding: 18,
            color: textColor,
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          {/* Top row: logo + VISA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <RampLogo height={14} color={textColor} />
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: '0.05em', fontStyle: 'italic' }}>
              VISA
            </div>
          </div>

          {/* Chip */}
          <div style={{
            marginTop: 16,
            width: 34, height: 26, borderRadius: 4,
            background: 'linear-gradient(135deg, #a67818 0%, #f4d87a 22%, #d4a43c 46%, #b88522 62%, #f7dd82 82%, #a67818 100%)',
            boxShadow: 'inset 0 0 0 0.5px rgba(90,60,0,0.6)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 2, borderRadius: 2, background: 'linear-gradient(140deg, #c7982e 0%, #f0d06a 25%, #b6831e 50%, #e8c25a 75%, #9c7214 100%)' }}>
              <div style={{ position: 'absolute', left: 2, right: 2, top: '33%', height: 0.75, background: 'rgba(70,45,0,0.55)' }} />
              <div style={{ position: 'absolute', left: 2, right: 2, top: '66%', height: 0.75, background: 'rgba(70,45,0,0.55)' }} />
              <div style={{ position: 'absolute', top: 2, bottom: 2, left: '50%', width: 0.75, background: 'rgba(70,45,0,0.55)' }} />
            </div>
          </div>

          {/* Card number */}
          <div style={{
            position: 'absolute', bottom: 42, left: 18,
            fontSize: 13, letterSpacing: '0.1em', fontWeight: 500,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontVariantNumeric: 'tabular-nums',
            opacity: 0.88,
          }}>
            4111 1111 1111 1234
          </div>
          {/* Name */}
          <div style={{
            position: 'absolute', bottom: 18, left: 18,
            fontSize: 10, letterSpacing: '0.06em', fontWeight: 500, opacity: 0.72,
          }}>
            {displayName}
          </div>
          {/* Expiry */}
          <div style={{
            position: 'absolute', bottom: 18, right: 18,
            fontSize: 10, letterSpacing: '0.06em', fontWeight: 500, opacity: 0.72,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontVariantNumeric: 'tabular-nums',
          }}>
            12/28
          </div>
        </div>

        {/* Back */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: 12,
            background: `linear-gradient(155deg, ${baseColor} 0%, ${baseColor2} 100%)`,
            boxShadow: '0 8px 28px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)',
            color: textColor,
            fontFamily: 'Inter, -apple-system, sans-serif',
            overflow: 'hidden',
          }}
        >
          {/* Magnetic stripe */}
          <div style={{ position: 'absolute', top: 22, left: 0, right: 0, height: 34, background: stripeBg }} />

          {/* Signature panel */}
          <div style={{
            position: 'absolute', top: 78, left: 18, right: 68, height: 26, borderRadius: 3,
            background: 'rgba(255,255,255,0.92)',
            display: 'flex', alignItems: 'center', padding: '0 10px',
            fontFamily: 'var(--font-signature), "Homemade Apple", cursive',
            fontSize: 14, color: 'rgba(20,20,30,0.82)',
          }}>
            {cardName || 'Charles Shin'}
          </div>

          {/* CVV */}
          <div style={{
            position: 'absolute', top: 78, right: 18, width: 42, height: 26, borderRadius: 3,
            background: 'rgba(255,255,255,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.82)', letterSpacing: '0.06em',
          }}>
            428
          </div>

          {/* Footer: logo + phone */}
          <div style={{
            position: 'absolute', bottom: 14, left: 18, right: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <RampLogo height={11} color={textColor} opacity={0.7} />
            <div style={{
              fontSize: 8, opacity: 0.55, letterSpacing: '0.04em',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}>
              +1 (888) 555-0199
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
