'use client'
import { useCallback, useRef } from 'react'

export function useDrag(onDelta: (dy: number) => void) {
  const dragging = useRef(false)
  const lastY = useRef(0)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    lastY.current = e.clientY
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dy = lastY.current - e.clientY   // up = positive
    lastY.current = e.clientY
    onDelta(dy)
  }, [onDelta])

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  return { onPointerDown, onPointerMove, onPointerUp }
}
