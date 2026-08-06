import { useCallback, useEffect, useRef, useState } from 'react'
import { createSim, spill, step, type Sim } from './fleet'

/** Simulated minutes per real second at each speed setting. */
export const SPEEDS = [1, 10, 60]

/** How often the world advances. Slow enough to be cheap, fast enough to flow. */
const TICK_MS = 500

/**
 * Runs the fleet. Playback is decoupled from render: the clock advances on an
 * interval and React sees whole new states, so pausing genuinely stops time
 * rather than freezing an animation over data that kept moving.
 */
export function useSim() {
  const [sim, setSim] = useState<Sim>(createSim)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const speedRef = useRef(speed)
  speedRef.current = speed

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setSim((s) => step(s, (SPEEDS[speedRef.current] * TICK_MS) / 1000))
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [playing])

  const inject = useCallback(() => setSim((s) => spill(s)), [])
  const reset = useCallback(() => setSim(createSim()), [])

  return { sim, playing, setPlaying, speed, setSpeed, inject, reset }
}
