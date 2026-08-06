import { useState } from 'react'
import Model from './Model'
import Reveal from './Reveal'
import { Eyebrow, SHELL, Stat } from './ui'
import { usePrefersReducedMotion, useScrollProgress } from '../hooks'
import { lazyRetry } from '../lazyRetry'
import type { Copy } from '../copy'

// three.js arrives with the section, not with the page.
const CaspianSea3D = lazyRetry(() => import('./CaspianSea3D'))

/* ── 01. Why it matters ───────────────────────────────────────────────────
   The figures hang off a schematic of the sea rather than sitting in a row
   of cards, so each number reads as a property of a place. */

/**
 * The plate: a modelled sea under a flat, straight-down orthographic view,
 * with the survey annotations laid over it as ordinary elements. The falling
 * water level is drawn where it actually falls — across the north shelf.
 */
function CaspianPlate({ reduced }: { reduced: boolean }) {
  return (
    <div className="relative h-full w-full">
      <Model fallback={<div className="h-full w-full" aria-hidden="true" />}>
        <CaspianSea3D reduced={reduced} />
      </Model>

      {/* Level datum, drawn across the north shelf where the water is going:
          dashed is 2005, solid is today, dimensioned between the two. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[30%] top-[10%] flex flex-col gap-[7px]"
      >
        <span className="block h-px border-t border-dashed border-ink/45" />
        <span className="block h-px bg-ink/45" />
      </div>
      <span className="sr-only">
        Plan of the Caspian Sea, with the 2005 and present water levels marked
      </span>
    </div>
  )
}

export function Significance({ copy }: { copy: Copy }) {
  const { significance: s } = copy
  const reduced = usePrefersReducedMotion()
  // The plate drifts against the column of figures beside it, so the two read
  // as separate planes rather than one flat block scrolling past.
  const [plateRef, plateProgress] = useScrollProgress<HTMLDivElement>(!reduced)

  return (
    <section id="why" className="scroll-mt-20 py-24 md:py-32">
      <div className={SHELL}>
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <Eyebrow index="01">{s.eyebrow}</Eyebrow>
              <h2 className="mt-8 max-w-[11ch] text-[clamp(2.4rem,6.2vw,4.5rem)] leading-[1.02] font-medium tracking-[-0.04em] text-ink text-balance">
                {s.title}
              </h2>
            </Reveal>
          </div>

          <div className="space-y-7 lg:col-span-5 lg:col-start-8 lg:pt-4">
            {s.body.map((para, i) => (
              <Reveal key={para.slice(0, 24)} delay={i * 120}>
                <p className="max-w-[46ch] text-[15.5px] leading-[1.75] text-mute">{para}</p>
              </Reveal>
            ))}
          </div>
        </div>

        {/* The plate sits beside its figures, both centred on the same axis, so
            neither is stranded in empty column. */}
        <div className="mt-16 grid items-center gap-10 md:mt-24 lg:grid-cols-12 lg:gap-14">
          <Reveal className="mx-auto h-[300px] w-full max-w-[200px] lg:col-span-4 lg:mx-0 lg:h-[420px] lg:max-w-none">
            <div
              ref={plateRef}
              className="h-full w-full"
              style={{ transform: `translate3d(0, ${(0.5 - plateProgress) * 40}px, 0)` }}
            >
              <CaspianPlate reduced={reduced} />
            </div>
          </Reveal>

          <ul className="grid gap-4 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-1 lg:gap-5">
            {s.figures.map((f, i) => (
              <Reveal key={f.label} as="li" delay={180 + i * 120}>
                <Stat value={f.value} unit={f.unit} label={f.label} size="lg" />
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ── 03. What it measures ─────────────────────────────────────────────────
   An instrument rather than a table: choosing a channel on the right drives
   a single large readout on the left. */

export function Traces({ copy }: { copy: Copy }) {
  const [active, setActive] = useState(0)
  const { traces: t } = copy
  const channel = t.items[active]

  return (
    <section className="bg-abyss py-24 md:py-32">
      <div className={`${SHELL} grid gap-16 lg:grid-cols-12 lg:gap-10`}>
        <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <Eyebrow index="03">{t.eyebrow}</Eyebrow>
            <h2 className="mt-8 max-w-[14ch] text-[clamp(1.85rem,3.6vw,2.85rem)] leading-[1.12] font-medium tracking-[-0.03em] text-ink text-balance">
              {t.title}
            </h2>
            <p className="mt-7 max-w-[38ch] text-[15px] leading-[1.7] text-mute">{t.body}</p>
          </Reveal>

          {/* Keyed on the channel so the readout re-enters rather than mutating
              in place — the value should feel switched, not edited. */}
          <Reveal delay={140} className="mt-12">
            <div className="border-t border-ink/15 pt-8">
              <div key={channel.index} className="readout">
                <p className="flex items-baseline gap-3 text-[11px] tracking-[0.2em] text-mute uppercase">
                  <span className="text-ink tabular-nums">{channel.index}</span>
                  <span>{channel.name}</span>
                </p>
                <p className="mt-6 text-[clamp(2.6rem,6vw,4.2rem)] leading-none font-medium tracking-[-0.05em] text-ink tabular-nums">
                  {channel.value}
                  <span className="ml-3 align-baseline text-[0.26em] font-normal tracking-[0.04em] text-mute">
                    {channel.unit}
                  </span>
                </p>
                <p className="mt-7 max-w-[40ch] text-[14.5px] leading-[1.7] text-mute">
                  {channel.body}
                </p>
              </div>
            </div>
            <p className="mt-10 max-w-[34ch] border-t border-ink/10 pt-5 text-[12.5px] leading-[1.6] text-mute/70">
              {t.footnote}
            </p>
          </Reveal>
        </div>

        <div className="lg:col-span-6 lg:col-start-7 lg:pt-2">
          {t.items.map((item, i) => {
            const on = active === i
            return (
              <Reveal key={item.index} delay={Math.min(i, 3) * 90}>
                <button
                  type="button"
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-pressed={on}
                  className="flex w-full cursor-pointer items-center gap-5 border-b border-ink/10 py-6 text-left first:border-t"
                >
                  <span
                    className="text-[11px] tracking-[0.16em] tabular-nums transition-colors duration-500"
                    style={{ color: on ? '#EEF2FA' : 'rgba(126,145,184,0.55)' }}
                  >
                    {item.index}
                  </span>
                  <span
                    className="flex-1 text-[17px] leading-snug font-medium tracking-[-0.015em] transition-[color,transform] duration-500 ease-[var(--ease-calm)]"
                    style={{
                      color: on ? '#EEF2FA' : '#7E91B8',
                      transform: on ? 'translateX(6px)' : 'none',
                    }}
                  >
                    {item.name}
                  </span>
                  {/* Selection reads as a rule drawing back toward the readout. */}
                  <span
                    aria-hidden="true"
                    className="block h-px w-16 origin-right bg-ink transition-transform duration-500 ease-[var(--ease-calm)]"
                    style={{ transform: on ? 'scaleX(1)' : 'scaleX(0.08)' }}
                  />
                </button>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
