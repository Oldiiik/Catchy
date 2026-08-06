import { memo, useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../hooks'

type Blob = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  base: number
  phase: number
  life: number
}

type FluidProps = {
  /** Colour of the surrounding body of fluid. */
  field: string
  /** Colour of the droplets suspended in it. */
  drop: string
  /** Droplets per 100k px² of surface. */
  density?: number
  /** How hard the pointer pushes the droplets apart. */
  repel?: number
  className?: string
}

/**
 * Immiscible fluid. Droplets drift, merge and part with hard edges — no
 * haloes, no gradients. The threshold is done in luminance (black droplets on
 * white, blurred then crushed by contrast), then two blend passes recolour the
 * result into exactly two flat tones.
 */
function Fluid({ field, drop, density = 3.4, repel = 150, className = '' }: FluidProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    // One canvas pixel per device pixel, so the bitmap is never upscaled before
    // the threshold runs. This was a flat 0.5 in CSS pixels — a quarter of a
    // retina panel's resolution — and a hard threshold does not forgive a
    // stretched source: it sharpens the stair-steps instead of hiding them.
    const SCALE = Math.min(window.devicePixelRatio || 1, 2)
    const BLEED = 90

    let w = 0
    let h = 0
    let prevW = 0
    let prevH = 0
    let blobs: Blob[] = []
    let frame = 0
    let onScreen = true
    const pointer = { x: -9999, y: -9999, active: false }
    const start = performance.now()

    const spawn = (x: number, y: number, r: number): Blob => ({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.16,
      vy: -0.04 - Math.random() * 0.12,
      r,
      base: r,
      phase: Math.random() * Math.PI * 2,
      life: 1,
    })

    /**
     * Re-fit the surface without emptying it. A resize used to re-randomise
     * every droplet, so on a phone the fluid visibly teleported the moment the
     * URL bar slid away and changed the viewport height. Existing droplets are
     * carried across at their relative positions and the population is only
     * topped up or trimmed to match the new area.
     */
    const resize = () => {
      const rect = host.getBoundingClientRect()
      const nextW = rect.width + BLEED * 2
      const nextH = rect.height + BLEED * 2

      // Sub-pixel jitter from the observer is not a resize.
      if (Math.abs(nextW - prevW) < 1 && Math.abs(nextH - prevH) < 1) return

      const first = prevW === 0 || prevH === 0
      if (!first) {
        const sx = nextW / prevW
        const sy = nextH / prevH
        for (const b of blobs) {
          b.x *= sx
          b.y *= sy
        }
      }

      w = nextW
      h = nextH
      prevW = nextW
      prevH = nextH
      canvas.width = Math.max(1, Math.round(w * SCALE))
      canvas.height = Math.max(1, Math.round(h * SCALE))
      ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)

      const area = (rect.width * rect.height) / 100000
      const count = Math.round(Math.min(26, Math.max(6, area * density)))
      while (blobs.length > count) blobs.pop()
      while (blobs.length < count) {
        const b = spawn(
          BLEED + Math.random() * rect.width,
          BLEED + Math.random() * rect.height,
          26 + Math.random() * 58,
        )
        // New arrivals grow in rather than popping into existence.
        if (!first) b.life = 0.1
        blobs.push(b)
      }

      // Setting canvas.width cleared the bitmap; with motion off nothing will
      // redraw it on its own.
      if (reduced) draw(performance.now())
    }

    const draw = (now: number) => {
      const t = (now - start) / 1000

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#000000'

      for (let i = blobs.length - 1; i >= 0; i--) {
        const b = blobs[i]

        // Slow convection.
        b.x += b.vx + Math.sin(t * 0.16 + b.phase) * 0.22
        b.y += b.vy + Math.cos(t * 0.13 + b.phase * 1.7) * 0.14

        // Oil parts around anything that touches the surface.
        if (pointer.active) {
          const dx = b.x - pointer.x
          const dy = b.y - pointer.y
          const d = Math.hypot(dx, dy) || 1
          if (d < repel + b.r) {
            const force = (1 - d / (repel + b.r)) ** 2 * 1.9
            b.vx += (dx / d) * force * 0.14
            b.vy += (dy / d) * force * 0.14
          }
        }

        b.vx *= 0.965
        b.vy *= 0.965

        // Wrap, so the body of fluid never runs out.
        if (b.y < -b.r) b.y = h + b.r
        if (b.y > h + b.r) b.y = -b.r
        if (b.x < -b.r) b.x = w + b.r
        if (b.x > w + b.r) b.x = -b.r

        if (b.life < 1) {
          b.life = Math.min(1, b.life + 0.02)
        }

        const breathe = 1 + Math.sin(t * 0.42 + b.phase) * 0.07
        const r = b.base * breathe * b.life
        ctx.beginPath()
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      frame = onScreen && !reduced ? requestAnimationFrame(draw) : 0
    }

    const toLocal = (clientX: number, clientY: number) => {
      const rect = host.getBoundingClientRect()
      pointer.x = clientX - rect.left + BLEED
      pointer.y = clientY - rect.top + BLEED
    }

    const onMove = (e: PointerEvent) => {
      toLocal(e.clientX, e.clientY)
      pointer.active = true
    }
    const onLeave = () => {
      pointer.active = false
      pointer.x = -9999
      pointer.y = -9999
    }
    const onDown = (e: PointerEvent) => {
      toLocal(e.clientX, e.clientY)
      if (blobs.length < 34) {
        const d = spawn(pointer.x, pointer.y, 22 + Math.random() * 26)
        d.life = 0.1
        blobs.push(d)
      }
    }

    const visibility = new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting
      if (onScreen && !frame && !reduced) frame = requestAnimationFrame(draw)
    })
    visibility.observe(host)

    const ro = new ResizeObserver(resize)
    ro.observe(host)
    resize()

    if (reduced) {
      draw(performance.now())
    } else {
      frame = requestAnimationFrame(draw)
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('pointerdown', onDown, { passive: true })
      window.addEventListener('pointerleave', onLeave)
    }

    return () => {
      visibility.disconnect()
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerleave', onLeave)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [reduced, density, repel])

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={`relative isolate overflow-hidden ${className}`}
      style={{ backgroundColor: field }}
    >
      {/* multiply crushes the thresholded mask to pure black droplets */}
      <canvas
        ref={canvasRef}
        className="fluid-threshold absolute -inset-[90px] h-[calc(100%+180px)] w-[calc(100%+180px)]"
        style={{ mixBlendMode: 'multiply' }}
      />
      {/* lighten raises that black to the droplet colour, field untouched */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: drop, mixBlendMode: 'lighten' }}
      />
    </div>
  )
}

export default memo(Fluid)
