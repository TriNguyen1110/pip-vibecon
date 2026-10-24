/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Mat, useToon } from './Mat'
import { useTheme } from './theme'

// Fuzzy-friend look (T4): velvet sheen everywhere + shell fur on the big body/head meshes.
// Shells are on only for the live stage and switch off on slow devices (see FurGovernor in Stage.jsx).
export const FurCtx = createContext({ shells: false })
const useShells = () => useContext(FurCtx).shells

const WHITE = new THREE.Color('#ffffff')

let noiseTex
function strandNoise() {
  if (!noiseTex) {
    const N = 64
    const data = new Uint8Array(N * N)
    for (let i = 0; i < data.length; i++) data[i] = Math.floor(Math.pow(Math.random(), 0.8) * 255)
    noiseTex = new THREE.DataTexture(data, N, N, THREE.RedFormat)
    noiseTex.wrapS = noiseTex.wrapT = THREE.RepeatWrapping
    noiseTex.magFilter = THREE.NearestFilter
    noiseTex.minFilter = THREE.NearestFilter
    noiseTex.generateMipmaps = false
    noiseTex.needsUpdate = true
  }
  return noiseTex
}

// Tiling normal map from smoothed noise: a soft strand texture for the velvet base.
let normalTex
function furNormal() {
  if (!normalTex) {
    const N = 128
    const h = new Float32Array(N * N)
    for (let i = 0; i < h.length; i++) h[i] = Math.random()
    const s = new Float32Array(N * N)
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        let acc = 0
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) acc += h[((y + dy + N) % N) * N + ((x + dx + N) % N)]
        s[y * N + x] = acc / 9
      }
    const data = new Uint8Array(N * N * 4)
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const dx = s[y * N + ((x + 1) % N)] - s[y * N + ((x - 1 + N) % N)]
        const dy = s[((y + 1) % N) * N + x] - s[((y - 1 + N) % N) * N + x]
        const v = new THREE.Vector3(-dx * 3, -dy * 3, 1).normalize()
        const i = (y * N + x) * 4
        data[i] = (v.x * 0.5 + 0.5) * 255
        data[i + 1] = (v.y * 0.5 + 0.5) * 255
        data[i + 2] = (v.z * 0.5 + 0.5) * 255
        data[i + 3] = 255
      }
    normalTex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat)
    normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping
    normalTex.repeat.set(5, 5)
    normalTex.magFilter = THREE.LinearFilter
    normalTex.minFilter = THREE.LinearMipmapLinearFilter
    normalTex.generateMipmaps = true
    normalTex.needsUpdate = true
  }
  return normalTex
}

const VERT = /* glsl */ `
  uniform float uLen;
  uniform float uLayers;
  uniform float uTime;
  uniform vec4 uBald0;
  uniform vec4 uBald1;
  varying vec2 vUv;
  varying float vLayer;
  varying vec3 vN;
  float bald(vec4 z, vec3 n) {
    if (z.w <= -1.0) return 1.0;
    return 1.0 - smoothstep(z.w - 0.12, z.w + 0.02, dot(n, normalize(z.xyz)));
  }
  void main() {
    float l = (float(gl_InstanceID) + 1.0) / uLayers;
    vLayer = l;
    vec3 n = normalize(normal);
    float len = uLen * bald(uBald0, n) * bald(uBald1, n);
    vec3 p = position + n * len * l;
    // gravity droop + a gentle breeze, stronger toward the tips
    p.y -= len * 0.35 * l * l;
    p.x += sin(uTime * 1.6 + position.y * 4.0) * len * 0.25 * l * l;
    vUv = uv;
    vN = normalize(normalMatrix * n);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`
const FRAG = /* glsl */ `
  uniform sampler2D uNoise;
  uniform vec3 uColor;
  uniform vec3 uTip;
  uniform vec2 uDensity;
  uniform float uLight;
  varying vec2 vUv;
  varying float vLayer;
  varying vec3 vN;
  void main() {
    float n = texture2D(uNoise, vUv * uDensity).r;
    if (n < 0.25 + vLayer * 0.7) discard;
    vec3 L = normalize(vec3(-0.45, 0.75, 0.55));
    float diff = 0.55 + 0.45 * max(dot(normalize(vN), L), 0.0);
    float rim = pow(1.0 - abs(normalize(vN).z), 2.0) * 0.22;
    vec3 col = mix(uColor * 0.78, uTip, vLayer * vLayer) * diff * uLight + uTip * rim * uLight;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

function FurShells({ color, len, density, layers, bald }) {
  const ref = useRef()
  const theme = useTheme()
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uLen: { value: len },
          uLayers: { value: layers },
          uTime: { value: 0 },
          uNoise: { value: strandNoise() },
          uColor: { value: new THREE.Color(color) },
          uTip: { value: new THREE.Color(color).lerp(WHITE, 0.22) },
          uDensity: { value: new THREE.Vector2(density[0], density[1]) },
          uLight: { value: 1 },
          uBald0: { value: new THREE.Vector4(0, 0, 1, -2) },
          uBald1: { value: new THREE.Vector4(0, 0, 1, -2) },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  useEffect(() => {
    const u = mat.uniforms
    u.uLen.value = len
    u.uColor.value.set(color)
    u.uTip.value.set(color).lerp(WHITE, 0.22)
    u.uDensity.value.set(density[0], density[1])
    u.uLight.value = theme.name === 'night' ? 0.72 : 1
    const zones = bald ?? []
    ;[u.uBald0, u.uBald1].forEach((z, i) => {
      const b = zones[i]
      if (b) z.value.set(b[0], b[1], b[2], b[3])
      else z.value.set(0, 0, 1, -2)
    })
  }, [mat, color, len, density, theme, bald])
  useLayoutEffect(() => {
    const holder = ref.current
    const parent = holder?.parent
    if (!parent?.geometry) return
    const inst = new THREE.InstancedMesh(parent.geometry, mat, layers)
    inst.frustumCulled = false
    inst.raycast = () => {}
    holder.add(inst)
    return () => {
      holder.remove(inst)
      inst.dispose()
    }
  }, [mat, layers])
  useEffect(() => () => mat.dispose(), [mat])
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime
  })
  return <group ref={ref} />
}

// Velvet material for fuzzy parts. `shells` adds real fluff (big meshes only). Doodle look falls back to toon.
// bald: up to two [x, y, z, cos] zones (object-space normal directions) kept fur-free, e.g. the face mask.
export function Fur({ color, shells = false, len = 0.045, density = [10, 6], layers = 10, bald, outline }) {
  const toon = useToon()
  const allowShells = useShells()
  const sheenColor = useMemo(() => new THREE.Color(color).lerp(WHITE, 0.35), [color])
  if (toon) return <Mat color={color} outline={outline} />
  return (
    <>
      <meshPhysicalMaterial
        color={color}
        roughness={0.9}
        metalness={0}
        sheen={1}
        sheenRoughness={0.8}
        sheenColor={sheenColor}
        normalMap={furNormal()}
        normalScale={[0.55, 0.55]}
      />
      {shells && allowShells && <FurShells color={color} len={len} density={density} layers={layers} bald={bald} />}
    </>
  )
}
