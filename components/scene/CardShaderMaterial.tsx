import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

const vertSrc = /* glsl */`
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  // World-space normal so fragment shader viewDir calc is in the same space
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragSrc = /* glsl */`
uniform float uTime;
uniform vec3  uBaseColor;
uniform vec3  uBaseColor2;
uniform float uHoloIntensity;
uniform float uNoiseIntensity;
uniform float uGlowIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

// 2D simplex noise
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

  // Base gradient top→bottom
  vec3 base = mix(uBaseColor, uBaseColor2, vUv.y);

  // Holographic iridescence
  float holoNoise = snoise(vUv * 3.0 + uTime * 0.15) * 0.5 + 0.5;
  float holoAngle = nDotV + uTime * 0.25;
  vec3 rainbow = holo(holoAngle * 0.6 + holoNoise * 0.4);
  base = mix(base, rainbow, uHoloIntensity * (0.3 + holoNoise * 0.7));

  // Surface grain
  float grain = snoise(vUv * 80.0 + uTime * 0.05);
  base += grain * uNoiseIntensity * 0.06;

  // Fresnel edge glow
  base += fresnel * uGlowIntensity * 0.5;

  // Specular
  vec3 lightDir = normalize(vec3(2.0, 3.0, 4.0));
  float spec = pow(max(dot(reflect(-lightDir, n), viewDir), 0.0), 48.0);
  base += spec * 0.4;

  gl_FragColor = vec4(clamp(base, 0.0, 1.0), 1.0);
}
`

export const CardMaterial = shaderMaterial(
  {
    uTime: 0,
    uBaseColor: new THREE.Color('#f5f4f0'),
    uBaseColor2: new THREE.Color('#e8e6e0'),
    uHoloIntensity: 0.6,
    uNoiseIntensity: 0.3,
    uGlowIntensity: 0.4,
  },
  vertSrc,
  fragSrc
)

extend({ CardMaterial })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      cardMaterial: any
    }
  }
}
