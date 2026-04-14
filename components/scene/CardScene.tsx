'use client'
import { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import { VirtualCard } from './VirtualCard'
import { useCardStore } from '@/store/cardStore'

// Fires onReady once the canvas has valid dimensions and at least one frame has
// rendered. The size guard prevents premature firing when R3F hasn't measured
// the container yet (which happens on the very first render pass and produces
// NaN card dimensions — causing a visible flash before the correct size lands).
function ReadySignal({ onReady }: { onReady: () => void }) {
  const fired = useRef(false)
  const { size } = useThree()
  useFrame(() => {
    if (fired.current) return
    if (size.width === 0 || size.height === 0) return
    fired.current = true
    onReady()
  })
  return null
}

function ReactiveContactShadows() {
  const { size } = useThree()
  const shadowDepth = useCardStore((s) => s.shadowDepth)
  const downloadMode = useCardStore((s) => s.downloadMode)
  // Mobile hides the shadow entirely — the floating card reads cleaner on
  // small screens where the contact plane felt overcommitted.
  if (size.width < 768) return null
  const opacity = downloadMode ? 0 : shadowDepth * 0.7
  const y = -1.5
  const s = 1
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

export function CardScene({
  cameraZ = 8.8,
  noShadow = false,
  onReady,
}: {
  cameraZ?: number
  noShadow?: boolean
  onReady?: () => void
}) {
  const [canvasKey, setCanvasKey] = useState(0)

  return (
    <Canvas
      key={canvasKey}
      camera={{ position: [0, 0, cameraZ], fov: 40 }}
      dpr={[1, 2]}
      flat
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      // react-use-measure (used internally by R3F Canvas) calls getBoundingClientRect()
      // which includes CSS transform effects from ancestor elements. Two problems:
      //
      // 1. The intro animation starts at scale(0.9). When R3F first mounts, the
      //    ResizeObserver fires and getBoundingClientRect() returns 90% dimensions.
      //    After the intro plays to scale(1), ResizeObserver never re-fires (layout
      //    size didn't change), so R3F keeps the wrong 90% value → card off-center.
      //
      // 2. On mobile, scrolling the settings sheet triggers a window scroll event.
      //    The card wrapper has scale(0.62), so getBoundingClientRect() returns 62%
      //    dimensions → drei misplaces the HTML overlay (upper-left displacement).
      //
      // Fix: offsetSize:true → use offsetWidth/offsetHeight (layout dimensions,
      // immune to CSS transforms). scroll:false → skip window scroll re-measurement.
      resize={{ scroll: false, offsetSize: true }}
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
      {onReady && <ReadySignal onReady={onReady} />}
    </Canvas>
  )
}
