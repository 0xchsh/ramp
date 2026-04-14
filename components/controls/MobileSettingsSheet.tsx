'use client'
import { Drawer } from 'vaul'
import { ControlPanelBody } from './ControlPanel'

interface MobileSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSettingsSheet({ open, onOpenChange }: MobileSettingsSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={[0.6, 0.96]} dismissible>
      <Drawer.Portal>
        {/* Transparent overlay — we skip the dim/blur so the card stays
            visible above the sheet, but keep the element in place so vaul's
            tap-outside-to-close behavior still works. */}
        <Drawer.Overlay
          style={{
            position: 'fixed', inset: 0,
            background: 'transparent',
            zIndex: 300,
          }}
        />
        <Drawer.Content
          aria-describedby={undefined}
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: '#ffffff',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            boxShadow: '0 -12px 48px rgba(0,0,0,0.18), 0 -2px 8px rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column',
            outline: 'none',
            zIndex: 320,
            maxHeight: '96dvh',
            fontFamily: 'Inter, -apple-system, sans-serif',
          }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
            <div style={{ width: 44, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.18)' }} />
          </div>

          {/* Header row with title + close */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 16px 8px',
            }}
          >
            <Drawer.Title
              style={{
                fontSize: 15, fontWeight: 600, color: 'rgba(0,0,0,0.85)',
                margin: 0, letterSpacing: '-0.01em',
              }}
            >
              Customize Ramp Card
            </Drawer.Title>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Close settings"
              style={{
                width: 32, height: 32, borderRadius: 999, border: 'none',
                background: 'rgba(0,0,0,0.06)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(0,0,0,0.65)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 4l10 10M14 4L4 14" />
              </svg>
            </button>
          </div>

          {/* Content — reuses the exact same ControlPanel body that desktop
              renders. Generous bottom padding plus iOS safe-area inset so the
              last slider clears the home indicator and the sheet's rubber-band
              bottom feels intentional rather than clipped. */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <ControlPanelBody showHeader={false} showScene={false} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
