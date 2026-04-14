import { HOLO_PATTERNS, MATERIAL_IDS, SIGNATURE_FONTS, type CardState, type HoloPattern } from '@/store/cardStore'
import { COLORS } from './colors'

type SetFn = (patch: Partial<Omit<CardState, 'set'>>) => void

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Picks a random combination of color, material, pattern, and pattern
 * modifiers. Always selects one of the predefined color swatches so the
 * Color picker still shows a selected state after randomizing.
 */
// Exclude the "none" option so randomize always lands on an interesting pattern.
const REAL_PATTERNS: HoloPattern[] = HOLO_PATTERNS.filter((p) => p !== 'none')

export function randomizeCard(set: SetFn) {
  const color = pick(COLORS)
  set({
    baseColor: color.base,
    baseColor2: color.base2,
    material: pick(MATERIAL_IDS),
    signatureFont: pick(SIGNATURE_FONTS).id,
    holoPattern: pick(REAL_PATTERNS),
    holoIntensity: 0.2 + Math.random() * 0.65,
    holoSpeed: 0.25 + Math.random() * 0.6,
    holoScale: 0.25 + Math.random() * 0.6,
    holoVariance: 0.35 + Math.random() * 0.55,
    holoRotation: Math.random() < 0.4 ? 0 : Math.random(),
    shadowDepth: 0.35 + Math.random() * 0.45,
  })
}
