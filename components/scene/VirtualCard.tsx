'use client'
import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { createRoundedRectGeometry } from '@/lib/roundedRect'
import { useCardStore } from '@/store/cardStore'
import { useMouseParallax } from '@/hooks/useMouseParallax'
import { PRESETS } from '@/lib/presets'

const CARD_W = 3.37
const CARD_H = 2.125
const CARD_R = 0.12

const vertSrc = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragSrc = `
uniform float uTime;
uniform vec3  uBaseColor;
uniform vec3  uBaseColor2;
uniform float uHoloIntensity;
uniform float uNoiseIntensity;
uniform float uGlowIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

vec3 mod289v3(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289v2(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute3(vec3 x) { return mod289v3(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289v2(i);
  vec3 p = permute3(permute3(i.y + vec3(0.0,i1.y,1.0)) + i.x + vec3(0.0,i1.x,1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 holo(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.333, 0.667)));
}

void main() {
  vec3 n = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float nDotV = max(dot(n, viewDir), 0.0);
  float fresnel = pow(1.0 - nDotV, 3.0);

  vec3 base = mix(uBaseColor, uBaseColor2, vUv.y);

  float holoNoise = snoise(vUv * 3.0 + uTime * 0.15) * 0.5 + 0.5;
  float holoAngle = nDotV + uTime * 0.25;
  vec3 rainbow = holo(holoAngle * 0.6 + holoNoise * 0.4);
  base = mix(base, rainbow, uHoloIntensity * (0.3 + holoNoise * 0.7));

  float grain = snoise(vUv * 80.0 + uTime * 0.05);
  base += grain * uNoiseIntensity * 0.06;

  base += fresnel * uGlowIntensity * 0.5;

  vec3 lightDir = normalize(vec3(2.0, 3.0, 4.0));
  float spec = pow(max(dot(reflect(-lightDir, n), viewDir), 0.0), 48.0);
  base += spec * 0.4;

  gl_FragColor = vec4(clamp(base, 0.0, 1.0), 1.0);
}
`

export function VirtualCard() {
  const groupRef = useRef<THREE.Group>(null)
  const textRef  = useRef<HTMLDivElement>(null)
  const mouse = useMouseParallax()

  const { tiltSensitivity, holoIntensity, noiseIntensity, glowIntensity,
          floatHeight, floatSpeed, preset } = useCardStore()

  const { camera, size } = useThree()
  const [cardPx, setCardPx] = useState({ w: CARD_W * 96, h: CARD_H * 96, perspective: 1100 })
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    const tanHalf = Math.tan((cam.fov * Math.PI) / 180 / 2)
    const pxPerUnit = size.height / (2 * cam.position.z * tanHalf)
    setCardPx({
      w: CARD_W * pxPerUnit,
      h: CARD_H * pxPerUnit,
      perspective: cam.position.z * pxPerUnit,
    })
  }, [camera, size.width, size.height])

  const colors = PRESETS[preset]

  const geometry = useMemo(() => createRoundedRectGeometry(CARD_W, CARD_H, CARD_R, 8), [])

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime:         { value: 0 },
      uBaseColor:    { value: new THREE.Color('#f5f4f0') },
      uBaseColor2:   { value: new THREE.Color('#e8e6e0') },
      uHoloIntensity:{ value: 0.6 },
      uNoiseIntensity:{ value: 0.3 },
      uGlowIntensity: { value: 0.4 },
    },
    vertexShader: vertSrc,
    fragmentShader: fragSrc,
    side: THREE.FrontSide,
  }), [])

  const targetColor  = useMemo(() => new THREE.Color(), [])
  const targetColor2 = useMemo(() => new THREE.Color(), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const s = 0.06  // lerp speed — lower = slower transition
    material.uniforms.uTime.value = t
    material.uniforms.uHoloIntensity.value  += (holoIntensity  - material.uniforms.uHoloIntensity.value)  * s
    material.uniforms.uNoiseIntensity.value += (noiseIntensity - material.uniforms.uNoiseIntensity.value) * s
    material.uniforms.uGlowIntensity.value  += (glowIntensity  - material.uniforms.uGlowIntensity.value)  * s
    targetColor.set(colors.base)
    targetColor2.set(colors.base2)
    material.uniforms.uBaseColor.value.lerp(targetColor, s)
    material.uniforms.uBaseColor2.value.lerp(targetColor2, s)

    if (groupRef.current) {
      const amp = floatHeight * 0.15
      const freq = floatSpeed * 0.8 + 0.2
      groupRef.current.position.y = Math.sin(t * freq) * amp

      const sens = tiltSensitivity * 0.4
      groupRef.current.rotation.x += ((-mouse.current.y * sens) - groupRef.current.rotation.x) * 0.08
      groupRef.current.rotation.y += ((mouse.current.x * sens) - groupRef.current.rotation.y) * 0.08

      // Mirror card rotation onto HTML text overlay so text sits on the card surface
      if (textRef.current) {
        const rx = groupRef.current.rotation.x * (180 / Math.PI)
        const ry = groupRef.current.rotation.y * (180 / Math.PI)
        textRef.current.style.transform = `perspective(${cardPx.perspective}px) rotateX(${-rx}deg) rotateY(${ry}deg)`
      }
    }
  })

  const textColor = colors.textDark ? '#1a1a1a' : '#f0f0f0'

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} material={material} />

      <Html
        center
        zIndexRange={[50, 0]}
        style={{ width: `${cardPx.w}px`, height: `${cardPx.h}px`, pointerEvents: 'none' }}
      >
        <div ref={textRef} style={{ width: '100%', height: '100%', position: 'relative', color: textColor, fontFamily: 'Inter, sans-serif' }}>
          <div style={{ position: 'absolute', top: 20, left: 24 }}>
            <img
              src="/ramp-logo.svg"
              alt="Ramp"
              style={{ height: 16, width: 'auto', filter: colors.textDark ? 'none' : 'invert(1)', display: 'block' }}
            />
          </div>
          <div style={{ position: 'absolute', top: 18, right: 22, fontWeight: 900, fontSize: 20, letterSpacing: '0.05em', fontStyle: 'italic' }}>
            VISA
          </div>
          <div style={{ position: 'absolute', top: 68, left: 24, width: 36, height: 28, borderRadius: 4, background: colors.textDark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)', border: `1px solid ${colors.textDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)'}` }} />
          <div style={{ position: 'absolute', bottom: 48, left: 24, fontSize: 13, letterSpacing: '0.15em', fontWeight: 500, opacity: 0.85 }}>
            4111  1111  1111  1234
          </div>
          <div style={{ position: 'absolute', bottom: 20, left: 24, fontSize: 11, letterSpacing: '0.05em', opacity: 0.7, fontWeight: 500 }}>
            CHARLES SHIN
          </div>
          <div style={{ position: 'absolute', bottom: 20, right: 22, fontSize: 11, letterSpacing: '0.05em', opacity: 0.7, fontWeight: 500 }}>
            12/28
          </div>
        </div>
      </Html>
    </group>
  )
}
