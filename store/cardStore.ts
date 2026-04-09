import { create } from 'zustand'

export type CardPreset =
  | 'white' | 'black' | 'holographic' | 'metal' | 'midnight' | 'aurora'
  | 'goldFoil' | 'obsidian' | 'roseGold' | 'carbon' | 'cyber' | 'luxury'

interface CardState {
  // Name
  cardName: string
  // Tilt
  tiltSensitivity: number        // 0–1
  // Shader — original
  holoIntensity: number          // 0–1
  noiseIntensity: number         // 0–1
  glowIntensity: number          // 0–1
  // Shader — surface
  brushedMetal: number           // 0–1
  carbonFiber: number            // 0–1
  sparkle: number                // 0–1
  iridescence: number            // 0–1
  // Shader — effects
  scanline: number               // 0–1
  parallaxDepth: number          // 0–1
  gradientWave: number           // 0–1
  // Shader — lighting
  rimLight: number               // 0–1
  caustics: number               // 0–1
  // Float animation
  floatHeight: number            // 0–1
  floatSpeed: number             // 0–1
  // Shadow
  shadowDepth: number            // 0–1
  // Material preset
  preset: CardPreset
  // Actions
  set: (patch: Partial<Omit<CardState, 'set'>>) => void
}

export const useCardStore = create<CardState>((set) => ({
  cardName: '',
  tiltSensitivity: 0.5,
  holoIntensity: 0.6,
  noiseIntensity: 0.3,
  glowIntensity: 0.4,
  brushedMetal: 0,
  carbonFiber: 0,
  sparkle: 0,
  iridescence: 0,
  scanline: 0,
  parallaxDepth: 0,
  gradientWave: 0,
  rimLight: 0,
  caustics: 0,
  floatHeight: 0.5,
  floatSpeed: 0.4,
  shadowDepth: 0.5,
  preset: 'white',
  set: (patch) => set(patch),
}))
