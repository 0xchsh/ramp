import { create } from 'zustand'

export type CardPreset =
  | 'white' | 'black' | 'holographic' | 'metal' | 'midnight' | 'aurora'
  | 'goldFoil' | 'obsidian' | 'roseGold' | 'carbon' | 'cyber' | 'luxury'

export type HoloPattern =
  | 'blotch' | 'stripes' | 'grid' | 'radial' | 'starburst' | 'flow'
  | 'waves' | 'dots' | 'hex' | 'spiral' | 'scanline'
export const HOLO_PATTERNS: HoloPattern[] = [
  'blotch', 'stripes', 'grid', 'radial', 'starburst', 'flow',
  'waves', 'dots', 'hex', 'spiral', 'scanline',
]

export type Material = 'plastic' | 'metal' | 'glass' | 'rainbow'
export const MATERIAL_IDS: Material[] = ['plastic', 'metal', 'glass', 'rainbow']

export interface CardState {
  // Name
  cardName: string
  // Color — base gradient stops (hex)
  baseColor: string
  baseColor2: string
  // Tilt
  tiltSensitivity: number        // 0–1
  // Shader — color modulation
  holoIntensity: number          // 0–1
  holoPattern: HoloPattern
  // Pattern modifiers — affect whichever holoPattern is active
  holoSpeed: number              // 0–1 (0.5 = 1x, 0 = 0.25x, 1 = 4x)
  holoScale: number              // 0–1 (0.5 = 1x density)
  holoVariance: number           // 0–1 (0.5 = 1x contrast)
  holoRotation: number           // 0–1 (0 = none, 1 = full turn)
  glowIntensity: number          // 0–1
  iridescence: number            // 0–1
  gradientWave: number           // 0–1
  caustics: number               // 0–1
  scanline: number               // 0–1
  chromaticAberration: number    // 0–1
  pulse: number                  // 0–1
  // Material — surface texture
  brushedMetal: number           // 0–1
  carbonFiber: number            // 0–1
  sparkle: number                // 0–1
  noiseIntensity: number         // 0–1
  parallaxDepth: number          // 0–1
  // Float animation
  floatHeight: number            // 0–1
  floatSpeed: number             // 0–1
  // Shadow
  shadowDepth: number            // 0–1
  // Material preset (still used as a starting-point shortcut)
  preset: CardPreset
  // Active material — pure visual type, orthogonal to everything else
  material: Material
  // UI state
  previewOpen: boolean
  // When true, the live 3D card snaps to a straight-on rotation with no tilt,
  // float, or contact shadow — used for clean download captures.
  downloadMode: boolean
  // Actions
  set: (patch: Partial<Omit<CardState, 'set'>>) => void
}

export const useCardStore = create<CardState>((set) => ({
  cardName: '',
  // Matches the first Tailwind swatch (White / zinc-50 → zinc-300) so the
  // Color picker shows a selected state on first render.
  baseColor: '#fafafa',
  baseColor2: '#d4d4d8',
  tiltSensitivity: 0.5,
  holoIntensity: 0.6,
  holoPattern: 'blotch',
  holoSpeed: 0.5,
  holoScale: 0.5,
  holoVariance: 0.5,
  holoRotation: 0,
  glowIntensity: 0.4,
  iridescence: 0,
  gradientWave: 0,
  caustics: 0,
  scanline: 0,
  chromaticAberration: 0,
  pulse: 0,
  rimLight: 0,
  brushedMetal: 0,
  carbonFiber: 0,
  sparkle: 0,
  noiseIntensity: 0.3,
  parallaxDepth: 0,
  floatHeight: 0.5,
  floatSpeed: 0.4,
  shadowDepth: 0.5,
  preset: 'white',
  material: 'plastic',
  previewOpen: false,
  downloadMode: false,
  set: (patch) => set(patch),
}))
