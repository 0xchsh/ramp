import { HOLO_PATTERNS, MATERIAL_IDS, type CardState } from '@/store/cardStore'
import { COLORS } from './colors'

type SetFn = (patch: Partial<Omit<CardState, 'set'>>) => void

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Picks a random combination of color, material, pattern, and shader modifiers.
 * Always selects one of the predefined color swatches so the Color picker still
 * shows a selected state after randomizing.
 */
export function randomizeCard(set: SetFn) {
  const color = pick(COLORS)
  const touch = () => (Math.random() < 0.55 ? 0 : Math.random() * 0.7)
  set({
    baseColor: color.base,
    baseColor2: color.base2,
    material: pick(MATERIAL_IDS),
    holoPattern: pick(HOLO_PATTERNS),
    holoIntensity: 0.15 + Math.random() * 0.65,
    holoSpeed: 0.25 + Math.random() * 0.6,
    holoScale: 0.25 + Math.random() * 0.6,
    holoVariance: 0.35 + Math.random() * 0.55,
    holoRotation: Math.random() < 0.4 ? 0 : Math.random(),
    iridescence: touch(),
    gradientWave: touch(),
    caustics: touch(),
    rimLight: touch(),
    glowIntensity: 0.2 + Math.random() * 0.55,
    scanline: touch(),
    shadowDepth: 0.35 + Math.random() * 0.45,
  })
}
