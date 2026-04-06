'use client'
import dynamic from 'next/dynamic'
import { ControlPanel } from './controls/ControlPanel'

const CardScene = dynamic(() => import('./scene/CardScene').then(m => m.CardScene), { ssr: false })

export function CardPlayground() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#f5f5f5' }}>
      <CardScene />

      {/* Subtle radial gradient bg */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(180,180,255,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <ControlPanel />
    </div>
  )
}
