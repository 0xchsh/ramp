export interface ColorSwatch {
  label: string
  base: string
  base2: string
}

// Tailwind v4 palette — 500 for the swatch, 800 for the darker gradient stop.
// "Ramp" is the brand phosphorescent yellow, replacing the generic yellow.
export const COLORS: ColorSwatch[] = [
  { label: 'White',  base: '#fafafa', base2: '#d4d4d8' }, // zinc-50 / zinc-300
  { label: 'Black',  base: '#09090b', base2: '#000000' }, // zinc-950 / black
  { label: 'Red',    base: '#ef4444', base2: '#991b1b' }, // red-500 / red-800
  { label: 'Orange', base: '#f97316', base2: '#9a3412' }, // orange-500 / orange-800
  { label: 'Ramp',   base: '#f0ff1a', base2: '#a8b800' }, // Ramp brand phosphorescent yellow
  { label: 'Green',  base: '#10b981', base2: '#065f46' }, // emerald-500 / emerald-800
  { label: 'Teal',   base: '#14b8a6', base2: '#115e59' }, // teal-500 / teal-800
  { label: 'Cyan',   base: '#06b6d4', base2: '#155e75' }, // cyan-500 / cyan-800
  { label: 'Blue',   base: '#3b82f6', base2: '#1e40af' }, // blue-500 / blue-800
  { label: 'Indigo', base: '#6366f1', base2: '#3730a3' }, // indigo-500 / indigo-800
  { label: 'Purple', base: '#a855f7', base2: '#6b21a8' }, // purple-500 / purple-800
  { label: 'Pink',   base: '#ec4899', base2: '#9d174d' }, // pink-500 / pink-800
]
