'use client'
import { useEffect, useRef, useState } from 'react'
import opentype from 'opentype.js'

interface Props {
  text: string
  replayKey: number
  height?: number
  fontSize?: number
  color?: string
  delaySeconds?: number
  durationSeconds?: number
}

let fontPromise: Promise<opentype.Font> | null = null
function loadFont(): Promise<opentype.Font> {
  if (!fontPromise) {
    fontPromise = opentype.load('/fonts/HomemadeApple.ttf')
  }
  return fontPromise
}

interface SigData {
  glyphs: string[]
  viewBox: string
}

/**
 * Per-glyph outline trace. Each character is a separate stroked path and
 * we reveal them one at a time by setting `stroke-dashoffset` each frame.
 *
 * Uses requestAnimationFrame + setAttribute instead of WAAPI / CSS classes
 * because class restart is unreliable on SVG paths and WAAPI's `fill:forwards`
 * leaves the path in its fully-drawn state until the next delay tick, which
 * made the signature appear pre-drawn on flip.
 */
export function AnimatedSignature({
  text,
  replayKey,
  height = 26,
  fontSize = 22,
  color = 'rgba(20,20,30,0.88)',
  delaySeconds = 0.15,
  durationSeconds = 2.2,
}: Props) {
  const [data, setData] = useState<SigData | null>(null)
  const glyphRefs = useRef<(SVGPathElement | null)[]>([])

  useEffect(() => {
    let cancelled = false
    loadFont().then((font) => {
      if (cancelled) return
      const fontScale = fontSize / font.unitsPerEm
      const glyphs: string[] = []
      let x = 0
      let prevGlyph: opentype.Glyph | null = null
      let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity
      for (const char of text) {
        const glyph = font.charToGlyph(char)
        if (prevGlyph) {
          const k = font.getKerningValue(prevGlyph, glyph) || 0
          x += k * fontScale
        }
        const p = glyph.getPath(x, fontSize * 0.82, fontSize)
        const d = p.toPathData(2)
        const bbox = p.getBoundingBox()
        if (d && isFinite(bbox.x1)) {
          glyphs.push(d)
          xMin = Math.min(xMin, bbox.x1)
          xMax = Math.max(xMax, bbox.x2)
          yMin = Math.min(yMin, bbox.y1)
          yMax = Math.max(yMax, bbox.y2)
        }
        x += glyph.advanceWidth * fontScale
        prevGlyph = glyph
      }
      const pad = 2
      const w = Math.max(xMax - xMin + pad * 2, 1)
      const h = Math.max(yMax - yMin + pad * 2, 1)
      setData({
        glyphs,
        viewBox: `${xMin - pad} ${yMin - pad} ${w} ${h}`,
      })
    })
    return () => { cancelled = true }
  }, [text, fontSize])

  useEffect(() => {
    if (!data) return
    const n = data.glyphs.length
    if (n === 0) return
    const totalMs = durationSeconds * 1000
    const baseDelayMs = delaySeconds * 1000
    const stepMs = totalMs / n
    const perGlyphMs = stepMs * 1.4

    // Snapshot each glyph's length and force every one into its hidden
    // start state *now*, before the rAF loop begins, so nothing lingers
    // from the previous trace.
    interface Slot { el: SVGPathElement; length: number; startMs: number }
    const slots: Slot[] = []
    for (let i = 0; i < n; i++) {
      const el = glyphRefs.current[i]
      if (!el) continue
      const length = el.getTotalLength() || 1
      el.setAttribute('stroke-dasharray', String(length))
      el.setAttribute('stroke-dashoffset', String(length))
      slots.push({ el, length, startMs: baseDelayMs + i * stepMs })
    }

    const start = performance.now()
    let raf = 0
    const easeInOut = (p: number) =>
      p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2

    const step = (now: number) => {
      const t = now - start
      let active = false
      for (const s of slots) {
        const elapsed = t - s.startMs
        if (elapsed < 0) {
          active = true
          continue
        }
        const p = Math.min(elapsed / perGlyphMs, 1)
        const eased = easeInOut(p)
        s.el.setAttribute('stroke-dashoffset', String(s.length * (1 - eased)))
        if (p < 1) active = true
      }
      if (active) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [data, replayKey, delaySeconds, durationSeconds])

  const viewBox = data ? data.viewBox : `0 0 240 ${height}`

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMinYMid meet"
      style={{ width: '100%', height, display: 'block', overflow: 'visible' }}
    >
      {data?.glyphs.map((d, i) => (
        <path
          key={i}
          ref={el => { glyphRefs.current[i] = el }}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
