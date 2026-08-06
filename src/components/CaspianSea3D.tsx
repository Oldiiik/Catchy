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
  // North shelf, west to east: the Volga delta across to the Ural mouth.
  [47.4, 45.6], [47.9, 46.2], [48.6, 46.7], [49.6, 46.6], [50.6, 46.5],
  [51.7, 46.5], [52.6, 46.2], [53.2, 45.8],
  // Buzachi, Komsomolets bay, and the Tyub-Karagan cape reaching west.
  [52.7, 45.3], [52.0, 45.4], [51.4, 45.2], [51.6, 44.8], [52.1, 44.7],
  [51.3, 44.5], [50.9, 44.3],
  // The Mangystau coast running south past Aktau to Kara-Bogaz-Gol.
  [51.0, 43.9], [51.1, 43.5], [51.4, 43.0], [51.9, 42.5], [52.4, 42.0],
  [52.8, 41.5], [53.1, 41.2], [53.6, 41.3], [53.6, 40.9], [53.1, 40.9],
  // Turkmen coast down to the south-east corner.
  [53.0, 40.4], [53.4, 39.8], [53.8, 39.2], [54.0, 38.5], [53.9, 37.8],
  [53.5, 37.2],
  // The Iranian shore, east to west.
  [52.8, 36.9], [52.0, 36.7], [51.2, 36.6], [50.3, 36.7], [49.6, 37.1],
  [49.2, 37.6],
  // Up the Azerbaijani coast, over the Apsheron peninsula east of Baku.
  [48.9, 38.3], [48.9, 38.9], [49.2, 39.4], [49.4, 39.9], [49.9, 40.3],
  [50.4, 40.4], [49.8, 40.6], [49.3, 41.0], [48.9, 41.5],
  // Dagestan, back north to the delta.
  [48.4, 42.1], [47.9, 42.7], [47.5, 43.2], [47.3, 43.9], [47.2, 44.6],
  [47.3, 45.1],
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
    // Two passes: enough to lose the sampling, not so much that the bays and
    // the Apsheron cape get rounded off into a blob.
    const shape = new THREE.Shape(smooth(traced, 2))

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
