import { useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Group, Mesh } from 'three'

/** Screen-space position of a reading, written each frame by the map overlay. */
export type Projected = { x: number; y: number; on: boolean }

const STEEL = '#a8bde3'
const BLUE = '#244a9c'
const DEEP = '#0d2358'

/** Hydrocarbons, ppm, at the top of the column's range. */
const CEILING = 15
const MAX_COLUMN = 54

/**
 * A hull, seen from above. Pointed bow, square stern — enough silhouette to
 * read as a vessel at twelve pixels, and it can be turned to a real heading.
 */
function useHullGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 9.5)
    shape.quadraticCurveTo(4.6, 4.5, 4.4, -2)
    shape.lineTo(3.9, -6.8)
    shape.lineTo(-3.9, -6.8)
    shape.lineTo(-4.4, -2)
    shape.quadraticCurveTo(-4.6, 4.5, 0, 9.5)

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 3,
      bevelEnabled: true,
      bevelThickness: 0.8,
      bevelSize: 0.7,
      bevelSegments: 2,
    })
    geometry.computeVertexNormals()
    return geometry
  }, [])
}

type BuoyProps = {
  kind: 'clear' | 'sheen' | 'review'
  heading: number
  ppm: number
  index: number
  selected: boolean
  points: RefObject<Projected[]>
  reduced: boolean
}

/**
 * One reading, modelled as what it actually is: a boat on the water with a
 * measurement standing up out of it. The column's height is the hydrocarbon
 * level, so the map is also a bar chart — the tallest thing on screen is the
 * worst reading, before anyone has clicked a single marker.
 *
 * State is still shape, never a second hue: a clear vessel has a stub, a sheen
 * has a column and a collar, a review adds a ring that sweeps outward.
 */
function Buoy({ kind, heading, ppm, index, selected, points, reduced }: BuoyProps) {
  const hullGeometry = useHullGeometry()

  const group = useRef<Group>(null)
  const hull = useRef<Group>(null)
  const column = useRef<Mesh>(null)
  const cap = useRef<Group>(null)
  const sweep = useRef<Mesh>(null)
  const scale = useRef(0)
  const height = useRef(0)

  const { size } = useThree()
  const flagged = kind !== 'clear'

  // A floor, so a clean vessel still has a visible mark on the water.
  const target = 6 + Math.min(1, ppm / CEILING) * MAX_COLUMN

  useFrame((state, delta) => {
    const g = group.current
    const p = points.current?.[index]
    if (!g || !p) return

    // The overlay reports container pixels; the orthographic camera is set up
    // so one world unit is one pixel, with the origin at the centre.
    g.position.set(p.x - size.width / 2, size.height / 2 - p.y, 0)
    g.visible = p.on

    const ease = Math.min(1, delta * 7)
    scale.current += ((selected ? 1.3 : flagged ? 1 : 0.82) - scale.current) * ease
    g.scale.setScalar(scale.current)

    // The column grows into place rather than popping in at full height.
    height.current += (target - height.current) * Math.min(1, delta * 4)
    if (column.current) {
      column.current.scale.y = height.current
      column.current.position.y = height.current / 2
    }
    if (cap.current) cap.current.position.y = height.current

    if (reduced) return
    const t = state.clock.elapsedTime

    // The hull yaws a degree or two around its course, as a moored boat does.
    if (hull.current) {
      hull.current.rotation.z =
        (-heading * Math.PI) / 180 + Math.sin(t * 0.6 + index) * 0.045
    }
    if (cap.current) cap.current.rotation.y = t * (selected ? 1.1 : 0.4) + index

    // Only a reading that needs a person sweeps.
    if (sweep.current) {
      const phase = (t * 0.34 + index * 0.2) % 1
      sweep.current.scale.setScalar(0.6 + phase * 2.6)
      ;(sweep.current.material as THREE.Material & { opacity: number }).opacity =
        (1 - phase) * 0.45
    }
  })

  return (
    <group ref={group}>
      {/* Footprint on the water. Sits flat, so it reads as plan, not object. */}
      <mesh position={[0, 0, -1]}>
        <ringGeometry args={[selected ? 13 : 10.5, selected ? 14 : 11.2, 40]} />
        <meshBasicMaterial color={STEEL} transparent opacity={selected ? 0.55 : 0.22} />
      </mesh>

      {kind === 'review' && (
        <mesh ref={sweep} position={[0, 0, -1]}>
          <ringGeometry args={[10, 10.8, 40]} />
          <meshBasicMaterial color="#eef2fa" transparent opacity={0} />
        </mesh>
      )}

      {/* The vessel itself, turned to its course over ground. */}
      <group ref={hull}>
        <mesh geometry={hullGeometry}>
          <meshStandardMaterial
            color={flagged ? STEEL : BLUE}
            metalness={0.55}
            roughness={0.35}
            flatShading
          />
        </mesh>
      </group>

      {/* The reading, standing up out of the deck. Height is the value. */}
      <mesh ref={column} position={[0, 0, 5]}>
        <boxGeometry args={[flagged ? 2.6 : 1.8, 1, flagged ? 2.6 : 1.8]} />
        <meshStandardMaterial
          color={flagged ? STEEL : DEEP}
          emissive={STEEL}
          emissiveIntensity={selected ? 0.5 : flagged ? 0.25 : 0.08}
          metalness={0.4}
          roughness={0.45}
        />
      </mesh>

      {/* Cap: a faceted knob that turns, so the top of the column has a read. */}
      <group ref={cap} position={[0, 0, 5]}>
        <mesh>
          <octahedronGeometry args={[flagged ? 4.4 : 2.8, 0]} />
          <meshStandardMaterial
            color={STEEL}
            metalness={0.85}
            roughness={0.2}
            flatShading
          />
        </mesh>
        {/* A collar marks a reading that has crossed the threshold. */}
        {flagged && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[7, 0.55, 6, 32]} />
            <meshStandardMaterial color={STEEL} metalness={0.9} roughness={0.3} />
          </mesh>
        )}
      </group>
    </group>
  )
}

type Props = {
  readings: { kind: 'clear' | 'sheen' | 'review'; heading: number; ppm: string }[]
  points: RefObject<Projected[]>
  selected: number
  reduced: boolean
}

export default function MapMarkers3D({ readings, points, selected, reduced }: Props) {
  return (
    <Canvas
      // One world unit per pixel, so the overlay's projected coordinates can be
      // used directly and the markers never drift from the map beneath them.
      orthographic
      camera={{ position: [0, 0, 600], zoom: 1, near: 1, far: 2000 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      className="pointer-events-none absolute inset-0"
    >
      {/* Key from the upper left, matching the light on the sensor and the sea. */}
      <ambientLight intensity={0.65} color="#4a6bb0" />
      <directionalLight position={[-160, 260, 420]} intensity={2.4} color="#dfe8fb" />
      <directionalLight position={[220, -120, 200]} intensity={0.6} color="#2b4d9c" />

      {readings.map((r, i) => (
        <Buoy
          key={i}
          index={i}
          kind={r.kind}
          heading={r.heading}
          ppm={Number(r.ppm)}
          selected={i === selected}
          points={points}
          reduced={reduced}
        />
      ))}
    </Canvas>
  )
}
