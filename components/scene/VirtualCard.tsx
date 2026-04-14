'use client'
import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { createRoundedRectGeometry } from '@/lib/roundedRect'
import { useCardStore, HOLO_PATTERN_KIND, MATERIAL_IDS, SIGNATURE_FONTS } from '@/store/cardStore'
import { useMouseParallax } from '@/hooks/useMouseParallax'
import { AnimatedSignature } from './AnimatedSignature'
import { RampLogo } from '../RampLogo'

// Relative luminance of a hex color, used to pick dark vs light on-card text.
function hexLuminance(hex: string): number {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const toLin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b)
}

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
uniform int   uHoloPattern;
uniform int   uMaterial;
uniform float uNoiseIntensity;
uniform float uHoloSpeed;
uniform float uHoloScale;
uniform float uHoloVariance;
uniform float uHoloRotation;

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

// Rotate a UV coordinate around (0.5, 0.5) by angle radians.
vec2 rotateUV(vec2 uv, float angle) {
  vec2 c = uv - 0.5;
  float ca = cos(angle);
  float sa = sin(angle);
  return vec2(c.x * ca - c.y * sa, c.x * sa + c.y * ca) + 0.5;
}

// Returns a 0..1 modulation value and a pattern-shifted angle for holographic rainbow.
// out ang: added to the rainbow phase so color shifts with the pattern.
// out mod: multiplies mix strength so pattern also controls opacity/contrast.
void holoLookup(int kind, vec2 uv, float t, out float ang, out float modv) {
  if (kind == 1) {
    // Stripes — diagonal bands of rainbow
    float s = sin((uv.x + uv.y) * 14.0 + t * 0.8);
    ang = s * 0.5;
    modv = 0.35 + 0.65 * (s * 0.5 + 0.5);
  } else if (kind == 2) {
    // Grid — diamond lattice
    vec2 g = uv * 18.0 + vec2(t * 0.2, t * 0.15);
    float gx = abs(sin(g.x));
    float gy = abs(sin(g.y));
    float grid = smoothstep(0.2, 0.9, max(gx, gy));
    ang = (gx - gy) * 0.6;
    modv = 0.3 + 0.7 * grid;
  } else if (kind == 4) {
    // Starburst — angular rays from the center
    vec2 c = uv - 0.5;
    float a = atan(c.y, c.x);
    float rays = sin(a * 12.0 + t * 0.6) * 0.5 + 0.5;
    ang = a * 0.3 + t * 0.05;
    modv = 0.3 + 0.7 * rays;
  } else if (kind == 5) {
    // Flow — smooth moving gradient, based on domain-warped sines
    float w1 = sin(uv.x * 4.0 + t * 0.6 + sin(uv.y * 3.0 + t * 0.4) * 1.2);
    float w2 = cos(uv.y * 5.0 - t * 0.5 + cos(uv.x * 2.5) * 1.0);
    float f = (w1 + w2) * 0.25 + 0.5;
    ang = f * 1.2;
    modv = 0.35 + 0.65 * f;
  } else if (kind == 6) {
    // Waves — horizontal sine ripples, wobbling along x
    float wobble = sin(uv.x * 4.5 + t * 0.4) * 0.35;
    float w = sin(uv.y * 16.0 + wobble + t * 0.9) * 0.5 + 0.5;
    ang = w * 0.9 - 0.45;
    modv = 0.3 + 0.7 * w;
  } else if (kind == 7) {
    // Dots — polka-dot grid, each dot pulses on a staggered phase
    vec2 cell = uv * vec2(12.0, 9.0);
    vec2 id = floor(cell);
    vec2 df = fract(cell) - 0.5;
    float d = length(df);
    float phase = fract(sin(id.x * 12.9898 + id.y * 78.233) * 43758.5453);
    float pulse = 0.25 + 0.2 * sin(t * 2.0 + phase * 6.2832);
    float cellDot = smoothstep(pulse + 0.08, pulse - 0.02, d);
    ang = (phase - 0.5) * 0.8;
    modv = 0.3 + 0.7 * cellDot;
  } else if (kind == 8) {
    // Hex — hexagonal tile centers via skewed grid
    vec2 hUv = uv * vec2(8.0, 9.2);
    hUv.x += fract(floor(hUv.y) * 0.5) * 0.0 + mod(floor(hUv.y), 2.0) * 0.5;
    vec2 hf = fract(hUv) - 0.5;
    float hexDist = max(abs(hf.x) * 1.15, abs(hf.x) * 0.58 + abs(hf.y));
    float hex = smoothstep(0.48, 0.28, hexDist);
    float shimmer = sin(t * 0.6 + floor(hUv.x) * 0.7 + floor(hUv.y) * 0.9);
    ang = hex * 0.6 + shimmer * 0.15;
    modv = 0.3 + 0.7 * hex;
  } else if (kind == 9) {
    // Spiral — logarithmic spiral arms
    vec2 c = uv - 0.5;
    float r = length(c) * 2.0;
    float a = atan(c.y, c.x);
    float arms = sin(a * 4.0 + r * 14.0 - t * 0.8) * 0.5 + 0.5;
    ang = arms * 0.8 + a * 0.1;
    modv = 0.3 + 0.7 * arms;
  } else if (kind == 10) {
    // Scanline — sweeping horizontal CRT bands with a slow rolling brightness wave
    float scan = sin(uv.y * 70.0 + t * 1.4) * 0.5 + 0.5;
    float roll = sin(uv.y * 6.0 - t * 0.5) * 0.5 + 0.5;
    ang = scan * 0.7 - 0.35;
    modv = 0.25 + 0.7 * scan * (0.65 + roll * 0.35);
  } else if (kind == 11) {
    // Checker — classic checkerboard that gently drifts and fades between tiles
    vec2 c = uv * vec2(12.0, 8.0) + vec2(t * 0.12, t * 0.08);
    float check = mod(floor(c.x) + floor(c.y), 2.0);
    float soft = sin(t * 0.6 + floor(c.x) * 0.3 + floor(c.y) * 0.5) * 0.5 + 0.5;
    ang = (check - 0.5) * 0.9;
    modv = 0.25 + 0.7 * mix(check, soft, 0.35);
  } else if (kind == 14) {
    // Chevron — V-shaped zigzag stripes, drifting along x
    float zig = abs(fract(uv.y * 10.0 + t * 0.3) - 0.5) * 2.0;
    float band = sin((uv.x + zig * 0.25) * 16.0 - t * 0.7) * 0.5 + 0.5;
    ang = band * 0.9 - 0.45;
    modv = 0.3 + 0.7 * band;
  } else if (kind == 16) {
    // Mesh — triangular tri-grid via three shifted sine fields
    vec2 m = uv * 10.0 + vec2(t * 0.2, t * 0.15);
    float m1 = abs(sin(m.x));
    float m2 = abs(sin(m.y));
    float m3 = abs(sin(m.x + m.y));
    float mesh = smoothstep(0.2, 0.85, max(max(m1, m2), m3));
    ang = (m1 - m3) * 0.5;
    modv = 0.28 + 0.7 * mesh;
  } else if (kind == 17) {
    // Glitch — corrupted horizontal bands that flicker and shear
    float stripH = 16.0;
    float band = floor(uv.y * stripH);
    float bandTime = floor(t * 4.5);
    float bandRand = hash21(vec2(band, bandTime));
    // 'bandOn' (not 'active') because 'active' is reserved in GLSL ES 3.00
    float bandOn = step(0.72, bandRand);
    float shear = (hash21(vec2(band, bandTime + 1.0)) - 0.5) * 0.35 * bandOn;
    float bars = fract((uv.x + shear) * 28.0 + bandRand * 12.0);
    float bar = step(0.5, bars);
    ang = (bar - 0.5) * 1.4 + bandOn * 0.5;
    modv = 0.22 + 0.75 * bar * (1.0 - bandOn * 0.25) + bandOn * 0.15;
  } else if (kind == 18) {
    // Topo — elevation contour lines from layered simplex noise
    float e1 = snoise(uv * 3.0 + t * 0.08);
    float e2 = snoise(uv * 6.5 - t * 0.06) * 0.35;
    float elev = (e1 + e2) * 0.5 + 0.5;
    float contour = abs(fract(elev * 8.0) - 0.5) * 2.0;
    float lines = smoothstep(0.8, 0.97, 1.0 - contour);
    ang = elev * 1.4 - 0.7;
    modv = 0.18 + 0.8 * lines;
  } else if (kind == 19) {
    // Crosshatch — two groups of ±45° diagonal lines, hand-drawn feel
    float h1 = abs(fract((uv.x + uv.y) * 22.0 + t * 0.25) - 0.5);
    float h2 = abs(fract((uv.x - uv.y) * 20.0 - t * 0.2) - 0.5);
    float line1 = smoothstep(0.42, 0.48, h1);
    float line2 = smoothstep(0.42, 0.48, h2);
    float hatch = max(line1, line2);
    ang = (line1 - line2) * 1.1;
    modv = 0.18 + 0.8 * hatch;
  } else if (kind == 20) {
    // Halftone — print dot pattern with cell sizes modulated by noise
    vec2 cell = uv * 20.0 + vec2(t * 0.15, t * 0.1);
    vec2 id = floor(cell);
    vec2 df = fract(cell) - 0.5;
    float d = length(df);
    float modulate = snoise(id * 0.18 + t * 0.3) * 0.5 + 0.5;
    float dotSize = 0.12 + modulate * 0.32;
    float halfDot = smoothstep(dotSize + 0.04, dotSize - 0.04, d);
    ang = modulate - 0.5;
    modv = 0.2 + 0.78 * halfDot;
  } else {
    // Blotch (default) — simplex-noise blobs
    float n = snoise(uv * 3.0 + t * 0.15) * 0.5 + 0.5;
    ang = n * 0.4;
    modv = 0.3 + 0.7 * n;
  }
}

void main() {
  // Flip the normal and light Z on the back face so every lighting term
  // (fresnel, specular, brushed metal, rim) renders the same material on both sides.
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float nDotV = max(dot(n, viewDir), 0.0);
  float fresnel = pow(1.0 - nDotV, 3.0);
  vec3 lightDir = normalize(gl_FrontFacing ? vec3(2.0, 3.0, 4.0) : vec3(2.0, 3.0, -4.0));

  /* ── Base gradient ───────────────────────────── */
  vec3 base = mix(uBaseColor, uBaseColor2, vUv.y);

  /* ── Material (orthogonal to every slider) ─────
     0 = plastic: matte, soft diffuse shading, no specular
     1 = metal:   chrome-like, base tint replaced with strong reflections + brushed streaks
     2 = glass:   translucent, dim center, bright edges, iridescence + refraction hint
     3 = rainbow: full holographic rainbow shimmer baked in */
  if (uMaterial == 0) {
    // Plastic — soft diffuse, matte. No specular, gentle wraparound light.
    float diffuse = max(dot(n, lightDir), 0.0);
    float wrap = max(dot(n, lightDir) * 0.5 + 0.5, 0.0);
    base *= 0.62 + diffuse * 0.35 + wrap * 0.18;
    // Very subtle backscatter for a non-flat feel
    base += pow(1.0 - nDotV, 2.0) * base * 0.08;
  } else if (uMaterial == 1) {
    // Metal — replace the surface shading with chrome-like reflections.
    // Dim the base color, add strong specular + bright fresnel + anisotropic streaks.
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(n, halfDir), 0.0), 90.0);
    float broadSpec = pow(max(dot(n, halfDir), 0.0), 20.0);
    // Brushed anisotropic highlight
    vec3 tangent = normalize(vec3(1.0, 0.0, 0.0));
    vec3 bitangent = cross(n, tangent);
    float tDotH = dot(tangent, halfDir);
    float bDotH = dot(bitangent, halfDir);
    float nDotH = dot(n, halfDir);
    float alphaX = 0.4;
    float alphaY = 0.02;
    float expv = -2.0 * ((tDotH*tDotH)/(alphaX*alphaX) + (bDotH*bDotH)/(alphaY*alphaY)) / (1.001 + nDotH);
    float aniso = exp(expv);
    // Horizontal brushed streaks
    float streak = snoise(vec2(vUv.x * 140.0, vUv.y * 1.5)) * 0.5 + 0.5;

    // Chrome shading: dim base, bright reflections, fresnel edges
    vec3 tint = mix(vec3(1.0), normalize(base + vec3(0.001)), 0.4);
    vec3 metal = base * 0.32
               + tint * (0.28 + nDotV * 0.26)
               + spec * 2.2
               + broadSpec * 0.42
               + aniso * 1.15 * (0.65 + streak * 0.35)
               + pow(1.0 - nDotV, 1.3) * 0.7;
    base = metal;
  } else if (uMaterial == 2) {
    // Glass — clean colored-glass rendering. No noise. Deep saturated center,
    // bright fresnel edges (light scattering through the glass), subtle
    // thin-film iridescence on the grazing edges, and sharp reflective spec.
    vec3 glassCenter = base * 0.6;
    vec3 glassEdge = mix(base, vec3(1.25), 0.72);

    // Smooth continuous falloff from center to edge via the fresnel term
    float t = smoothstep(0.0, 0.95, 1.0 - nDotV);
    vec3 glass = mix(glassCenter, glassEdge, t);

    // Thin-film iridescence — only barely visible near the edge
    float iridAngle = acos(clamp(nDotV, 0.0, 1.0));
    vec3 iridColor = 0.5 + 0.5 * cos(6.28318 * (iridAngle * 2.0 * vec3(1.0, 1.2, 1.4) + vec3(0.0, 0.1, 0.2)));
    glass = mix(glass, iridColor, fresnel * 0.22);

    // Sharp top-surface reflection
    vec3 halfDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(n, halfDir), 0.0), 90.0);
    float broadSpec = pow(max(dot(n, halfDir), 0.0), 18.0);
    glass += spec * 1.9 + broadSpec * 0.18;

    // Extra edge brightness to suggest refracted light passing through
    glass += pow(1.0 - nDotV, 3.0) * 0.35;

    base = glass;
  } else if (uMaterial == 3) {
    // Rainbow — full holographic shimmer, mostly replaces base hue
    float rAng = nDotV + uTime * 0.3;
    float rNoise = snoise(vUv * 4.0 + uTime * 0.2) * 0.5 + 0.5;
    vec3 rainbow = 0.5 + 0.5 * cos(6.28318 * (rAng * 0.8 + rNoise * 0.4 + vec3(0.0, 0.333, 0.667)));
    base = mix(base, rainbow, 0.75 + rNoise * 0.2);
    base += pow(1.0 - nDotV, 2.0) * 0.3;
  }

  /* ── Pattern layer ─────────────────────────────
     Patterns inherit the card's gradient color. Pattern phase picks between the two
     gradient stops (shifted brighter/darker) so every pattern reads as a 2-tone shimmer
     in the user's chosen color.
     Pattern modifiers: speed/scale exponential around 1x at slider=0.5; variance
     expands modv contrast from a flat 0.5 (variance=0) to 2x contrast (variance=1);
     rotation spins the sample-space UV around the card's center. */
  float patternSpeed = pow(2.0, (uHoloSpeed - 0.5) * 4.0);
  float patternScale = pow(2.0, (uHoloScale - 0.5) * 4.0);
  float patternRot   = uHoloRotation * 6.28318;
  vec2 patternUV = rotateUV(vUv, patternRot);
  patternUV = (patternUV - 0.5) * patternScale + 0.5;
  float patternTime = uTime * patternSpeed;

  float hAng; float hMod;
  holoLookup(uHoloPattern, patternUV, patternTime, hAng, hMod);
  float varianceExpand = uHoloVariance * 2.0;
  hMod = clamp(0.5 + (hMod - 0.5) * varianceExpand, 0.0, 1.0);
  hAng *= varianceExpand;
  float patternPhase = clamp(hAng * 0.5 + 0.5 + sin(nDotV * 3.0 + uTime * 0.3) * 0.15, 0.0, 1.0);
  vec3 patternColor = mix(uBaseColor * 0.5, uBaseColor2 * 1.45, patternPhase);
  base = mix(base, patternColor, uHoloIntensity * hMod);

  /* ── Noise grain ─────────────────────────────── */
  float grain = snoise(vUv * 80.0 + uTime * 0.05);
  base += grain * uNoiseIntensity * 0.06;

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
    baseColor, baseColor2,
    tiltSensitivity, holoIntensity, holoPattern, material,
    holoSpeed, holoScale, holoVariance, holoRotation,
    noiseIntensity,
    floatHeight, floatSpeed,
  } = useCardStore()

  // Pick readable text color from the average luminance of the gradient stops
  const textDark = (hexLuminance(baseColor) + hexLuminance(baseColor2)) / 2 > 0.5
  const textColor = textDark ? '#1a1a1a' : '#f0f0f0'

  const { camera, size } = useThree()
  // Compute synchronously (useMemo) so the first render already has the correct
  // card dimensions. Guard against size={0,0} (R3F's initial value before it
  // measures the container) which would produce NaN and cause a visual glitch.
  // ReadySignal also waits for non-zero size before firing, so the intro never
  // starts until this value is valid.
  const cardPx = useMemo(() => {
    if (size.width === 0 || size.height === 0) {
      return { w: 0, h: 0, perspective: 1100, fit: 0 }
    }
    const cam = camera as THREE.PerspectiveCamera
    const tanHalf = Math.tan((cam.fov * Math.PI) / 180 / 2)
    const pxPerUnit = size.height / (2 * cam.position.z * tanHalf)
    const naturalW = CARD_W * pxPerUnit
    const naturalH = CARD_H * pxPerUnit
    // Shrink the card so it always fits within a safe box of the viewport.
    // Mobile needs tighter vertical budget because the bottom button bar +
    // (potentially) the settings sheet share the screen with the card.
    const isMobile = size.width < 768
    const widthBudget = size.width * (isMobile ? 0.84 : 0.9)
    const heightBudget = size.height * (isMobile ? 0.58 : 0.85)
    const fit = Math.min(1, widthBudget / naturalW, heightBudget / naturalH)
    return {
      w: naturalW * fit,
      h: naturalH * fit,
      perspective: cam.position.z * pxPerUnit,
      fit,
    }
  }, [camera, size.width, size.height])

  const geometry = useMemo(() => createRoundedRectGeometry(CARD_W, CARD_H, CARD_R, 8), [])

  // Initialize every uniform from the current store state so the first rendered
  // frame matches the final look exactly. Without this, the shader starts at
  // hardcoded defaults and lerps over ~30 frames, producing a visible "glitch".
  const shaderMaterial = useMemo(() => {
    const s = useCardStore.getState()
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime:           { value: 0 },
        uBaseColor:      { value: new THREE.Color(s.baseColor) },
        uBaseColor2:     { value: new THREE.Color(s.baseColor2) },
        uHoloIntensity:  { value: s.holoPattern === 'none' ? 0 : s.holoIntensity },
        uHoloPattern:    { value: HOLO_PATTERN_KIND[s.holoPattern] },
        uHoloSpeed:      { value: s.holoSpeed },
        uHoloScale:      { value: s.holoScale },
        uHoloVariance:   { value: s.holoVariance },
        uHoloRotation:   { value: s.holoRotation },
        uMaterial:       { value: MATERIAL_IDS.indexOf(s.material) },
        uNoiseIntensity: { value: s.noiseIntensity },
      },
      vertexShader: vertSrc,
      fragmentShader: fragSrc,
      side: THREE.DoubleSide,
    })
  }, [])

  // Duration-based flip. Each click adds 3π (1 full spin + half) and interpolates
  // with strong ease-in-out so the motion accelerates, carries momentum through
  // the spin, and decelerates gently to a stop.
  const FLIP_DURATION = 1.2
  const flipRef = useRef({ from: 0, to: 0, current: 0, startedAt: -1 })
  // Used as a React key so the signature element remounts and replays its write animation.
  // We delay the bump so the existing signature stays fully drawn while the back face is
  // still partially visible during the first half of the flip.
  const [flipVersion, setFlipVersion] = useState(0)
  const [fontVersion, setFontVersion] = useState(0)
  const signatureFont = useCardStore(s => s.signatureFont)
  const fontDef = SIGNATURE_FONTS.find(f => f.id === signatureFont) ?? SIGNATURE_FONTS[0]
  const prevFontRef = useRef(signatureFont)
  useEffect(() => {
    if (prevFontRef.current !== signatureFont) {
      prevFontRef.current = signatureFont
      setFontVersion(v => v + 1)
    }
  }, [signatureFont])

  const handleFlip = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const f = flipRef.current
    f.from = f.current
    f.to = f.to + Math.PI * 3
    f.startedAt = performance.now() / 1000
    // Bump the signature key when the card is past its midpoint so the swap happens
    // while the back face is not facing the camera — the user never sees it reset.
    setTimeout(() => setFlipVersion(v => v + 1), FLIP_DURATION * 1000 * 0.55)
  }

  const targetColor  = useMemo(() => new THREE.Color(), [])
  const targetColor2 = useMemo(() => new THREE.Color(), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const s = 0.06
    const u = shaderMaterial.uniforms
    u.uTime.value = t
    const effectiveIntensity = holoPattern === 'none' ? 0 : holoIntensity
    u.uHoloIntensity.value  += (effectiveIntensity - u.uHoloIntensity.value)  * s
    u.uHoloPattern.value = HOLO_PATTERN_KIND[holoPattern]
    u.uHoloSpeed.value     += (holoSpeed    - u.uHoloSpeed.value)     * s
    u.uHoloScale.value     += (holoScale    - u.uHoloScale.value)     * s
    u.uHoloVariance.value  += (holoVariance - u.uHoloVariance.value)  * s
    u.uHoloRotation.value  += (holoRotation - u.uHoloRotation.value)  * s
    u.uMaterial.value = MATERIAL_IDS.indexOf(material)
    u.uNoiseIntensity.value += (noiseIntensity - u.uNoiseIntensity.value) * s

    targetColor.set(baseColor)
    targetColor2.set(baseColor2)
    u.uBaseColor.value.lerp(targetColor, s)
    u.uBaseColor2.value.lerp(targetColor2, s)

    if (groupRef.current) {
      // Keep the 3D mesh the same visual size as the HTML overlay on narrow
      // viewports. cardPx.fit = 1 on desktop, <1 on mobile.
      groupRef.current.scale.setScalar(cardPx.fit)

      // Download mode: snap the card to a straight-on flat rotation, matching
      // whichever face was visible at the moment capture was requested. No
      // float, no tilt, no in-progress flip — clean frame for the PNG.
      const storeState = useCardStore.getState()
      const downloadMode = storeState.downloadMode
      if (downloadMode) {
        const currentFlip = flipRef.current.current
        const norm = ((currentFlip % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
        const isBack = norm > Math.PI / 2 && norm < Math.PI * 1.5
        const flat = isBack ? Math.PI : 0
        groupRef.current.rotation.x = 0
        groupRef.current.rotation.y = flat
        groupRef.current.position.y = 0
        groupRef.current.userData.flipCurrentApplied = flat
        if (textRef.current) {
          if (storeState.captureMode) {
            // html2canvas can't project CSS 3D transforms — flatten the
            // overlay so the snapshot sees an upright 2D element. The
            // handler separately flips .card-face-back's own rotateY(180)
            // so the back face content reads right-way-around.
            textRef.current.style.transform = 'none'
          } else {
            const ry = flat * (180 / Math.PI)
            textRef.current.style.transform = `perspective(${cardPx.perspective}px) rotateX(0deg) rotateY(${ry}deg)`
          }
          textRef.current.dataset.face = isBack ? 'back' : 'front'
        }
        return
      }

      const amp = floatHeight * 0.15
      const freq = floatSpeed * 0.8 + 0.2
      groupRef.current.position.y = Math.sin(t * freq) * amp

      // Duration-based flip with strong ease-in-out
      const f = flipRef.current
      if (f.startedAt >= 0) {
        const elapsed = (performance.now() / 1000) - f.startedAt
        const p = Math.min(elapsed / FLIP_DURATION, 1)
        // easeInOutQuint — strong ease-in-out that feels close to cubic-bezier(0.77, 0, 0.175, 1)
        const eased = p < 0.5
          ? 16 * p * p * p * p * p
          : 1 - Math.pow(-2 * p + 2, 5) / 2
        f.current = f.from + (f.to - f.from) * eased
        if (p >= 1) {
          f.current = f.to
          f.startedAt = -1
        }
      }

      const sens = tiltSensitivity * 0.4
      const targetTiltX = -mouse.current.y * sens
      const targetTiltY = mouse.current.x * sens
      // Keep tilt as its own value so we can compose with the flip below
      groupRef.current.rotation.x += (targetTiltX - groupRef.current.rotation.x) * 0.08
      const tiltY = groupRef.current.rotation.y - (groupRef.current.userData.flipCurrentApplied ?? 0)
      const newTiltY = tiltY + (targetTiltY - tiltY) * 0.08
      groupRef.current.rotation.y = newTiltY + flipRef.current.current
      groupRef.current.userData.flipCurrentApplied = flipRef.current.current

      if (textRef.current) {
        const rx = groupRef.current.rotation.x * (180 / Math.PI)
        const ry = groupRef.current.rotation.y * (180 / Math.PI)
        textRef.current.style.transform = `perspective(${cardPx.perspective}px) rotateX(${-rx}deg) rotateY(${ry}deg)`
        // Track which face is currently facing the camera so the download handler
        // can capture the right side.
        const norm = ((groupRef.current.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
        const isBack = norm > Math.PI / 2 && norm < Math.PI * 1.5
        textRef.current.dataset.face = isBack ? 'back' : 'front'
      }
    }
  })

  const faceScale = cardPx.w / DESIGN_W
  const stripeBg = textDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.25)'

  return (
    <group ref={groupRef}>
      <mesh
        geometry={geometry}
        material={shaderMaterial}
        onClick={handleFlip}
        onPointerOver={() => {
          document.body.style.cursor = 'none'
          useCardStore.getState().set({ cursorOverCard: true })
        }}
        onPointerOut={() => {
          document.body.style.cursor = ''
          useCardStore.getState().set({ cursorOverCard: false, cursorPressed: false })
        }}
        onPointerDown={() => useCardStore.getState().set({ cursorPressed: true })}
        onPointerUp={() => useCardStore.getState().set({ cursorPressed: false })}
      />

      <Html
        center
        zIndexRange={[50, 0]}
        style={{ width: `${cardPx.w}px`, height: `${cardPx.h}px`, pointerEvents: 'none' }}
      >
        <div
          ref={textRef}
          className="card-face-root"
          data-face="front"
          style={{
            width: '100%', height: '100%', position: 'relative',
            color: textColor, fontFamily: 'Inter, sans-serif',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Front face */}
          <div className="card-face-front" style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}>
            <div style={{ width: DESIGN_W, height: DESIGN_H, position: 'absolute', top: 0, left: 0, transformOrigin: 'top left', transform: `scale(${faceScale})` }}>
              <div style={{ position: 'absolute', top: 20, left: 24 }}>
                <RampLogo height={16} color={textColor} />
              </div>
              <div style={{ position: 'absolute', top: 18, right: 22, fontWeight: 900, fontSize: 20, letterSpacing: '0.05em', fontStyle: 'italic' }}>
                VISA
              </div>
              <div style={{
                position: 'absolute', top: 68, left: 24, width: 40, height: 30,
                borderRadius: 5,
                background: 'linear-gradient(135deg, #a67818 0%, #f4d87a 22%, #d4a43c 46%, #b88522 62%, #f7dd82 82%, #a67818 100%)',
                boxShadow: 'inset 0 0 0 0.5px rgba(90,60,0,0.6), 0 1px 2px rgba(0,0,0,0.25)',
                overflow: 'hidden',
              }}>
                {/* Inner contact-pad plate */}
                <div style={{
                  position: 'absolute', inset: 2,
                  borderRadius: 2,
                  background: 'linear-gradient(140deg, #c7982e 0%, #f0d06a 25%, #b6831e 50%, #e8c25a 75%, #9c7214 100%)',
                  boxShadow: 'inset 0 0 0 0.5px rgba(60,40,0,0.4)',
                }}>
                  {/* Horizontal dividers */}
                  <div style={{ position: 'absolute', left: 2, right: 2, top: '33%', height: 0.75, background: 'rgba(70,45,0,0.55)' }} />
                  <div style={{ position: 'absolute', left: 2, right: 2, top: '66%', height: 0.75, background: 'rgba(70,45,0,0.55)' }} />
                  {/* Vertical divider */}
                  <div style={{ position: 'absolute', top: 2, bottom: 2, left: '50%', width: 0.75, background: 'rgba(70,45,0,0.55)' }} />
                  {/* Subtle top highlight */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(180deg, rgba(255,240,180,0.35) 0%, transparent 45%)',
                    pointerEvents: 'none',
                  }} />
                </div>
              </div>
              <div style={{
                position: 'absolute', bottom: 48, left: 24, fontSize: 14,
                letterSpacing: '0.12em', fontWeight: 500, opacity: 0.85,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontVariantNumeric: 'tabular-nums',
              }}>
                4111 1111 1111 1234
              </div>
              <div style={{ position: 'absolute', bottom: 20, left: 24, fontSize: 11, letterSpacing: '0.05em', opacity: 0.7, fontWeight: 500 }}>
                {(cardName || 'CHARLES SHIN').toUpperCase()}
              </div>
              <div style={{
                position: 'absolute', bottom: 20, right: 22, fontSize: 11, letterSpacing: '0.05em', opacity: 0.7, fontWeight: 500,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                fontVariantNumeric: 'tabular-nums',
              }}>
                12/28
              </div>
            </div>
          </div>

          {/* Back face */}
          <div className="card-face-back" style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}>
            <div style={{ width: DESIGN_W, height: DESIGN_H, position: 'absolute', top: 0, left: 0, transformOrigin: 'top left', transform: `scale(${faceScale})` }}>
              {/* Magnetic stripe */}
              <div style={{ position: 'absolute', top: 24, left: 0, right: 0, height: 36, background: stripeBg }} />
              {/* Signature panel — taller so cursive ascenders/descenders don't clip */}
              <div style={{
                position: 'absolute', top: 82, left: 20, right: 72, height: 36, borderRadius: 3,
                background: 'rgba(255,255,255,0.92)',
                display: 'flex', alignItems: 'center', padding: '0 10px',
              }}>
                <AnimatedSignature
                  text={cardName || 'Charles Shin'}
                  replayKey={flipVersion + fontVersion * 1000}
                  fontPath={fontDef.file}
                  height={34}
                  fontSize={20}
                  delaySeconds={0.1}
                  durationSeconds={1.0}
                />
              </div>
              {/* CVV */}
              <div style={{
                position: 'absolute', top: 88, right: 20, width: 46, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 13, fontWeight: 600, color: textColor, letterSpacing: '0.06em', opacity: 0.88,
              }}>
                123
              </div>
              {/* Ramp footer */}
              <div style={{ position: 'absolute', bottom: 16, left: 24, right: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <RampLogo height={12} color={textColor} opacity={0.7} />
                <div style={{
                  fontSize: 8, opacity: 0.55, letterSpacing: '0.04em',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}>
                  +1 (888) 555-0199
                </div>
              </div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  )
}
