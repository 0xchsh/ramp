'use client'
import dynamic from 'next/dynamic'
import { ControlPanel } from './controls/ControlPanel'

const CardScene = dynamic(() => import('./scene/CardScene').then(m => m.CardScene), { ssr: false })

export function CardPlayground() {
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
    </div>
  )
}
