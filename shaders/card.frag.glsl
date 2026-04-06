uniform float uTime;
uniform vec3  uBaseColor;
uniform vec3  uBaseColor2;
uniform float uHoloIntensity;
uniform float uNoiseIntensity;
uniform float uGlowIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;

// --- Noise helpers ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0,i1.y,1.0)) + i.x + vec3(0.0,i1.x,1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// --- Holographic rainbow ---
vec3 holo(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.333, 0.667)));
}

void main() {
  // --- View direction ---
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);

  // --- Base gradient ---
  vec3 base = mix(uBaseColor, uBaseColor2, vUv.y);

  // --- Holographic layer ---
  float holoAngle = dot(vNormal, viewDir) + uTime * 0.2;
  float holoNoise = snoise(vUv * 3.0 + uTime * 0.15) * 0.5 + 0.5;
  vec3 rainbow = holo(holoAngle * 0.5 + holoNoise * 0.3);
  base = mix(base, rainbow, uHoloIntensity * (0.4 + holoNoise * 0.6));

  // --- Surface noise / grain ---
  float grain = snoise(vUv * 80.0 + uTime * 0.05);
  base += grain * uNoiseIntensity * 0.08;

  // --- Fresnel edge glow ---
  base += fresnel * uGlowIntensity * 0.6;

  // --- Specular highlight ---
  vec3 lightDir = normalize(vec3(1.0, 1.5, 2.0));
  float spec = pow(max(dot(reflect(-lightDir, vNormal), viewDir), 0.0), 32.0);
  base += spec * 0.3;

  gl_FragColor = vec4(base, 1.0);
}
