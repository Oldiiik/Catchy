import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox } from '@react-three/drei'
import type { Group } from 'three'
import { usePrefersReducedMotion } from '../hooks'

const BLUE = '#1c3f8c'
const DARK = '#050d22'
const GLASS = '#081a3d'

/**
 * The clip: one elongated square prism, no side arms. Edges stay sharp but
 * carry a 12-thousandth chamfer, which is what lets them catch a highlight —
 * a perfectly mathematical edge is the thing that reads as fake.
 */
function ClipBody({ animate }: { animate: boolean }) {
  const group = useRef<Group>(null)
  const lean = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return

    const l = lean.current
    const k = Math.min(1, delta * 4)
    l.x += (state.pointer.x - l.x) * k
    l.y += (state.pointer.y - l.y) * k

    if (animate) {
      const t = state.clock.elapsedTime
      g.position.y = Math.sin(t * 0.7) * 0.06
      g.rotation.z = Math.sin(t * 0.45) * 0.03 + l.x * 0.3
      g.rotation.x = Math.sin(t * 0.55) * 0.035 - l.y * 0.35
    } else {
      g.rotation.z = l.x * 0.3
      g.rotation.x = -l.y * 0.35
    }
  })

  const metal = { metalness: 0.92, roughness: 0.29, envMapIntensity: 1.15 }

  return (
    <group ref={group} rotation={[0, -0.42, 0]}>
      {/* Body */}
      <RoundedBox args={[1, 2.7, 0.42]} radius={0.012} smoothness={2} creaseAngle={0.9}>
        <meshPhysicalMaterial color={BLUE} {...metal} clearcoat={0.5} clearcoatRoughness={0.35} />
      </RoundedBox>

      {/* Machined bezel around the optical window */}
      <RoundedBox args={[0.6, 0.6, 0.03]} radius={0.008} smoothness={2} position={[0, 0.78, 0.207]}>
        <meshPhysicalMaterial color={BLUE} metalness={0.95} roughness={0.2} />
      </RoundedBox>
      {/* Recessed window, then the glass over it */}
      <mesh position={[0, 0.78, 0.213]}>
        <boxGeometry args={[0.48, 0.48, 0.02]} />
        <meshStandardMaterial color={DARK} metalness={0.3} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.78, 0.226]}>
        <boxGeometry args={[0.48, 0.48, 0.012]} />
        <meshPhysicalMaterial
          color={GLASS}
          metalness={0}
          roughness={0.06}
          transmission={0.55}
          thickness={0.4}
          ior={1.46}
        />
      </mesh>

      {/* Sensor grille — cut in, not stuck on */}
      {[-0.17, 0, 0.17].map((x) => (
        <mesh key={x} position={[x, -0.3, 0.203]}>
          <boxGeometry args={[0.05, 0.66, 0.02]} />
          <meshStandardMaterial color={DARK} metalness={0.6} roughness={0.9} />
        </mesh>
      ))}

      {/* Status pin */}
      <mesh position={[0, -0.92, 0.208]}>
        <boxGeometry args={[0.07, 0.07, 0.014]} />
        <meshStandardMaterial color="#e4ecf8" metalness={0.1} roughness={0.3} />
      </mesh>

      {/* Mounting pad on the back, in place of the old side arms */}
      <RoundedBox
        args={[0.66, 1.5, 0.09]}
        radius={0.01}
        smoothness={2}
        position={[0, -0.2, -0.245]}
      >
        <meshPhysicalMaterial color={DARK} metalness={0.55} roughness={0.62} />
      </RoundedBox>
      {[0.32, -0.72].map((y) => (
        <mesh key={y} position={[0, y, -0.295]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.02, 24]} />
          <meshStandardMaterial color={BLUE} metalness={0.95} roughness={0.25} />
        </mesh>
      ))}

      {/* Top seam */}
      <mesh position={[0, 1.16, 0]}>
        <boxGeometry args={[1.004, 0.012, 0.424]} />
        <meshStandardMaterial color={DARK} metalness={0.4} roughness={0.8} />
      </mesh>
    </group>
  )
}

export default function Clip3D() {
  const reduced = usePrefersReducedMotion()

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.1, 6.2], fov: 34 }}
      // preserveDrawingBuffer lets the preview harness read the canvas back
      // instead of timing out on an already-swapped buffer.
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      className="cursor-grab touch-none active:cursor-grabbing"
    >
      <ambientLight intensity={0.22} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} />
      <directionalLight position={[-4, -1, -3]} intensity={0.45} color="#3c62ad" />

      <Suspense fallback={null}>
        <ClipBody animate={!reduced} />

        {/* Studio built from emissive panels — the reflections are what sell
            the metal, and this needs no HDR download. */}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={5} position={[-3, 2, 3]} scale={[6, 8, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={2.4} position={[3.5, 0, 2]} scale={[3, 6, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={1.6} position={[0, -3, 1]} scale={[6, 3, 1]} target={[0, 0, 0]} />
          <Lightformer
            form="rect"
            intensity={3}
            color="#9db8e8"
            position={[0, 3.5, -3]}
            scale={[8, 3, 1]}
            target={[0, 0, 0]}
          />
        </Environment>

        <ContactShadows
          position={[0, -1.72, 0]}
          opacity={0.55}
          scale={7}
          blur={2.8}
          far={3.2}
          resolution={512}
          color="#000000"
        />
      </Suspense>

      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.7}
        autoRotate={!reduced}
        autoRotateSpeed={0.7}
      />
    </Canvas>
  )
}
