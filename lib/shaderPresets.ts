import type { HoloPattern } from '@/store/cardStore'

// Presets seed the active pattern and how it's shaped. Color, material, and
// tilt/float stay orthogonal — presets never touch them.
export interface ShaderPreset {
  label: string
  values: {
    holoPattern: HoloPattern
    holoIntensity: number
    holoSpeed: number
    holoScale: number
    holoVariance: number
    holoRotation: number
  }
}

const base = {
  holoIntensity: 0.6,
  holoSpeed: 0.5,
  holoScale: 0.5,
  holoVariance: 0.5,
  holoRotation: 0,
}

export const SHADER_PRESETS: Record<string, ShaderPreset> = {
  clean:    { label: 'Clean',    values: { ...base, holoPattern: 'blotch',    holoIntensity: 0.25 } },
  aurora:   { label: 'Aurora',   values: { ...base, holoPattern: 'flow',      holoIntensity: 0.85, holoSpeed: 0.6, holoVariance: 0.7 } },
  hologram: { label: 'Hologram', values: { ...base, holoPattern: 'blotch',    holoIntensity: 0.9,  holoScale: 0.6, holoVariance: 0.75 } },
  prism:    { label: 'Prism',    values: { ...base, holoPattern: 'stripes',   holoIntensity: 0.85, holoRotation: 0.08, holoScale: 0.55 } },
  circuit:  { label: 'Circuit',  values: { ...base, holoPattern: 'grid',      holoIntensity: 0.7,  holoScale: 0.55, holoVariance: 0.7 } },
  sonar:    { label: 'Sonar',    values: { ...base, holoPattern: 'radial',    holoIntensity: 0.75, holoSpeed: 0.6, holoVariance: 0.7 } },
  starlit:  { label: 'Starlit',  values: { ...base, holoPattern: 'starburst', holoIntensity: 0.65, holoRotation: 0.12, holoVariance: 0.65 } },
  liquid:   { label: 'Liquid',   values: { ...base, holoPattern: 'flow',      holoIntensity: 0.7,  holoSpeed: 0.55, holoScale: 0.45, holoVariance: 0.6 } },
  cyber:    { label: 'Cyber',    values: { ...base, holoPattern: 'scanline',  holoIntensity: 0.75, holoSpeed: 0.6, holoVariance: 0.8 } },
  frost:    { label: 'Frost',    values: { ...base, holoPattern: 'flow',      holoIntensity: 0.45, holoSpeed: 0.4, holoVariance: 0.55 } },
  ripple:   { label: 'Ripple',   values: { ...base, holoPattern: 'waves',     holoIntensity: 0.8,  holoSpeed: 0.55, holoVariance: 0.7 } },
  vortex:   { label: 'Vortex',   values: { ...base, holoPattern: 'spiral',    holoIntensity: 0.8,  holoSpeed: 0.55, holoVariance: 0.7 } },
}

export type ShaderPresetKey = keyof typeof SHADER_PRESETS
