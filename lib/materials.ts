import type { Material } from '@/store/cardStore'

export interface MaterialDef {
  id: Material
  label: string
  thumb: string
}

export const MATERIALS: MaterialDef[] = [
  {
    id: 'plastic',
    label: 'Plastic',
    thumb: 'linear-gradient(145deg, #3a3a3e 0%, #1a1a1e 100%)',
  },
  {
    id: 'metal',
    label: 'Metal',
    thumb: 'linear-gradient(135deg, #f0f0f0 0%, #9c9ca0 22%, #fafafa 48%, #2e2e34 72%, #c4c4c8 100%)',
  },
  {
    id: 'glass',
    label: 'Glass',
    thumb: 'linear-gradient(140deg, rgba(220,240,255,0.95) 0%, rgba(140,180,220,0.7) 48%, rgba(80,110,160,0.85) 100%)',
  },
  {
    id: 'rainbow',
    label: 'Rainbow',
    thumb: 'linear-gradient(135deg, #ff6ec7 0%, #ffd86e 25%, #6effcc 50%, #6ec1ff 75%, #b26eff 100%)',
  },
]
