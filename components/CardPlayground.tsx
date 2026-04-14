'use client'
import { useCallback, useLayoutEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import html2canvas from 'html2canvas'
import { ControlPanel } from './controls/ControlPanel'
import { PreviewDrawer } from './preview/PreviewDrawer'
import { FlipCursor } from './FlipCursor'
import { useCardStore } from '@/store/cardStore'
import { randomizeCard } from '@/lib/randomize'

const CardScene = dynamic(() => import('./scene/CardScene').then(m => m.CardScene), { ssr: false })

// Module-level so React strict-mode double-mount (and HMR) don't re-randomize —
// that caused a visible flash where the card appeared in one colorway, then
// flashed to a different randomized one on the second mount.
let didInit = false

export function CardPlayground() {
  const set = useCardStore(s => s.set)
  const initRef = useRef(false)

  // Randomize in useLayoutEffect so the store isn't mutated mid-render (which
  // throws in React 19 when the subscriber tree reads from the store). The
  // ref + module flag together ensure strict mode's double-invoke can't
  // randomize twice.
  useLayoutEffect(() => {
    if (initRef.current || didInit) return
    initRef.current = true
    didInit = true
    randomizeCard(set)
  }, [set])
  const handleDownload = useCallback(async () => {
    const glCanvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (!glCanvas) return

    // Figure out which face is currently visible before we snap the card flat.
    const root = document.querySelector('.card-face-root') as HTMLElement | null
    const face = root?.dataset.face === 'back' ? 'back' : 'front'

    // Enter download mode — this flattens the card rotation, kills tilt/float,
    // and hides contact shadows so the captured frame is a clean straight-on shot.
    set({ downloadMode: true })
    // Wait a couple frames for the useFrame loop to apply the new rotation
    // and for the renderer to draw it.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))))
    await new Promise((r) => setTimeout(r, 40))

    const faceEl = document.querySelector(`.card-face-${face}`) as HTMLElement | null

    // Composite: draw WebGL canvas first, then render the face content on top.
    const out = document.createElement('canvas')
    out.width = glCanvas.width
    out.height = glCanvas.height
    const ctx = out.getContext('2d')!
    ctx.drawImage(glCanvas, 0, 0)

    if (faceEl && root) {
      // The back face is normally rotateY(180deg) so its 3d-flipped parent
      // brings it forward — but html2canvas projects 2d and would capture
      // it mirrored. Strip the transform for the snapshot, then restore.
      const savedTransform = faceEl.style.transform
      if (face === 'back') faceEl.style.transform = 'none'
      const overlayCanvas = await html2canvas(faceEl, {
        backgroundColor: null,
        scale: window.devicePixelRatio,
        useCORS: true,
      })
      if (face === 'back') faceEl.style.transform = savedTransform
      // The face element is nested inside the preserve-3d root, so its client rect
      // reflects the CSS-3d projection. Using the root's rect instead gives us the
      // unrotated screen-space position of the card plane, which aligns cleanly with
      // the WebGL mesh underneath.
      const glRect = glCanvas.getBoundingClientRect()
      const rootRect = root.getBoundingClientRect()
      const scaleX = glCanvas.width / glRect.width
      const scaleY = glCanvas.height / glRect.height
      const dx = (rootRect.left - glRect.left) * scaleX
      const dy = (rootRect.top - glRect.top) * scaleY
      const dw = rootRect.width * scaleX
      const dh = rootRect.height * scaleY
      ctx.drawImage(overlayCanvas, dx, dy, dw, dh)
    }

    const link = document.createElement('a')
    link.download = `card-${face}.png`
    link.href = out.toDataURL('image/png')
    link.click()

    // Restore interactive state
    set({ downloadMode: false })
  }, [set])

  return (
    <div style={{ width: '100vw', height: '100vh', minWidth: 500, minHeight: 400, position: 'relative', background: '#f5f5f5', overflow: 'hidden' }}>
      <ControlPanel />

      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Subtle radial gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(180,180,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <CardScene />
      </div>

      {/* Bottom action bar: Download + Preview */}
      <div style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 10,
        zIndex: 100,
      }}>
        <button
          onClick={handleDownload}
          style={{
            height: 44,
            paddingLeft: 16,
            paddingRight: 20,
            borderRadius: 9999,
            border: '1px solid rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 14, fontWeight: 500,
            color: 'rgba(0,0,0,0.7)',
            fontFamily: 'inherit',
            transition: 'background 160ms cubic-bezier(0.22, 1, 0.36, 1), transform 160ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.96)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.88)')}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          title="Download card as PNG"
        >
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <path d="M9 2.25v9m0 0L5.25 7.5M9 11.25l3.75-3.75M3 14.25h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ lineHeight: 1 }}>Download</span>
        </button>

        <button
          onClick={() => set({ previewOpen: true })}
          style={{
            height: 44,
            paddingLeft: 16,
            paddingRight: 20,
            borderRadius: 9999,
            border: 'none',
            background: '#18181b',
            boxShadow: '0 4px 24px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 14, fontWeight: 500,
            color: 'rgba(255,255,255,0.95)',
            fontFamily: 'inherit',
            transition: 'background 160ms cubic-bezier(0.22, 1, 0.36, 1), transform 160ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#27272a')}
          onMouseLeave={e => (e.currentTarget.style.background = '#18181b')}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          title="Preview in Ramp"
        >
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" />
            <circle cx="9" cy="9" r="2.5" />
          </svg>
          <span style={{ lineHeight: 1 }}>Preview</span>
        </button>
      </div>

      <PreviewDrawer />
      <FlipCursor />
    </div>
  )
}
