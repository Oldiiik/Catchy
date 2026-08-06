import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ── The sea, modelled ────────────────────────────────────────────────────
   A real extruded solid, lit from a raking angle — but the camera looks
   straight down the extrusion axis under an orthographic lens, so it reads
   as a flat plan. The only thing the third dimension buys is the bevel:
   a coastline that catches light and turns from the water it encloses. */

/**
 * The Caspian shoreline, traced clockwise from the Volga delta: the broad
 * shallow north, the Mangyshlak peninsula pushing west, the Kara-Bogaz notch,
 * the Turkmen coast, the wide southern basin, Apsheron reaching east under
 * Baku, and the Dagestan coast back up to the delta.
 *
 * Longitude is scaled by cos(42°) so the plan is not stretched east to west.
 */
const SHORE: [number, number][] = [
  [47.5, 45.7], [48.2, 46.0], [49.2, 46.1], [50.4, 45.7], [51.6, 45.4],
  [52.5, 45.1], [53.2, 45.2], [52.4, 44.9], [51.4, 44.6], [52.1, 44.2],
  [52.9, 43.7], [53.3, 42.9], [53.5, 42.1], [53.7, 41.4], [54.4, 41.2],
  [54.3, 40.7], [53.7, 40.6], [53.5, 39.9], [53.7, 39.1], [53.8, 38.3],
  [53.2, 37.7], [52.5, 37.2], [51.5, 36.8], [50.4, 36.7], [49.5, 37.3],
  [49.2, 37.9], [48.9, 38.6], [48.6, 39.3], [49.1, 39.9], [49.7, 40.2],
  [50.4, 40.4], [49.7, 40.7], [49.1, 41.3], [48.8, 41.9], [48.3, 42.6],
  [47.8, 43.4], [47.5, 44.2], [47.2, 44.9], [46.9, 45.4],
]

const LON_SCALE = Math.cos((42 * Math.PI) / 180)

/**
 * Chaikin corner-cutting. Every new point is a weighted average of two
 * neighbours, so the curve stays inside the traced polygon — unlike a spline,
 * which overshoots at a sharp cape and folds the coastline through itself.
 */
function smooth(points: THREE.Vector2[], passes: number) {
  let ring = points
  for (let p = 0; p < passes; p++) {
    const next: THREE.Vector2[] = []
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
      next.push(
        new THREE.Vector2(a.x * 0.75 + b.x * 0.25, a.y * 0.75 + b.y * 0.25),
        new THREE.Vector2(a.x * 0.25 + b.x * 0.75, a.y * 0.25 + b.y * 0.75),
      )
    }
    ring = next
  }
  return ring
}

function useSeaGeometry() {
  return useMemo(() => {
    const traced = SHORE.map(([lon, lat]) => new THREE.Vector2(lon * LON_SCALE, lat))
    const shape = new THREE.Shape(smooth(traced, 3))

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.18,
      bevelSize: 0.13,
      bevelSegments: 3,
      curveSegments: 1,
    })

    // Normalise to a one-unit tall plan so the parent can scale it in pixels
    // while keeping the sea's real, distinctly vertical proportion.
    geometry.center()
    geometry.computeBoundingBox()
    const box = geometry.boundingBox as THREE.Box3
    const height = box.max.y - box.min.y
    geometry.scale(1 / height, 1 / height, 1 / height)
    geometry.computeVertexNormals()

    return { geometry, aspect: (box.max.x - box.min.x) / height }
  }, [])
}

function Sea({ reduced }: { reduced: boolean }) {
  const { geometry, aspect } = useSeaGeometry()
  const group = useRef<THREE.Group>(null)
  const key = useRef<THREE.DirectionalLight>(null)
  const size = useThree((s) => s.size)

  // One world unit is one pixel: fit the plan inside whatever box it is given.
  const scale = 0.94 * Math.min(size.width / aspect, size.height)

  useFrame((state) => {
    if (reduced) return
    const t = state.clock.elapsedTime

    // The light walks around the rim. Nothing else moves, so the coastline
    // appears to be lit by a slow sun rather than animated.
    key.current?.position.set(Math.cos(t * 0.22) * 4, 3 + Math.sin(t * 0.22) * 2, 6)

    // A degree or so of tilt, tied to the pointer. Enough to admit the solid
    // is a solid; not enough to break the plan reading.
    if (group.current) {
      group.current.rotation.y += (state.pointer.x * 0.09 - group.current.rotation.y) * 0.05
      group.current.rotation.x += (-state.pointer.y * 0.06 - group.current.rotation.x) * 0.05
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} color="#3d5a99" />
      <directionalLight ref={key} position={[-4, 5, 6]} intensity={2.2} color="#cfdcf7" />
      {/* Fill from below-right keeps the far coast from going solid black. */}
      <directionalLight position={[5, -4, 2]} intensity={0.5} color="#1c3f8c" />

      <group ref={group} scale={scale}>
        <mesh geometry={geometry}>
          <meshStandardMaterial color="#0a1c4a" roughness={0.62} metalness={0.15} />
        </mesh>
      </group>
    </>
  )
}

export default function CaspianSea3D({ reduced = false }: { reduced?: boolean }) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 500], zoom: 1, near: 1, far: 2000 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      className="h-full w-full"
    >
      <Sea reduced={reduced} />
    </Canvas>
  )
}
