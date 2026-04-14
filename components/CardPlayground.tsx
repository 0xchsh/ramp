'use client'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import html2canvas from 'html2canvas'
import { SlidersHorizontal, DiceFive } from '@phosphor-icons/react'
import { ControlPanel } from './controls/ControlPanel'
import { MobileSettingsSheet } from './controls/MobileSettingsSheet'
import { PreviewDrawer } from './preview/PreviewDrawer'
import { FlipCursor } from './FlipCursor'
import { useCardStore } from '@/store/cardStore'
import { useIsMobile } from '@/hooks/useIsMobile'
import { randomizeCard } from '@/lib/randomize'

const CardScene = dynamic(() => import('./scene/CardScene').then(m => m.CardScene), { ssr: false })

// Module-level so React strict-mode double-mount (and HMR) don't re-randomize —
// that caused a visible flash where the card appeared in one colorway, then
// flashed to a different randomized one on the second mount.
let didInit = false
// Same idea for the intro scale+fade: strict-mode remount would otherwise
// replay the animation and briefly snap the card back to opacity 0.
let didPlayIntro = false

export function CardPlayground() {
  const set = useCardStore(s => s.set)
  const initRef = useRef(false)
  const [introPlayed, setIntroPlayed] = useState(didPlayIntro)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const isMobile = useIsMobile()
  // Scoping DOM queries for the download handler to the main scene avoids
  // collisions with the preview drawer, which renders its own <CardScene/>
  // (and therefore a second <canvas> + .card-face-root when open).
  const sceneWrapperRef = useRef<HTMLDivElement>(null)

  // Tracks whether THIS component instance is still mounted. Used by the
  // double-rAF guard in handleSceneReady to cancel deferred state updates
  // after React Strict Mode's synchronous unmount/remount cycle, which would
  // otherwise fire the animation twice (once mid-way on mount #1, then again
  // instantly on mount #2 when didPlayIntro is already true).
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // CardScene calls this on its first rendered frame (after ReadySignal confirms
  // the canvas has valid dimensions). We defer through two rAFs so that React
  // Strict Mode's synchronous unmount/remount completes before we commit the
  // state change — the guard then skips the update on the discarded mount #1
  // and lets mount #2 play the animation cleanly.
  const handleSceneReady = useCallback(() => {
    if (didPlayIntro) return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!mountedRef.current) return
        didPlayIntro = true
        setIntroPlayed(true)
      })
    })
  }, [])

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
    const wrapper = sceneWrapperRef.current
    if (!wrapper) return
    const glCanvas = wrapper.querySelector('canvas') as HTMLCanvasElement | null
    if (!glCanvas) return

    // Figure out which face is currently visible before we snap the card flat.
    const root = wrapper.querySelector('.card-face-root') as HTMLElement | null
    const face = root?.dataset.face === 'back' ? 'back' : 'front'

    // downloadMode snaps the 3D mesh flat; captureMode additionally forces
    // the HTML overlay's CSS transform to `none` so html2canvas sees a 2D
    // element instead of trying (and failing) to project a 3D-rotated one.
    set({ downloadMode: true, captureMode: true })
    // Wait a couple frames for the useFrame loop to apply the new rotation
    // and for the renderer to draw it.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))))
    await new Promise((r) => setTimeout(r, 40))

    const faceEl = wrapper.querySelector(`.card-face-${face}`) as HTMLElement | null

    // `.card-face-back` has an inline rotateY(180) in JSX so the content
    // reads upright when the parent root is flipped. With captureMode the
    // parent is flat, so that rotateY(180) would now flip the content away
    // from the camera — strip it for the snapshot, then restore.
    const savedFaceTransform = faceEl?.style.transform
    if (face === 'back' && faceEl) faceEl.style.transform = 'none'
    await new Promise((r) => requestAnimationFrame(() => r(null)))

    // Composite: draw WebGL canvas first, then render the face content on top.
    const out = document.createElement('canvas')
    out.width = glCanvas.width
    out.height = glCanvas.height
    const ctx = out.getContext('2d')!
    ctx.drawImage(glCanvas, 0, 0)

    if (faceEl && root) {
      const overlayCanvas = await html2canvas(faceEl, {
        backgroundColor: null,
        scale: window.devicePixelRatio,
        useCORS: true,
      })
      // The root is now flat (captureMode) so its client rect is the true
      // axis-aligned card rectangle on screen — usable as the destination
      // box for the overlay on top of the WebGL canvas.
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

    // Restore the back face's own rotateY(180) before leaving capture mode.
    if (face === 'back' && faceEl && savedFaceTransform !== undefined) {
      faceEl.style.transform = savedFaceTransform
    }

    const link = document.createElement('a')
    link.download = `card-${face}.png`
    link.href = out.toDataURL('image/png')
    link.click()

    set({ downloadMode: false, captureMode: false })
  }, [set])

  return (
    <div style={{ width: '100vw', height: '100svh', minHeight: 400, position: 'relative', background: '#f5f5f5', overflow: 'hidden' }}>
      {!isMobile && <ControlPanel />}

      {/* On desktop the control panel is fixed at left:16 width:240 (right edge
          at 256px). Offsetting the card area's left by that amount makes Three.js
          center the card in the remaining viewport space rather than the full vw. */}
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: isMobile ? 0 : 256 }}>
        {/* Subtle radial gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(180,180,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Intro: scale up + fade in on first paint. Wraps both the canvas
            and drei's <Html> portal (which mounts into canvas.parentNode)
            so the 3D card and its text overlay animate in together.
            On mobile, when the settings sheet is open, the whole stack
            lifts above the vaul overlay via z-index and translates up so
            the card is visible in the area above the sheet. */}
        <div ref={sceneWrapperRef} style={{
          position: 'absolute', inset: 0,
          // visibility:hidden is belt-and-suspenders alongside opacity:0 — WebGL
          // canvases are promoted to their own GPU compositing layer and can bleed
          // through a parent's opacity:0 in some browser/driver combos.
          visibility: introPlayed ? 'visible' : 'hidden',
          opacity: introPlayed ? 1 : 0,
          transform: introPlayed ? 'scale(1)' : 'scale(0.9)',
          transformOrigin: 'center center',
          transition: 'opacity 650ms cubic-bezier(0.22, 1, 0.36, 1), transform 900ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'opacity, transform',
          zIndex: isMobile && settingsOpen ? 310 : undefined,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            transform: isMobile && settingsOpen
              ? 'translateY(-30svh) scale(0.62)'
              : isMobile
                ? 'translateY(-4svh) scale(1)'
                : 'translateY(0) scale(1)',
            transformOrigin: 'center center',
            transition: 'transform 480ms cubic-bezier(0.22, 1, 0.36, 1)',
            pointerEvents: isMobile && settingsOpen ? 'none' : undefined,
          }}>
            <CardScene onReady={handleSceneReady} />
          </div>
        </div>
      </div>

      {/* Bottom action bar. Desktop: text pills. Mobile: icon-only circles,
          ordered [Settings, Download, Preview] from left to right. */}
      <div style={{
        position: 'fixed',
        bottom: isMobile ? 24 : 32,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 10,
        zIndex: 100,
      }}>
        {isMobile && (
          <>
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Open settings"
              title="Customize card"
              style={{
                width: 44, height: 44,
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(0,0,0,0.72)',
                padding: 0,
                transition: 'background 160ms cubic-bezier(0.22, 1, 0.36, 1), transform 160ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.94)')}
              onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <SlidersHorizontal size={20} weight="bold" />
            </button>

            <button
              onClick={() => randomizeCard(set)}
              aria-label="Randomize"
              title="Randomize card"
              style={{
                width: 44, height: 44,
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(0,0,0,0.72)',
                padding: 0,
                transition: 'background 160ms cubic-bezier(0.22, 1, 0.36, 1), transform 160ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.94)')}
              onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <DiceFive size={20} weight="bold" />
            </button>
          </>
        )}

        <button
          onClick={handleDownload}
          title="Download card as PNG"
          aria-label={isMobile ? 'Download' : undefined}
          style={{
            height: 44,
            width: isMobile ? 44 : undefined,
            paddingLeft: isMobile ? 0 : 16,
            paddingRight: isMobile ? 0 : 20,
            borderRadius: isMobile ? '50%' : 9999,
            border: '1px solid rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: isMobile ? 0 : 8,
            fontSize: 14, fontWeight: 500,
            color: 'rgba(0,0,0,0.7)',
            fontFamily: 'inherit',
            transition: 'background 160ms cubic-bezier(0.22, 1, 0.36, 1), transform 160ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.96)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.88)')}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width={isMobile ? 18 : 15} height={isMobile ? 18 : 15} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <path d="M9 2.25v9m0 0L5.25 7.5M9 11.25l3.75-3.75M3 14.25h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isMobile && <span style={{ lineHeight: 1 }}>Download</span>}
        </button>

        <button
          onClick={() => set({ previewOpen: true })}
          title="Preview in Ramp"
          aria-label={isMobile ? 'Preview' : undefined}
          style={{
            height: 44,
            width: isMobile ? 44 : undefined,
            paddingLeft: isMobile ? 0 : 16,
            paddingRight: isMobile ? 0 : 20,
            borderRadius: isMobile ? '50%' : 9999,
            border: 'none',
            background: '#18181b',
            boxShadow: '0 4px 24px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: isMobile ? 0 : 8,
            fontSize: 14, fontWeight: 500,
            color: 'rgba(255,255,255,0.95)',
            fontFamily: 'inherit',
            transition: 'background 160ms cubic-bezier(0.22, 1, 0.36, 1), transform 160ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#27272a')}
          onMouseLeave={e => (e.currentTarget.style.background = '#18181b')}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width={isMobile ? 18 : 15} height={isMobile ? 18 : 15} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 9s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" />
            <circle cx="9" cy="9" r="2.5" />
          </svg>
          {!isMobile && <span style={{ lineHeight: 1 }}>Preview</span>}
        </button>
      </div>

      {isMobile && <MobileSettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />}

      <PreviewDrawer />
      <FlipCursor />
    </div>
  )
}
