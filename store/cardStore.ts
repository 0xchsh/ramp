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
