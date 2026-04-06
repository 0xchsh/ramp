'use client'
import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import { VirtualCard } from './VirtualCard'
import { useCardStore } from '@/store/cardStore'

function ReactiveContactShadows() {
  const shadowDepth = useCardStore((s) => s.shadowDepth)
  const opacity = shadowDepth * 0.7
  return (
    <>
      {/* Tight, dark core — stays close under the card */}
      <ContactShadows
        frames={Infinity}
        position={[0, -1.5, 0]}
        scale={[5.5, 3.5]}
        blur={1.8}
        far={3}
        opacity={opacity * 0.7}
        color="#1a1a2e"
      />
      {/* Wide, soft halo — simulates ambient occlusion / penumbra */}
      <ContactShadows
        frames={Infinity}
        position={[0, -1.5, 0]}
        scale={[9, 6]}
        blur={6}
        far={4}
        opacity={opacity * 0.35}
        color="#1a1a2e"
      />
    </>
  )
}

export function CardScene() {
  const [canvasKey, setCanvasKey] = useState(0)

  return (
    <Canvas
      key={canvasKey}
      camera={{ position: [0, 0, 11], fov: 40 }}
      dpr={[1, 2]}
      flat
      gl={{ antialias: true }}
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
      <ReactiveContactShadows />
      <Environment preset="city" />
    </Canvas>
  )
}
