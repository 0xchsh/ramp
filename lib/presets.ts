export type PresetKey =
  | 'white' | 'black' | 'holographic' | 'metal' | 'midnight' | 'aurora'
  | 'goldFoil' | 'obsidian' | 'roseGold' | 'carbon' | 'cyber' | 'luxury'

export interface ShaderDefaults {
  holoIntensity?: number
  noiseIntensity?: number
  glowIntensity?: number
  brushedMetal?: number
  carbonFiber?: number
  sparkle?: number
  iridescence?: number
  scanline?: number
  parallaxDepth?: number
  gradientWave?: number
  rimLight?: number
  caustics?: number
}

interface Preset {
  base: string
  base2: string
  textDark: boolean
  label: string
  swatch: string
  shaderDefaults?: ShaderDefaults
}

export const PRESETS: Record<PresetKey, Preset> = {
  white: {
    base: '#f5f4f0', base2: '#e2e0d8',
    textDark: true, label: 'White', swatch: '#f5f4f0',
    shaderDefaults: { holoIntensity: 0.6, noiseIntensity: 0.3, glowIntensity: 0.4, brushedMetal: 0, carbonFiber: 0, sparkle: 0, iridescence: 0, scanline: 0, parallaxDepth: 0, gradientWave: 0, rimLight: 0, caustics: 0 },
  },
  black: {
    base: '#1a1a1a', base2: '#0a0a0a',
    textDark: false, label: 'Black', swatch: '#1a1a1a',
    shaderDefaults: { holoIntensity: 0.2, noiseIntensity: 0.1, glowIntensity: 0.6, brushedMetal: 0, carbonFiber: 0, sparkle: 0, iridescence: 0, scanline: 0, parallaxDepth: 0, gradientWave: 0, rimLight: 0, caustics: 0 },
  },
  holographic: {
    base: '#c0a0ff', base2: '#80d0ff',
    textDark: false, label: 'Holo', swatch: 'linear-gradient(135deg,#c0a0ff,#80d0ff,#a0ffcc)',
    shaderDefaults: { holoIntensity: 1.0, noiseIntensity: 0.4, glowIntensity: 0.5, brushedMetal: 0, carbonFiber: 0, sparkle: 0.2, iridescence: 0.3, scanline: 0, parallaxDepth: 0, gradientWave: 0, rimLight: 0, caustics: 0 },
  },
  metal: {
    base: '#c8c4be', base2: '#8a8680',
    textDark: true, label: 'Metal', swatch: '#c8c4be',
    shaderDefaults: { holoIntensity: 0.1, noiseIntensity: 0.2, glowIntensity: 0.5, brushedMetal: 0.6, carbonFiber: 0, sparkle: 0, iridescence: 0, scanline: 0, parallaxDepth: 0, gradientWave: 0, rimLight: 0, caustics: 0 },
  },
  midnight: {
    base: '#1a1f3a', base2: '#0d1020',
    textDark: false, label: 'Midnight', swatch: '#1a1f3a',
    shaderDefaults: { holoIntensity: 0.3, noiseIntensity: 0.15, glowIntensity: 0.7, brushedMetal: 0, carbonFiber: 0, sparkle: 0.15, iridescence: 0, scanline: 0, parallaxDepth: 0.3, gradientWave: 0, rimLight: 0.2, caustics: 0 },
  },
  aurora: {
    base: '#0d3b2e', base2: '#1a0a2e',
    textDark: false, label: 'Aurora', swatch: 'linear-gradient(135deg,#0d3b2e,#1a0a2e)',
    shaderDefaults: { holoIntensity: 0.5, noiseIntensity: 0.2, glowIntensity: 0.5, brushedMetal: 0, carbonFiber: 0, sparkle: 0, iridescence: 0.4, scanline: 0, parallaxDepth: 0, gradientWave: 0.5, rimLight: 0.3, caustics: 0.2 },
  },
  goldFoil: {
    base: '#c9a84c', base2: '#8b6914',
    textDark: false, label: 'Gold', swatch: 'linear-gradient(135deg,#c9a84c,#8b6914)',
    shaderDefaults: { holoIntensity: 0.15, noiseIntensity: 0.25, glowIntensity: 0.6, brushedMetal: 0.5, carbonFiber: 0, sparkle: 0.35, iridescence: 0, scanline: 0, parallaxDepth: 0, gradientWave: 0.15, rimLight: 0, caustics: 0 },
  },
  obsidian: {
    base: '#0a0a0f', base2: '#15151f',
    textDark: false, label: 'Obsidian', swatch: 'linear-gradient(135deg,#0a0a0f,#2a2a3a)',
    shaderDefaults: { holoIntensity: 0.05, noiseIntensity: 0.05, glowIntensity: 0.9, brushedMetal: 0, carbonFiber: 0, sparkle: 0, iridescence: 0.15, scanline: 0, parallaxDepth: 0.5, gradientWave: 0, rimLight: 0.4, caustics: 0.3 },
  },
  roseGold: {
    base: '#d4a08a', base2: '#b07060',
    textDark: false, label: 'Rose Gold', swatch: 'linear-gradient(135deg,#d4a08a,#b07060)',
    shaderDefaults: { holoIntensity: 0.15, noiseIntensity: 0.15, glowIntensity: 0.5, brushedMetal: 0.35, carbonFiber: 0, sparkle: 0.2, iridescence: 0.2, scanline: 0, parallaxDepth: 0, gradientWave: 0.1, rimLight: 0, caustics: 0 },
  },
  carbon: {
    base: '#1e1e1e', base2: '#141414',
    textDark: false, label: 'Carbon', swatch: 'linear-gradient(45deg,#1e1e1e 25%,#2a2a2a 25%,#2a2a2a 50%,#1e1e1e 50%,#1e1e1e 75%,#2a2a2a 75%)',
    shaderDefaults: { holoIntensity: 0.05, noiseIntensity: 0.1, glowIntensity: 0.5, brushedMetal: 0, carbonFiber: 0.85, sparkle: 0, iridescence: 0, scanline: 0, parallaxDepth: 0, gradientWave: 0, rimLight: 0, caustics: 0 },
  },
  cyber: {
    base: '#0a0e1a', base2: '#0f0520',
    textDark: false, label: 'Cyber', swatch: 'linear-gradient(135deg,#0a0e1a,#1a0040)',
    shaderDefaults: { holoIntensity: 0.2, noiseIntensity: 0.1, glowIntensity: 0.4, brushedMetal: 0, carbonFiber: 0, sparkle: 0, iridescence: 0, scanline: 0.7, parallaxDepth: 0.3, gradientWave: 0.2, rimLight: 0.8, caustics: 0 },
  },
  luxury: {
    base: '#f0e8d8', base2: '#d8c8a8',
    textDark: true, label: 'Luxury', swatch: 'linear-gradient(135deg,#f0e8d8,#d8c8a8)',
    shaderDefaults: { holoIntensity: 0.25, noiseIntensity: 0.15, glowIntensity: 0.45, brushedMetal: 0.15, carbonFiber: 0, sparkle: 0.5, iridescence: 0.35, scanline: 0, parallaxDepth: 0.15, gradientWave: 0.1, rimLight: 0, caustics: 0.15 },
  },
}
