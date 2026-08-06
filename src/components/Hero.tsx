import { useEffect, useState } from 'react'
import Fluid from './Fluid'
import { useMagnetic, usePrefersReducedMotion } from '../hooks'
import type { Copy } from '../copy'

export default function Hero({ copy }: { copy: Copy }) {
  const reduced = usePrefersReducedMotion()
  const [offset, setOffset] = useState(0)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (reduced) return
    let frame = 0
    const tick = () => {
      frame = 0
      setOffset(Math.min(window.scrollY, 900) * 0.14)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [reduced])

  // The call to action drifts toward the pointer before it is even clicked.
  const cta = useMagnetic<HTMLAnchorElement>(12, reduced)

  const lift = (delay: number) => ({
    opacity: entered ? 1 : 0,
    transform: entered ? 'translate3d(0,0,0)' : 'translate3d(0,22px,0)',
    transition: `opacity 700ms var(--ease-calm) ${delay}ms, transform 700ms var(--ease-calm) ${delay}ms`,
  })

  return (
    <section id="top" className="relative isolate min-h-[100svh] overflow-hidden bg-water">
      <div
        className="pointer-events-none absolute inset-x-0 -top-[8%] h-[116%]"
        style={{
          transform: `translate3d(0, ${offset}px, 0)`,
          // Promote once, up front. Without it the browser re-rasterises the
          // blend-and-filter stack underneath on every parallax frame, which
          // reads as flickering as soon as you start scrolling.
          willChange: 'transform',
        }}
      >
        <Fluid field="#0a1c4a" drop="#000205" density={3.2} repel={170} className="h-full w-full" />
      </div>

      <div className="pointer-events-none relative mx-auto grid min-h-[100svh] max-w-[1180px] grid-cols-1 items-center px-6 pt-28 pb-24 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-8 xl:col-span-7">
          <p
            className="mb-7 text-[12px] font-medium tracking-[0.22em] text-mute uppercase"
            style={lift(60)}
          >
            Caspian Sea · 2026
          </p>
          {/* The headline resolves a word at a time. Each word rides in a
              clipping box, so it rises out of the line rather than fading in. */}
          <h1 className="max-w-[15ch] text-[clamp(2.75rem,8vw,5rem)] leading-[1.04] font-medium tracking-[-0.035em] text-ink text-balance">
            {copy.hero.title.split(' ').map((word, i) => (
              <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <span
                  className="inline-block"
                  style={{
                    transform: entered ? 'translate3d(0,0,0)' : 'translate3d(0,105%,0)',
                    transition: `transform 900ms var(--ease-calm) ${140 + i * 85}ms`,
                  }}
                >
                  {word}
                </span>
                {'\u00A0'}
              </span>
            ))}
          </h1>
          <p
            className="mt-8 max-w-[46ch] text-[clamp(1rem,1.5vw,1.185rem)] leading-[1.65] text-mute"
            style={lift(240)}
          >
            {copy.hero.lede}
          </p>

          <div className="pointer-events-auto mt-11 flex" style={lift(340)}>
            <a
              href="#how"
              {...cta}
              className="group inline-flex items-center gap-3 rounded-full bg-ink px-8 py-4 text-[14.5px] font-medium text-oil transition-transform duration-500 ease-[var(--ease-calm)] active:scale-[0.99]"
            >
              {copy.hero.cta}
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
                className="transition-transform duration-500 ease-[var(--ease-calm)] group-hover:translate-y-0.5"
              >
                <path
                  d="M7 2.6v8.8M3.3 7.9 7 11.6l3.7-3.7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center"
        style={lift(560)}
      >
        <span className="text-[11px] tracking-[0.2em] text-mute/55 uppercase">
          {copy.hero.scroll}
        </span>
      </div>
    </section>
  )
}
