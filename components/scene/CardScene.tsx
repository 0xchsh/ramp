'use client'
import { useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import { VirtualCard } from './VirtualCard'
import { useCardStore } from '@/store/cardStore'

function ReactiveContactShadows() {
  const { size } = useThree()
  const shadowDepth = useCardStore((s) => s.shadowDepth)
  const downloadMode = useCardStore((s) => s.downloadMode)
  const opacity = downloadMode ? 0 : shadowDepth * 0.7
  // The card mesh is scaled to ~0.6 on mobile via VirtualCard's fit logic, so
  // its bottom edge sits higher in world space. Bring the shadow plane up
  // and shrink it proportionally so there's no visible gap under the card.
  const isMobile = size.width < 768
  const y = isMobile ? -0.88 : -1.5
  const s = isMobile ? 0.6 : 1
  return (
    <>
      {/* Tight, dark core — stays close under the card */}
      <ContactShadows
        frames={Infinity}
        position={[0, y, 0]}
        scale={[5.5 * s, 3.5 * s]}
        blur={1.8}
        far={3}
        opacity={opacity * 0.7}
        color="#1a1a2e"
      />
      {/* Wide, soft halo — simulates ambient occlusion / penumbra */}
      <ContactShadows
        frames={Infinity}
        position={[0, y, 0]}
        scale={[9 * s, 6 * s]}
        blur={6}
        far={4}
        opacity={opacity * 0.35}
        color="#1a1a2e"
      />
    </>
  )
}

export function CardScene({ cameraZ = 8.8, noShadow = false }: { cameraZ?: number; noShadow?: boolean }) {
  const [canvasKey, setCanvasKey] = useState(0)

  return (
    <Canvas
      key={canvasKey}
      camera={{ position: [0, 0, cameraZ], fov: 40 }}
      dpr={[1, 2]}
      flat
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          setTimeout(() => setCanvasKey(k => k + 1), 300)
        })
      }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <directionalLight position={[-3, -2, -3]} intensity={0.2} />

      <VirtualCard />
      {!noShadow && <ReactiveContactShadows />}
      <Environment preset="city" />
    </Canvas>
  )
}
