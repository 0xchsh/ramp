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
const DESIGN_W = 340
const DESIGN_H = 214

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
uniform float uBrushedMetal;
uniform float uCarbonFiber;
uniform float uSparkle;
uniform float uIridescence;
uniform float uScanline;
uniform float uParallaxDepth;
uniform float uGradientWave;
uniform float uRimLight;
uniform float uCaustics;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

/* ── Noise helpers ─────────────────────────────── */
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

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 holo(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.333, 0.667)));
}

void main() {
  vec3 n = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float nDotV = max(dot(n, viewDir), 0.0);
  float fresnel = pow(1.0 - nDotV, 3.0);
  vec3 lightDir = normalize(vec3(2.0, 3.0, 4.0));

  /* ── Base gradient ───────────────────────────── */
  vec3 base = mix(uBaseColor, uBaseColor2, vUv.y);

  /* ── Parallax depth (fake inner layers) ──────── */
  if (uParallaxDepth > 0.001) {
    vec3 viewTan = normalize(viewDir - n * dot(viewDir, n));
    vec2 pOff = viewTan.xy * uParallaxDepth * 0.05;
    float d1 = snoise((vUv + pOff) * 4.0 + uTime * 0.1);
    float d2 = snoise((vUv + pOff * 2.0) * 6.0 - uTime * 0.08);
    float depth = (d1 * 0.5 + d2 * 0.5) * 0.5 + 0.5;
    base = mix(base, base * (0.8 + depth * 0.4), uParallaxDepth * 0.5);
  }

  /* ── Carbon fiber weave ──────────────────────── */
  if (uCarbonFiber > 0.001) {
    vec2 cfUv = vUv * 24.0;
    float cf1 = smoothstep(0.35, 0.5, abs(sin(cfUv.x * 3.14159)));
    float cf2 = smoothstep(0.35, 0.5, abs(sin(cfUv.y * 3.14159)));
    float checker = step(0.5, fract((floor(cfUv.x) + floor(cfUv.y)) * 0.5));
    float cfPattern = mix(cf1, cf2, checker);
    // Subtle sheen shift on the weave
    float cfSheen = pow(max(dot(reflect(-lightDir, n), viewDir), 0.0), 16.0) * 0.3;
    vec3 cfColor = base * (0.65 + cfPattern * 0.35) + cfSheen;
    base = mix(base, cfColor, uCarbonFiber);
  }

  /* ── Gradient wave (lava lamp) ───────────────── */
  if (uGradientWave > 0.001) {
    float wave = sin(vUv.x * 3.0 + vUv.y * 2.0 + uTime * 0.5) * 0.5 + 0.5;
    float wave2 = sin(vUv.x * 1.5 - vUv.y * 4.0 + uTime * 0.35) * 0.5 + 0.5;
    vec3 wc1 = uBaseColor * 1.4;
    vec3 wc2 = uBaseColor2 * 0.6;
    vec3 waveColor = mix(wc1, wc2, wave * 0.6 + wave2 * 0.4);
    base = mix(base, waveColor, uGradientWave * 0.45);
  }

  /* ── Holographic rainbow ─────────────────────── */
  float holoNoise = snoise(vUv * 3.0 + uTime * 0.15) * 0.5 + 0.5;
  float holoAngle = nDotV + uTime * 0.25;
  vec3 rainbow = holo(holoAngle * 0.6 + holoNoise * 0.4);
  base = mix(base, rainbow, uHoloIntensity * (0.3 + holoNoise * 0.7));

  /* ── Iridescence (thin-film interference) ────── */
  if (uIridescence > 0.001) {
    float iridAngle = acos(clamp(nDotV, 0.0, 1.0));
    float filmThickness = 1.2;
    float iridPhase = 2.0 * filmThickness * iridAngle;
    vec3 iridColor = 0.5 + 0.5 * cos(6.28318 * (iridPhase * vec3(1.0, 1.2, 1.4) + vec3(0.0, 0.1, 0.2)));
    base = mix(base, iridColor, uIridescence * fresnel * 2.5);
  }

  /* ── Brushed metal (anisotropic highlight) ───── */
  if (uBrushedMetal > 0.001) {
    vec3 tangent = normalize(vec3(1.0, 0.0, 0.0));
    vec3 bitangent = cross(n, tangent);
    vec3 halfVec = normalize(lightDir + viewDir);
    float tDotH = dot(tangent, halfVec);
    float bDotH = dot(bitangent, halfVec);
    float nDotH = dot(n, halfVec);
    float alphaX = 0.35;
    float alphaY = 0.02;
    float exponent = -2.0 * ((tDotH * tDotH) / (alphaX * alphaX) + (bDotH * bDotH) / (alphaY * alphaY)) / (1.001 + nDotH);
    float aniso = exp(exponent);
    // Add streak noise for realism
    float streak = snoise(vec2(vUv.x * 120.0, vUv.y * 2.0)) * 0.5 + 0.5;
    base += aniso * uBrushedMetal * 0.7 * (0.7 + streak * 0.3);
  }

  /* ── Sparkle / glitter ───────────────────────── */
  if (uSparkle > 0.001) {
    vec2 sparkleCell = floor(vUv * 350.0);
    float sparkleH = hash21(sparkleCell);
    float threshold = 1.0 - uSparkle * 0.06;
    float sparkleAngle = dot(viewDir, vec3(fract(sparkleCell * 0.013), 0.5));
    float flash = smoothstep(threshold, 1.0, sparkleH)
                * (0.5 + 0.5 * sin(sparkleAngle * 60.0 + uTime * 4.0));
    base += flash * uSparkle * 1.6;
  }

  /* ── Noise grain ─────────────────────────────── */
  float grain = snoise(vUv * 80.0 + uTime * 0.05);
  base += grain * uNoiseIntensity * 0.06;

  /* ── Scanline ────────────────────────────────── */
  if (uScanline > 0.001) {
    float scan = 0.5 + 0.5 * sin(vUv.y * 450.0 + uTime * 2.0);
    float scanBright = 0.5 + 0.5 * sin(vUv.y * 80.0 - uTime * 1.2);
    base = mix(base, base * scan, uScanline * 0.25);
    // Faint rolling bright band
    base += smoothstep(0.6, 1.0, scanBright) * uScanline * 0.06;
  }

  /* ── Fresnel glow ────────────────────────────── */
  base += fresnel * uGlowIntensity * 0.5;

  /* ── Rim light (colored edge glow) ───────────── */
  if (uRimLight > 0.001) {
    float rim = pow(1.0 - nDotV, 4.0);
    // Derive rim color from base colors – shifted toward blue/cyan
    vec3 rimCol = normalize(uBaseColor + vec3(0.2, 0.4, 1.0)) * 1.2;
    base += rim * uRimLight * rimCol;
  }

  /* ── Caustics ────────────────────────────────── */
  if (uCaustics > 0.001) {
    float c1 = sin(vUv.x * 15.0 + uTime * 0.9) * sin(vUv.y * 12.0 + uTime * 0.7);
    float c2 = sin(vUv.x * 10.0 - uTime * 0.5) * sin(vUv.y * 18.0 + uTime * 1.3);
    float c3 = sin((vUv.x + vUv.y) * 8.0 + uTime * 0.6);
    float caustic = pow(max(0.5 + 0.5 * (c1 + c2 * 0.5 + c3 * 0.3), 0.0), 3.0);
    base += caustic * uCaustics * 0.35;
  }

  /* ── Specular highlight ──────────────────────── */
  float spec = pow(max(dot(reflect(-lightDir, n), viewDir), 0.0), 48.0);
  base += spec * 0.4;

  gl_FragColor = vec4(clamp(base, 0.0, 1.0), 1.0);
}
`

export function VirtualCard() {
  const groupRef = useRef<THREE.Group>(null)
  const textRef  = useRef<HTMLDivElement>(null)
  const mouse = useMouseParallax()

  const {
    cardName,
    tiltSensitivity, holoIntensity, noiseIntensity, glowIntensity,
    brushedMetal, carbonFiber, sparkle, iridescence,
    scanline, parallaxDepth, gradientWave,
    rimLight, caustics,
    floatHeight, floatSpeed, preset,
  } = useCardStore()

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
      uTime:           { value: 0 },
      uBaseColor:      { value: new THREE.Color('#f5f4f0') },
      uBaseColor2:     { value: new THREE.Color('#e8e6e0') },
      uHoloIntensity:  { value: 0.6 },
      uNoiseIntensity: { value: 0.3 },
      uGlowIntensity:  { value: 0.4 },
      uBrushedMetal:   { value: 0 },
      uCarbonFiber:    { value: 0 },
      uSparkle:        { value: 0 },
      uIridescence:    { value: 0 },
      uScanline:       { value: 0 },
      uParallaxDepth:  { value: 0 },
      uGradientWave:   { value: 0 },
      uRimLight:       { value: 0 },
      uCaustics:       { value: 0 },
    },
    vertexShader: vertSrc,
    fragmentShader: fragSrc,
    side: THREE.FrontSide,
  }), [])

  const targetColor  = useMemo(() => new THREE.Color(), [])
  const targetColor2 = useMemo(() => new THREE.Color(), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const s = 0.06
    const u = material.uniforms
    u.uTime.value = t
    u.uHoloIntensity.value  += (holoIntensity  - u.uHoloIntensity.value)  * s
    u.uNoiseIntensity.value += (noiseIntensity - u.uNoiseIntensity.value) * s
    u.uGlowIntensity.value  += (glowIntensity  - u.uGlowIntensity.value)  * s
    u.uBrushedMetal.value   += (brushedMetal   - u.uBrushedMetal.value)   * s
    u.uCarbonFiber.value    += (carbonFiber    - u.uCarbonFiber.value)    * s
    u.uSparkle.value        += (sparkle        - u.uSparkle.value)        * s
    u.uIridescence.value    += (iridescence    - u.uIridescence.value)    * s
    u.uScanline.value       += (scanline       - u.uScanline.value)       * s
    u.uParallaxDepth.value  += (parallaxDepth  - u.uParallaxDepth.value)  * s
    u.uGradientWave.value   += (gradientWave   - u.uGradientWave.value)   * s
    u.uRimLight.value       += (rimLight       - u.uRimLight.value)       * s
    u.uCaustics.value       += (caustics       - u.uCaustics.value)       * s

    targetColor.set(colors.base)
    targetColor2.set(colors.base2)
    u.uBaseColor.value.lerp(targetColor, s)
    u.uBaseColor2.value.lerp(targetColor2, s)

    if (groupRef.current) {
      const amp = floatHeight * 0.15
      const freq = floatSpeed * 0.8 + 0.2
      groupRef.current.position.y = Math.sin(t * freq) * amp

      const sens = tiltSensitivity * 0.4
      groupRef.current.rotation.x += ((-mouse.current.y * sens) - groupRef.current.rotation.x) * 0.08
      groupRef.current.rotation.y += ((mouse.current.x * sens) - groupRef.current.rotation.y) * 0.08

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
          <div style={{ width: DESIGN_W, height: DESIGN_H, position: 'absolute', top: 0, left: 0, transformOrigin: 'top left', transform: `scale(${cardPx.w / DESIGN_W})` }}>
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
              {(cardName || 'CHARLES SHIN').toUpperCase()}
            </div>
            <div style={{ position: 'absolute', bottom: 20, right: 22, fontSize: 11, letterSpacing: '0.05em', opacity: 0.7, fontWeight: 500 }}>
              12/28
            </div>
          </div>
        </div>
      </Html>
    </group>
  )
}
