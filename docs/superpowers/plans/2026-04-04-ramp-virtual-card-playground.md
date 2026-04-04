# Ramp Virtual Card Playground — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js app with a floating, interactive 3D Ramp Visa card rendered via WebGL/GLSL shaders, controlled by a DialKit-inspired floating panel of dials and toggles.

**Architecture:** A React Three Fiber canvas fills the viewport and renders a rounded-rectangle card mesh with a custom GLSL shader (holographic iridescent sheen, noise, Fresnel glow). Mouse movement drives a spring-animated tilt. A floating control panel — built with SVG circular dials and toggles — passes uniform values into the shader and animation state via Zustand.

**Tech Stack:** Next.js 14 (App Router), React Three Fiber, @react-three/drei, @react-spring/three, @react-spring/web, Three.js, Zustand, Tailwind CSS, TypeScript.

---

## File Map

```
app/
  layout.tsx               — root layout, sets dark bg, loads fonts
  page.tsx                 — mounts <CardPlayground />
  globals.css              — Tailwind base + CSS vars

components/
  CardPlayground.tsx       — layout shell: canvas left, panel right
  scene/
    CardScene.tsx          — R3F <Canvas> with lighting, post-processing
    VirtualCard.tsx        — card mesh + spring tilt + shader material
    CardShaderMaterial.tsx — shaderMaterial() definition (drei)
  controls/
    ControlPanel.tsx       — floating draggable panel shell
    Dial.tsx               — SVG circular drag-to-rotate knob
    Toggle.tsx             — pill toggle switch
    PresetPicker.tsx       — card material preset buttons

shaders/
  card.vert.glsl           — vertex shader (UV, normals, position)
  card.frag.glsl           — fragment shader (holographic, noise, Fresnel)

store/
  cardStore.ts             — Zustand store for all card state

hooks/
  useMouseParallax.ts      — normalized mouse position for tilt
  useDrag.ts               — pointer drag delta for Dial component

lib/
  roundedRect.ts           — BufferGeometry helper for rounded rectangle
```

---

### Task 1: Project Bootstrap

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`

- [ ] **Step 1: Init Next.js project**

```bash
cd /Users/carloshin/Projects/ramp
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-git
```

- [ ] **Step 2: Install dependencies**

```bash
npm install three @react-three/fiber @react-three/drei @react-spring/three @react-spring/web zustand
npm install --save-dev @types/three
```

- [ ] **Step 3: Update `app/layout.tsx`**

Set background to near-black (`#0a0a0a`), load `Inter` from next/font, set `overflow: hidden` on body so the canvas fills the viewport without scrollbars.

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ramp Card Playground',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a0a] overflow-hidden`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Stub `app/page.tsx`**

```tsx
export default function Home() {
  return <div className="w-screen h-screen flex items-center justify-center text-white">Hello</div>
}
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```
Expected: page loads at localhost:3000 with "Hello".

- [ ] **Step 6: Commit**

```bash
git init && git add -A && git commit -m "chore: bootstrap Next.js project with deps"
```

---

### Task 2: Zustand State Store

**Files:**
- Create: `store/cardStore.ts`

All shader uniforms and animation state live here so every component reads from one source.

- [ ] **Step 1: Write `store/cardStore.ts`**

```ts
import { create } from 'zustand'

export type CardPreset = 'white' | 'black' | 'holographic' | 'metal' | 'midnight' | 'aurora'

interface CardState {
  // Tilt
  tiltSensitivity: number        // 0–1, scales mouse parallax
  // Shader
  holoIntensity: number          // 0–1
  noiseIntensity: number         // 0–1
  glowIntensity: number          // 0–1
  // Float animation
  floatHeight: number            // 0–1 (maps to amplitude)
  floatSpeed: number             // 0–1
  // Shadow
  shadowDepth: number            // 0–1
  // Material preset
  preset: CardPreset
  // Actions
  set: (patch: Partial<Omit<CardState, 'set'>>) => void
}

export const useCardStore = create<CardState>((set) => ({
  tiltSensitivity: 0.5,
  holoIntensity: 0.6,
  noiseIntensity: 0.3,
  glowIntensity: 0.4,
  floatHeight: 0.5,
  floatSpeed: 0.4,
  shadowDepth: 0.5,
  preset: 'white',
  set: (patch) => set(patch),
}))
```

- [ ] **Step 2: Commit**

```bash
git add store/cardStore.ts
git commit -m "feat: add Zustand card state store"
```

---

### Task 3: Rounded Rectangle Geometry

**Files:**
- Create: `lib/roundedRect.ts`

Three.js doesn't have a built-in rounded rectangle mesh. This helper creates a `BufferGeometry` using `Shape` + `ShapePath`.

- [ ] **Step 1: Write `lib/roundedRect.ts`**

```ts
import * as THREE from 'three'

export function createRoundedRectGeometry(
  width: number,
  height: number,
  radius: number,
  segments = 4
): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  const x = -width / 2
  const y = -height / 2
  const w = width
  const h = height
  const r = radius

  shape.moveTo(x + r, y)
  shape.lineTo(x + w - r, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + r)
  shape.lineTo(x + w, y + h - r)
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  shape.lineTo(x + r, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)

  const geometry = new THREE.ShapeGeometry(shape, segments)
  return geometry
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/roundedRect.ts
git commit -m "feat: rounded rectangle BufferGeometry helper"
```

---

### Task 4: Card GLSL Shaders

**Files:**
- Create: `shaders/card.vert.glsl`
- Create: `shaders/card.frag.glsl`

The vertex shader passes UVs and world-space normals. The fragment shader computes:
1. Base color from preset uniform
2. Holographic rainbow layer (view-angle iridescence using `dot(normal, viewDir)`)
3. Fresnel glow on edges
4. Simplex-style noise for surface grain

- [ ] **Step 1: Create `shaders/card.vert.glsl`**

```glsl
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

- [ ] **Step 2: Create `shaders/card.frag.glsl`**

```glsl
uniform float uTime;
uniform vec3  uBaseColor;
uniform vec3  uBaseColor2;
uniform float uHoloIntensity;
uniform float uNoiseIntensity;
uniform float uGlowIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

// --- Noise helpers ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0,i1.y,1.0)) + i.x + vec3(0.0,i1.x,1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// --- Holographic rainbow ---
vec3 holo(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.333, 0.667)));
}

void main() {
  // --- View direction ---
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);

  // --- Base gradient ---
  vec3 base = mix(uBaseColor, uBaseColor2, vUv.y);

  // --- Holographic layer ---
  float holoAngle = dot(vNormal, viewDir) + uTime * 0.2;
  float holoNoise = snoise(vUv * 3.0 + uTime * 0.15) * 0.5 + 0.5;
  vec3 rainbow = holo(holoAngle * 0.5 + holoNoise * 0.3);
  base = mix(base, rainbow, uHoloIntensity * (0.4 + holoNoise * 0.6));

  // --- Surface noise / grain ---
  float grain = snoise(vUv * 80.0 + uTime * 0.05);
  base += grain * uNoiseIntensity * 0.08;

  // --- Fresnel edge glow ---
  base += fresnel * uGlowIntensity * 0.6;

  // --- Specular highlight ---
  vec3 lightDir = normalize(vec3(1.0, 1.5, 2.0));
  float spec = pow(max(dot(reflect(-lightDir, vNormal), viewDir), 0.0), 32.0);
  base += spec * 0.3;

  gl_FragColor = vec4(base, 1.0);
}
```

- [ ] **Step 3: Configure Next.js to handle `.glsl` files**

Install raw-loader and update `next.config.ts`:

```bash
npm install --save-dev raw-loader
```

`next.config.ts`:
```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.(glsl|vert|frag)$/,
      use: 'raw-loader',
    })
    return config
  },
}

export default nextConfig
```

Add to `types/glsl.d.ts`:
```ts
declare module '*.glsl' { const src: string; export default src }
declare module '*.vert' { const src: string; export default src }
declare module '*.frag' { const src: string; export default src }
```

- [ ] **Step 4: Commit**

```bash
git add shaders/ next.config.ts types/ lib/
git commit -m "feat: GLSL shaders + webpack raw-loader config"
```

---

### Task 5: Card Shader Material + Mouse Hook

**Files:**
- Create: `components/scene/CardShaderMaterial.tsx`
- Create: `hooks/useMouseParallax.ts`

- [ ] **Step 1: Write `hooks/useMouseParallax.ts`**

Returns normalized `{ x, y }` in range [-1, 1] based on mouse position relative to viewport center.

```ts
'use client'
import { useEffect, useRef } from 'react'

export function useMouseParallax() {
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', handle)
    return () => window.removeEventListener('mousemove', handle)
  }, [])

  return mouse
}
```

- [ ] **Step 2: Write `components/scene/CardShaderMaterial.tsx`**

Use `shaderMaterial` from `@react-three/drei` to declare the material once and extend Three.js:

```tsx
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'
import vertSrc from '@/shaders/card.vert.glsl'
import fragSrc from '@/shaders/card.frag.glsl'

export const CardMaterial = shaderMaterial(
  {
    uTime: 0,
    uBaseColor: new THREE.Color('#f5f4f0'),
    uBaseColor2: new THREE.Color('#e8e6e0'),
    uHoloIntensity: 0.6,
    uNoiseIntensity: 0.3,
    uGlowIntensity: 0.4,
  },
  vertSrc,
  fragSrc
)

extend({ CardMaterial })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      cardMaterial: any
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add components/scene/CardShaderMaterial.tsx hooks/useMouseParallax.ts
git commit -m "feat: card shader material + mouse parallax hook"
```

---

### Task 6: Virtual Card Mesh

**Files:**
- Create: `components/scene/VirtualCard.tsx`

Renders the card geometry with the shader, spring-animated tilt from mouse, floating bob animation, Ramp/VISA text overlaid via `<Html>` from drei, card details (number, name, expiry).

- [ ] **Step 1: Write `components/scene/VirtualCard.tsx`**

```tsx
'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'
import { createRoundedRectGeometry } from '@/lib/roundedRect'
import './CardShaderMaterial'
import { useCardStore } from '@/store/cardStore'
import { useMouseParallax } from '@/hooks/useMouseParallax'
import { PRESETS } from '@/lib/presets'

const CARD_W = 3.37
const CARD_H = 2.125
const CARD_R = 0.12

const geometry = createRoundedRectGeometry(CARD_W, CARD_H, CARD_R, 8)

export function VirtualCard() {
  const matRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)
  const mouse = useMouseParallax()
  const { tiltSensitivity, holoIntensity, noiseIntensity, glowIntensity,
          floatHeight, floatSpeed, preset } = useCardStore()

  const colors = PRESETS[preset]

  useFrame(({ clock }) => {
    if (!matRef.current) return
    const t = clock.getElapsedTime()
    matRef.current.uTime = t
    matRef.current.uHoloIntensity = holoIntensity
    matRef.current.uNoiseIntensity = noiseIntensity
    matRef.current.uGlowIntensity = glowIntensity
    matRef.current.uBaseColor.set(colors.base)
    matRef.current.uBaseColor2.set(colors.base2)

    // Float bob
    const amp = floatHeight * 0.15
    const freq = floatSpeed * 0.8 + 0.2
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * freq) * amp
    }

    // Mouse tilt
    const sens = tiltSensitivity * 0.4
    if (groupRef.current) {
      groupRef.current.rotation.x += ((-mouse.current.y * sens) - groupRef.current.rotation.x) * 0.08
      groupRef.current.rotation.y += ((mouse.current.x * sens) - groupRef.current.rotation.y) * 0.08
    }
  })

  const textColor = colors.textDark ? '#1a1a1a' : '#f0f0f0'

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <cardMaterial ref={matRef} />
      </mesh>

      {/* Card UI overlay */}
      <Html
        center
        style={{ width: `${CARD_W * 96}px`, height: `${CARD_H * 96}px`, pointerEvents: 'none' }}
      >
        <div style={{ width: '100%', height: '100%', position: 'relative', color: textColor, fontFamily: 'Inter, sans-serif' }}>
          {/* Ramp logo */}
          <div style={{ position: 'absolute', top: 20, left: 24, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 15, letterSpacing: '-0.02em' }}>
            ramp
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          {/* VISA logo */}
          <div style={{ position: 'absolute', top: 18, right: 22, fontWeight: 900, fontSize: 20, letterSpacing: '0.05em', fontStyle: 'italic' }}>
            VISA
          </div>
          {/* Chip */}
          <div style={{ position: 'absolute', top: 68, left: 24, width: 36, height: 28, borderRadius: 4, background: colors.textDark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)', border: `1px solid ${colors.textDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)'}` }} />
          {/* Card number */}
          <div style={{ position: 'absolute', bottom: 48, left: 24, fontSize: 13, letterSpacing: '0.15em', fontWeight: 500, opacity: 0.85 }}>
            4111  1111  1111  1234
          </div>
          {/* Name + expiry */}
          <div style={{ position: 'absolute', bottom: 20, left: 24, fontSize: 11, letterSpacing: '0.05em', opacity: 0.7, fontWeight: 500 }}>
            CARLOS HINOJOSA
          </div>
          <div style={{ position: 'absolute', bottom: 20, right: 22, fontSize: 11, letterSpacing: '0.05em', opacity: 0.7, fontWeight: 500 }}>
            12/28
          </div>
        </div>
      </Html>
    </group>
  )
}
```

- [ ] **Step 2: Create `lib/presets.ts`**

```ts
export type PresetKey = 'white' | 'black' | 'holographic' | 'metal' | 'midnight' | 'aurora'

interface Preset {
  base: string
  base2: string
  textDark: boolean
  label: string
  swatch: string
}

export const PRESETS: Record<PresetKey, Preset> = {
  white: {
    base: '#f5f4f0', base2: '#e2e0d8',
    textDark: true, label: 'White', swatch: '#f5f4f0',
  },
  black: {
    base: '#1a1a1a', base2: '#0a0a0a',
    textDark: false, label: 'Black', swatch: '#1a1a1a',
  },
  holographic: {
    base: '#c0a0ff', base2: '#80d0ff',
    textDark: false, label: 'Holo', swatch: 'linear-gradient(135deg,#c0a0ff,#80d0ff,#a0ffcc)',
  },
  metal: {
    base: '#c8c4be', base2: '#8a8680',
    textDark: true, label: 'Metal', swatch: '#c8c4be',
  },
  midnight: {
    base: '#1a1f3a', base2: '#0d1020',
    textDark: false, label: 'Midnight', swatch: '#1a1f3a',
  },
  aurora: {
    base: '#0d3b2e', base2: '#1a0a2e',
    textDark: false, label: 'Aurora', swatch: 'linear-gradient(135deg,#0d3b2e,#1a0a2e)',
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add components/scene/VirtualCard.tsx lib/presets.ts
git commit -m "feat: virtual card mesh with shader, tilt, float, card details"
```

---

### Task 7: R3F Scene + Post-Processing

**Files:**
- Create: `components/scene/CardScene.tsx`

Wraps the Canvas, adds ambient + directional lights, bloom post-processing via `@react-three/postprocessing`, and a subtle radial gradient background plane.

- [ ] **Step 1: Install post-processing**

```bash
npm install @react-three/postprocessing
```

- [ ] **Step 2: Write `components/scene/CardScene.tsx`**

```tsx
'use client'
import { Canvas } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { VirtualCard } from './VirtualCard'
import { useCardStore } from '@/store/cardStore'

export function CardScene() {
  const { glowIntensity, shadowDepth } = useCardStore()

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <directionalLight position={[-3, -2, -3]} intensity={0.2} />

      <VirtualCard />

      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={shadowDepth * 0.8}
        scale={6}
        blur={2.5}
        far={4}
      />

      <Environment preset="city" />

      <EffectComposer>
        <Bloom
          intensity={glowIntensity * 0.8}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </Canvas>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/scene/CardScene.tsx
git commit -m "feat: R3F scene with lighting, shadows, bloom post-processing"
```

---

### Task 8: Dial Component

**Files:**
- Create: `hooks/useDrag.ts`
- Create: `components/controls/Dial.tsx`

A circular SVG knob. Drag up/right to increase, drag down/left to decrease. Visually shows a filled arc proportional to value.

- [ ] **Step 1: Write `hooks/useDrag.ts`**

```ts
'use client'
import { useCallback, useEffect, useRef } from 'react'

export function useDrag(onDelta: (dy: number) => void) {
  const dragging = useRef(false)
  const lastY = useRef(0)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    lastY.current = e.clientY
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dy = lastY.current - e.clientY   // up = positive
    lastY.current = e.clientY
    onDelta(dy)
  }, [onDelta])

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp }
}
```

- [ ] **Step 2: Write `components/controls/Dial.tsx`**

```tsx
'use client'
import { useDrag } from '@/hooks/useDrag'
import { useCallback } from 'react'

interface DialProps {
  label: string
  value: number          // 0–1
  onChange: (v: number) => void
  color?: string
}

const SIZE = 52
const STROKE = 4
const R = (SIZE - STROKE) / 2 - 2
const CIRC = 2 * Math.PI * R
const GAP_DEG = 60    // degrees left open at bottom
const ARC_DEG = 360 - GAP_DEG

function valueToStroke(v: number) {
  return (v * ARC_DEG / 360) * CIRC
}

function polarToXY(deg: number) {
  const rad = (deg - 90) * (Math.PI / 180)
  const cx = SIZE / 2
  const cy = SIZE / 2
  return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) }
}

export function Dial({ label, value, onChange, color = '#ffffff' }: DialProps) {
  const handleDelta = useCallback((dy: number) => {
    onChange(Math.min(1, Math.max(0, value + dy * 0.008)))
  }, [value, onChange])

  const { onPointerDown, onPointerMove, onPointerUp } = useDrag(handleDelta)

  const startDeg = 90 + GAP_DEG / 2
  const endDeg   = startDeg + ARC_DEG
  const start = polarToXY(startDeg)
  const end   = polarToXY(endDeg)
  const filled = polarToXY(startDeg + value * ARC_DEG)

  const cx = SIZE / 2
  const cy = SIZE / 2

  const trackPath = `M ${start.x} ${start.y} A ${R} ${R} 0 1 1 ${end.x} ${end.y}`
  const fillPath  = `M ${start.x} ${start.y} A ${R} ${R} 0 ${value > 0.5 ? 1 : 0} 1 ${filled.x} ${filled.y}`

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'ns-resize', userSelect: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <svg width={SIZE} height={SIZE} style={{ display: 'block' }}>
        {/* Track */}
        <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={STROKE} strokeLinecap="round" />
        {/* Fill */}
        {value > 0.01 && (
          <path d={fillPath} fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
        )}
        {/* Center value */}
        <text x={cx} y={cy + 5} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="11" fontFamily="Inter, sans-serif">
          {Math.round(value * 100)}
        </text>
      </svg>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add hooks/useDrag.ts components/controls/Dial.tsx
git commit -m "feat: SVG circular dial control with drag interaction"
```

---

### Task 9: Toggle + Preset Picker Components

**Files:**
- Create: `components/controls/Toggle.tsx`
- Create: `components/controls/PresetPicker.tsx`

- [ ] **Step 1: Write `components/controls/Toggle.tsx`**

```tsx
'use client'

interface ToggleProps {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}

export function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: value ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          padding: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 2,
          left: value ? 20 : 2,
          width: 16, height: 16, borderRadius: 8,
          background: value ? '#0a0a0a' : 'rgba(255,255,255,0.5)',
          transition: 'left 0.2s, background 0.2s',
        }} />
      </button>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Write `components/controls/PresetPicker.tsx`**

```tsx
'use client'
import { PRESETS, PresetKey } from '@/lib/presets'
import { useCardStore } from '@/store/cardStore'

export function PresetPicker() {
  const { preset, set } = useCardStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
        Material
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(Object.keys(PRESETS) as PresetKey[]).map((key) => {
          const p = PRESETS[key]
          const active = preset === key
          return (
            <button
              key={key}
              onClick={() => set({ preset: key })}
              title={p.label}
              style={{
                width: 22, height: 22, borderRadius: '50%',
                background: p.swatch,
                border: active ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                boxShadow: active ? '0 0 6px rgba(255,255,255,0.4)' : 'none',
                transition: 'border 0.15s, box-shadow 0.15s',
                padding: 0,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/controls/Toggle.tsx components/controls/PresetPicker.tsx
git commit -m "feat: toggle and preset picker controls"
```

---

### Task 10: Floating Control Panel

**Files:**
- Create: `components/controls/ControlPanel.tsx`

Draggable floating panel (DialKit-style) that contains all dials, toggles, and the preset picker. Panel can be dragged by its header.

- [ ] **Step 1: Write `components/controls/ControlPanel.tsx`**

```tsx
'use client'
import { useRef, useState, useCallback } from 'react'
import { Dial } from './Dial'
import { Toggle } from './Toggle'
import { PresetPicker } from './PresetPicker'
import { useCardStore } from '@/store/cardStore'

export function ControlPanel() {
  const store = useCardStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const origin = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const [pos, setPos] = useState({ x: window.innerWidth - 220, y: 80 })
  const [autoHolo, setAutoHolo] = useState(true)

  const onHeaderDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    origin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pos])

  const onHeaderMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    setPos({
      x: origin.current.px + (e.clientX - origin.current.mx),
      y: origin.current.py + (e.clientY - origin.current.my),
    })
  }, [])

  const onHeaderUp = useCallback(() => { dragging.current = false }, [])

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    left: pos.x,
    top: pos.y,
    width: 188,
    background: 'rgba(18,18,18,0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '12px 16px 16px',
    zIndex: 100,
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
  }

  return (
    <div ref={panelRef} style={panelStyle}>
      {/* Drag handle */}
      <div
        onPointerDown={onHeaderDown}
        onPointerMove={onHeaderMove}
        onPointerUp={onHeaderUp}
        style={{ cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, userSelect: 'none' }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>
          Card Controls
        </span>
        <div style={{ display: 'flex', gap: 3 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />)}
        </div>
      </div>

      {/* Preset picker */}
      <PresetPicker />

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

      {/* Dials row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <Dial label="Tilt" value={store.tiltSensitivity} onChange={(v) => store.set({ tiltSensitivity: v })} color="#a78bfa" />
        <Dial label="Holo" value={store.holoIntensity} onChange={(v) => store.set({ holoIntensity: v })} color="#67e8f9" />
        <Dial label="Glow" value={store.glowIntensity} onChange={(v) => store.set({ glowIntensity: v })} color="#fbbf24" />
      </div>

      <div style={{ height: 10 }} />

      {/* Dials row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <Dial label="Noise" value={store.noiseIntensity} onChange={(v) => store.set({ noiseIntensity: v })} color="#f472b6" />
        <Dial label="Float" value={store.floatHeight} onChange={(v) => store.set({ floatHeight: v })} color="#34d399" />
        <Dial label="Speed" value={store.floatSpeed} onChange={(v) => store.set({ floatSpeed: v })} color="#fb923c" />
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

      {/* Shadow toggle + dial */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Dial label="Shadow" value={store.shadowDepth} onChange={(v) => store.set({ shadowDepth: v })} color="#94a3b8" />
        <Toggle label="Auto Holo" value={autoHolo} onChange={setAutoHolo} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/controls/ControlPanel.tsx
git commit -m "feat: floating draggable control panel with all dials"
```

---

### Task 11: CardPlayground + Page Wiring

**Files:**
- Create: `components/CardPlayground.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write `components/CardPlayground.tsx`**

```tsx
'use client'
import dynamic from 'next/dynamic'
import { ControlPanel } from './controls/ControlPanel'

const CardScene = dynamic(() => import('./scene/CardScene').then(m => m.CardScene), { ssr: false })

export function CardPlayground() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#0a0a0a' }}>
      {/* Subtle radial gradient bg */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(80,40,120,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <CardScene />
      <ControlPanel />
    </div>
  )
}
```

- [ ] **Step 2: Update `app/page.tsx`**

```tsx
import { CardPlayground } from '@/components/CardPlayground'

export default function Home() {
  return <CardPlayground />
}
```

- [ ] **Step 3: Final dev server check**

```bash
npm run dev
```

Expected: floating 3D card with tilt, holographic shader, floating panel with 6 dials + material presets.

- [ ] **Step 4: Final commit**

```bash
git add components/CardPlayground.tsx app/page.tsx
git commit -m "feat: wire CardPlayground into page, complete MVP"
```

---

## Done

The app delivers:
- Floating 3D Ramp Visa card with mouse-driven tilt
- GLSL holographic + noise + Fresnel shader
- Bloom post-processing
- Draggable DialKit-style control panel: 6 dials, material presets, toggles
- 6 card material presets (white, black, holographic, metal, midnight, aurora)
