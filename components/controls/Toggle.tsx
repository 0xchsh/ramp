'use client'

interface ToggleProps {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}

export function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: value ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          padding: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 2,
          left: value ? 20 : 2,
          width: 16, height: 16, borderRadius: 8,
          background: value ? '#0a0a0a' : 'rgba(255,255,255,0.5)',
          transition: 'left 0.2s, background 0.2s',
        }} />
      </button>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
        {label}
      </span>
    </div>
  )
}
