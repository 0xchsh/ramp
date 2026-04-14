import type { HoloPattern } from '@/store/cardStore'

// Presets only touch the visible user-controllable values: pattern + intensity
// and the Settings sliders (iridescence, gradient wave, caustics, rim light, glow,
// scanline). They intentionally never set the hidden texture sliders so selecting
// a preset matches what the UI shows. Material and color stay orthogonal.
export interface ShaderPreset {
  label: string
  values: {
    holoPattern: HoloPattern
    holoIntensity: number
    iridescence: number
    gradientWave: number
    caustics: number
    rimLight: number
    glowIntensity: number
    scanline: number
  }
}

const zero = {
  holoPattern: 'blotch' as HoloPattern,
  holoIntensity: 0,
  iridescence: 0,
  gradientWave: 0,
  caustics: 0,
  rimLight: 0,
  glowIntensity: 0,
  scanline: 0,
}

export const SHADER_PRESETS: Record<string, ShaderPreset> = {
  clean:    { label: 'Clean',    values: { ...zero, glowIntensity: 0.25 } },
  aurora:   { label: 'Aurora',   values: { ...zero, holoPattern: 'flow',      holoIntensity: 0.85, iridescence: 0.55, gradientWave: 0.4,  glowIntensity: 0.55, rimLight: 0.5 } },
  hologram: { label: 'Hologram', values: { ...zero, holoPattern: 'blotch',    holoIntensity: 0.9,  iridescence: 0.6,  glowIntensity: 0.5,  rimLight: 0.5 } },
  prism:    { label: 'Prism',    values: { ...zero, holoPattern: 'stripes',   holoIntensity: 0.85, iridescence: 0.45, glowIntensity: 0.45 } },
  circuit:  { label: 'Circuit',  values: { ...zero, holoPattern: 'grid',      holoIntensity: 0.6,  scanline: 0.4,     rimLight: 0.45, glowIntensity: 0.4 } },
  sonar:    { label: 'Sonar',    values: { ...zero, holoPattern: 'radial',    holoIntensity: 0.75, rimLight: 0.6,     caustics: 0.3,  glowIntensity: 0.5 } },
  starlit:  { label: 'Starlit',  values: { ...zero, holoPattern: 'starburst', holoIntensity: 0.65, rimLight: 0.5,     glowIntensity: 0.55 } },
  liquid:   { label: 'Liquid',   values: { ...zero, holoPattern: 'flow',      holoIntensity: 0.7,  gradientWave: 0.6, caustics: 0.45, iridescence: 0.35, glowIntensity: 0.4 } },
  cyber:    { label: 'Cyber',    values: { ...zero, holoPattern: 'grid',      holoIntensity: 0.4,  scanline: 0.6,     glowIntensity: 0.55, rimLight: 0.5 } },
  frost:    { label: 'Frost',    values: { ...zero, holoPattern: 'flow',      holoIntensity: 0.45, iridescence: 0.55, rimLight: 0.6,  glowIntensity: 0.45 } },
  ripple:   { label: 'Ripple',   values: { ...zero, holoPattern: 'waves',     holoIntensity: 0.8,  gradientWave: 0.5, glowIntensity: 0.5,  rimLight: 0.4 } },
  vortex:   { label: 'Vortex',   values: { ...zero, holoPattern: 'spiral',    holoIntensity: 0.8,  rimLight: 0.55,    glowIntensity: 0.55, iridescence: 0.3 } },
}

export type ShaderPresetKey = keyof typeof SHADER_PRESETS
