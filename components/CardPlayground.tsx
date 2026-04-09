'use client'
import { useCallback } from 'react'
import dynamic from 'next/dynamic'
import { ControlPanel } from './controls/ControlPanel'

const CardScene = dynamic(() => import('./scene/CardScene').then(m => m.CardScene), { ssr: false })

export function CardPlayground() {
  const handleDownload = useCallback(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'card.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', minWidth: 500, minHeight: 400, position: 'relative', background: '#f5f5f5', overflow: 'hidden' }}>
      <ControlPanel />

      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Subtle radial gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(180,180,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="animate-canvas-fade">
          <CardScene />
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          width: 44,
          height: 44,
          borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
        title="Download card as PNG"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 2.25v9m0 0L5.25 7.5M9 11.25l3.75-3.75M3 14.25h12" stroke="rgba(0,0,0,0.65)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
