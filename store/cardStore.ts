import { create } from 'zustand'

export type CardPreset =
  | 'white' | 'black' | 'holographic' | 'metal' | 'midnight' | 'aurora'
  | 'goldFoil' | 'obsidian' | 'roseGold' | 'carbon' | 'cyber' | 'luxury'

export type HoloPattern =
  | 'none'
  | 'blotch' | 'stripes' | 'grid' | 'starburst' | 'flow'
  | 'waves' | 'dots' | 'hex' | 'spiral' | 'scanline'
  | 'checker' | 'chevron' | 'mesh'
  | 'glitch' | 'topo' | 'crosshatch' | 'halftone'
export const HOLO_PATTERNS: HoloPattern[] = [
  'none',
  'blotch', 'stripes', 'grid', 'starburst', 'flow',
  'waves', 'dots', 'hex', 'spiral', 'scanline',
  'checker', 'chevron', 'mesh',
  'glitch', 'topo', 'crosshatch', 'halftone',
]

// Shader kind index for each pattern. Decoupled from HOLO_PATTERNS.indexOf so
// we can reorder the picker without rewriting every `else if (kind == N)`
// branch in the shader. 'none' uses -1 which falls through to the default
// branch; intensity is forced to 0 separately. Gaps at 3/12/13 are from
// removed patterns (radial/diamond/plasma) — harmless since nothing maps to them.
export const HOLO_PATTERN_KIND: Record<HoloPattern, number> = {
  none: -1,
  blotch: 0,
  stripes: 1,
  grid: 2,
  starburst: 4,
  flow: 5,
  waves: 6,
  dots: 7,
  hex: 8,
  spiral: 9,
  scanline: 10,
  checker: 11,
  chevron: 14,
  mesh: 16,
  glitch: 17,
  topo: 18,
  crosshatch: 19,
  halftone: 20,
}

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
  // Baseline surface noise grain — kept since every material reads it
  noiseIntensity: number         // 0–1
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
  // Custom flip cursor — set by the card mesh's pointer handlers, read by
  // the FlipCursor overlay so it can show/hide and animate its press state.
  cursorOverCard: boolean
  cursorPressed: boolean
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
  noiseIntensity: 0.3,
  floatHeight: 0.5,
  floatSpeed: 0.4,
  shadowDepth: 0.5,
  preset: 'white',
  material: 'plastic',
  previewOpen: false,
  cursorOverCard: false,
  cursorPressed: false,
  downloadMode: false,
  set: (patch) => set(patch),
}))
