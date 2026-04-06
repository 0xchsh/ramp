import * as THREE from 'three'

export function createRoundedRectGeometry(
  width: number,
  height: number,
  radius: number,
  segments = 4
): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  const x = -width / 2
  const y = -height / 2
  const w = width
  const h = height
  const r = radius

  shape.moveTo(x + r, y)
  shape.lineTo(x + w - r, y)
  shape.quadraticCurveTo(x + w, y, x + w, y + r)
  shape.lineTo(x + w, y + h - r)
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  shape.lineTo(x + r, y + h)
  shape.quadraticCurveTo(x, y + h, x, y + h - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)

  const geometry = new THREE.ShapeGeometry(shape, segments)
  geometry.computeVertexNormals()
  return geometry
}
