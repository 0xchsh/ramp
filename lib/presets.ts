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
