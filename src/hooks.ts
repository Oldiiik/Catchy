import { useEffect, useRef, useState, type RefObject } from 'react'
import type React from 'react'

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  return reduced
}

/** Reveals once, then stops observing — nothing re-animates on the way back up. */
export function useReveal<T extends HTMLElement>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, shown]
}

/**
 * A pull toward the cursor, applied straight to the node's transform so it
 * tracks the pointer without a render per frame. Returns handlers to spread.
 */
export function useMagnetic<T extends HTMLElement>(strength = 12, reduced = false) {
  const ref = useRef<T>(null)

  const onPointerMove = (e: React.PointerEvent<T>) => {
    const node = ref.current
    if (reduced || !node) return
    const r = node.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height
    node.style.transform = `translate3d(${dx * strength}px, ${dy * strength * 0.5}px, 0) scale(1.03)`
  }

  const onPointerLeave = () => {
    if (ref.current) ref.current.style.transform = ''
  }

  return { ref, onPointerMove, onPointerLeave }
}

/** How far down the document we are, 0 to 1. rAF-gated. */
export function usePageProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const span = document.documentElement.scrollHeight - window.innerHeight
      setProgress(span > 0 ? Math.min(1, Math.max(0, window.scrollY / span)) : 0)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    measure()
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return progress
}

/**
 * Which of the given section ids currently owns the viewport. Returns an index
 * into `ids`, or -1 while the hero is still in charge.
 */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const nodes = ids
      .map((id, i) => ({ node: document.getElementById(id), i }))
      .filter((e): e is { node: HTMLElement; i: number } => Boolean(e.node))
    if (!nodes.length) return

    // A band across the upper third: the section crossing it is the one being
    // read, which tracks far more calmly than "whatever is most visible".
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .map((e) => nodes.find((n) => n.node === e.target)?.i ?? -1)
        if (hit.length) setActive(Math.min(...hit))
      },
      { rootMargin: '-18% 0px -72% 0px' },
    )
    nodes.forEach(({ node }) => observer.observe(node))
    return () => observer.disconnect()
  }, [ids])

  return active
}

/**
 * 0 when the element's top hits the bottom of the viewport, 1 when its bottom
 * leaves the top. Sampled on a rAF tick and only while the element is on screen.
 */
export function useScrollProgress<T extends HTMLElement>(enabled = true): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node || !enabled) return

    let frame = 0
    let visible = false

    const measure = () => {
      frame = 0
      const rect = node.getBoundingClientRect()
      const span = window.innerHeight + rect.height
      const raw = (window.innerHeight - rect.top) / span
      setProgress(Math.min(1, Math.max(0, raw)))
    }

    const schedule = () => {
      if (frame || !visible) return
      frame = requestAnimationFrame(measure)
    }

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
      if (visible) schedule()
    })
    observer.observe(node)

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    measure()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [enabled])

  return [ref, progress]
}
