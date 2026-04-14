'use client'
import { useEffect, useId, useRef, useState } from 'react'
import opentype from 'opentype.js'

interface Props {
  text: string
  replayKey: number
  fontPath?: string
  height?: number
  fontSize?: number
  color?: string
  delaySeconds?: number
  durationSeconds?: number
}

const fontCache = new Map<string, Promise<opentype.Font>>()
function loadFont(path: string): Promise<opentype.Font> {
  if (!fontCache.has(path)) {
    fontCache.set(path, opentype.load(path))
  }
  return fontCache.get(path)!
}

interface Glyph {
  d: string
  x: number
  y: number
  w: number
  h: number
}

interface SigData {
  glyphs: Glyph[]
  viewBox: string
}

/**
 * Per-glyph left-to-right wipe. Each character renders as its own filled
 * path, clipped by a rect whose width grows from 0 → the glyph's bbox
 * width over time. Glyphs are staggered in reading order so the signature
 * fills in letter by letter, left to right — the closest honest approximation
 * of cursive writing we can do from glyph outlines alone (opentype exposes
 * perimeters, not centerlines, so a true stroke-trace renders as hollow
 * double-lines around each letter instead of a pen stroke).
 */
export function AnimatedSignature({
  text,
  replayKey,
  fontPath = '/fonts/HomemadeApple.ttf',
  height = 26,
  fontSize = 22,
  color = 'rgba(20,20,30,0.88)',
  delaySeconds = 0.15,
  durationSeconds = 2.2,
}: Props) {
  const [data, setData] = useState<SigData | null>(null)
  const rectRefs = useRef<(SVGRectElement | null)[]>([])
  const reactId = useId()
  const clipIdBase = `sig-clip-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`

  useEffect(() => {
    let cancelled = false
    loadFont(fontPath).then((font) => {
      if (cancelled) return
      const fontScale = fontSize / font.unitsPerEm
      const glyphs: Glyph[] = []
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
          glyphs.push({
            d,
            x: bbox.x1,
            y: bbox.y1,
            w: Math.max(bbox.x2 - bbox.x1, 0.1),
            h: bbox.y2 - bbox.y1,
          })
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
  }, [text, fontSize, fontPath])

  useEffect(() => {
    if (!data) return
    const n = data.glyphs.length
    if (n === 0) return
    const totalMs = durationSeconds * 1000
    const baseDelayMs = delaySeconds * 1000
    const stepMs = totalMs / n
    // Slight overlap between consecutive letters so cursive connections
    // aren't visibly interrupted.
    const perGlyphMs = stepMs * 1.25

    // Reset every rect to width 0 before the rAF loop starts so no glyph
    // lingers from the previous trace.
    for (let i = 0; i < n; i++) {
      const el = rectRefs.current[i]
      if (el) el.setAttribute('width', '0')
    }

    const start = performance.now()
    let raf = 0
    const easeOut = (p: number) => 1 - Math.pow(1 - p, 3)

    const step = (now: number) => {
      const t = now - start
      let active = false
      for (let i = 0; i < n; i++) {
        const el = rectRefs.current[i]
        if (!el) continue
        const startMs = baseDelayMs + i * stepMs
        const elapsed = t - startMs
        if (elapsed < 0) {
          active = true
          continue
        }
        const p = Math.min(elapsed / perGlyphMs, 1)
        const eased = easeOut(p)
        el.setAttribute('width', String(data.glyphs[i].w * eased))
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
      {data && (
        <>
          <defs>
            {data.glyphs.map((g, i) => (
              <clipPath key={i} id={`${clipIdBase}-${i}`}>
                <rect
                  ref={el => { rectRefs.current[i] = el }}
                  x={g.x}
                  y={g.y - 10}
                  width={0}
                  height={g.h + 20}
                />
              </clipPath>
            ))}
          </defs>
          {data.glyphs.map((g, i) => (
            <path
              key={i}
              d={g.d}
              fill={color}
              clipPath={`url(#${clipIdBase}-${i})`}
            />
          ))}
        </>
      )}
    </svg>
  )
}
