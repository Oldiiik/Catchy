import { lazy, Suspense, useCallback, useState } from 'react'
import Reveal from './Reveal'

// three.js is a third of the bundle — it arrives only when this section does.
const Clip3D = lazy(() => import('./Clip3D'))
import GoogleMap, { READINGS } from './GoogleMap'
import { ClipMark, LensMark, PinMark } from './Marks'
import { Eyebrow, Meter, SHELL, Stat, StateGlyph } from './ui'
import { useMagnetic, usePrefersReducedMotion } from '../hooks'
import type { Copy } from '../copy'

/* ── 2. Problem statement ─────────────────────────────────────────────── */

/**
 * 18 400 tonnes drawn as 184 hairlines of a hundred tonnes each. The quantity
 * is countable instead of merely stated, and the band dissolves toward the
 * right — the tonnage nobody is watching.
 */
const TICKS = Array.from({ length: 184 }, (_, i) => i)

export function Statistic({ copy }: { copy: Copy }) {
  return (
    <section className="overflow-hidden py-24 md:py-32">
      <div className={SHELL}>
        <Reveal className="max-w-[38ch]">
          <p className="text-[15.5px] leading-[1.65] text-mute">{copy.stat.label}</p>
        </Reveal>
      </div>

      <Reveal className="mt-12 md:mt-14">
        <div className="flex h-[clamp(6rem,14vw,10.5rem)] w-full items-end gap-px px-6 lg:px-10">
          {TICKS.map((i) => {
            const t = i / (TICKS.length - 1)
            return (
              <span
                key={i}
                className="tick block flex-1 bg-ink"
                style={{
                  // Taller and brighter at the left, guttering out to the right.
                  height: `${34 + Math.sin(i * 0.21) * 9 + (1 - t) * 55}%`,
                  opacity: 0.1 + (1 - t) ** 1.7 * 0.8,
                  transitionDelay: `${i * 5}ms`,
                }}
              />
            )
          })}
        </div>
      </Reveal>

      <div className={`${SHELL} mt-10 flex flex-wrap items-baseline justify-between gap-6`}>
        <Reveal delay={120}>
          <p className="text-[clamp(3.2rem,10vw,7.5rem)] leading-[0.82] font-medium tracking-[-0.055em] text-ink tabular-nums">
            {copy.stat.value}
            <span className="ml-4 align-baseline text-[0.2em] font-normal tracking-[0.04em] text-mute">
              {copy.stat.unit}
            </span>
          </p>
        </Reveal>
        <Reveal delay={220}>
          <p className="text-[12px] tracking-[0.16em] text-mute/70 uppercase tabular-nums">
            184 × 100
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ── 3. How it works ──────────────────────────────────────────────────── */

const MARKS = [ClipMark, LensMark, PinMark]

export function HowItWorks({ copy }: { copy: Copy }) {
  const [open, setOpen] = useState(0)

  return (
    <section id="how" className="scroll-mt-20 py-24 md:py-32">
      <div className={SHELL}>
        <Reveal className="max-w-[24ch]">
          <Eyebrow index="04">{copy.how.eyebrow}</Eyebrow>
          <h2 className="mt-5 text-[clamp(1.85rem,3.6vw,2.85rem)] leading-[1.15] font-medium tracking-[-0.028em] text-ink text-balance">
            {copy.how.title}
          </h2>
        </Reveal>

        <div className="mt-14">
          {copy.how.steps.map((step, i) => {
            const Mark = MARKS[i]
            const active = open === i
            return (
              <Reveal key={step.title} delay={i * 110}>
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  onFocus={() => setOpen(i)}
                  onPointerEnter={() => setOpen(i)}
                  aria-expanded={active}
                  className="group block w-full cursor-pointer border-t border-ink/10 py-10 text-left transition-colors duration-500 ease-[var(--ease-calm)] first:border-t-0 md:py-10"
                  style={{ paddingLeft: `calc(${i} * 3.5vw)` }}
                >
                  <div className="grid gap-6 md:grid-cols-12 md:items-start">
                    <div
                      className="transition-transform duration-700 ease-[var(--ease-calm)] md:col-span-2"
                      style={{
                        transform: active ? 'translateY(-2px)' : 'none',
                        opacity: active ? 1 : 0.55,
                      }}
                    >
                      <Mark />
                    </div>
                    <h3
                      className="text-[19px] leading-snug font-medium tracking-[-0.015em] transition-colors duration-500 md:col-span-4"
                      style={{ color: active ? '#EEF2FA' : '#7E91B8' }}
                    >
                      {step.title}
                    </h3>
                    <div className="md:col-span-6">
                      <p className="max-w-[52ch] text-[15px] leading-[1.7] text-mute">
                        {step.body}
                      </p>
                      <span
                        className="mt-6 block h-px origin-left bg-ink/30 transition-transform duration-700 ease-[var(--ease-calm)]"
                        style={{ transform: active ? 'scaleX(1)' : 'scaleX(0)' }}
                      />
                    </div>
                  </div>
                </button>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── 4. Product ───────────────────────────────────────────────────────── */

export function Product({ copy }: { copy: Copy }) {
  return (
    <section id="sensor" className="scroll-mt-20 py-24 md:py-32">
      <div className={`${SHELL} grid items-center gap-12 lg:grid-cols-12 lg:gap-14`}>
        <Reveal className="order-2 h-[380px] lg:order-1 lg:col-span-6 lg:h-[460px]">
          <Suspense fallback={<div className="h-full w-full" aria-hidden="true" />}>
            <Clip3D />
          </Suspense>
        </Reveal>

        <div className="order-1 lg:order-2 lg:col-span-5 lg:col-start-8">
          <Reveal>
            <Eyebrow index="05">{copy.product.eyebrow}</Eyebrow>
            <h2 className="mt-5 max-w-[18ch] text-[clamp(1.85rem,3.6vw,2.85rem)] leading-[1.14] font-medium tracking-[-0.028em] text-ink text-balance">
              {copy.product.title}
            </h2>
            <p className="mt-6 max-w-[44ch] text-[15.5px] leading-[1.7] text-mute">
              {copy.product.body}
            </p>
          </Reveal>

          {/* Two by two rather than four narrow columns: the Russian and
              Kazakh labels are two and three words long and were breaking
              across three lines in a quarter-width cell. */}
          <Reveal delay={80} className="mt-12">
            <ul className="grid grid-cols-2 gap-3.5">
              {copy.product.specs.map((s) => (
                <li key={s.label}>
                  <Stat value={s.value} label={s.label} />
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ── 5. Live map ──────────────────────────────────────────────────────── */

/** Each channel's operating range, so a reading can be shown against it. */
export type Channel = { key: 'film' | 'fluor' | 'turb' | 'temp'; unit: string; min?: number; max: number }

export const CHANNELS: Channel[] = [
  { key: 'film', unit: 'µm', max: 2.5 },
  { key: 'fluor', unit: 'rfu', max: 300 },
  { key: 'turb', unit: 'NTU', max: 60 },
  { key: 'temp', unit: '°C', min: 15, max: 30 },
]

export function MapPreview({ copy }: { copy: Copy }) {
  const [picked, setPicked] = useState(4)
  const active = READINGS[picked]
  const onSelect = useCallback((i: number) => setPicked(i), [])

  return (
    <section id="map" className="scroll-mt-20 bg-water py-24 md:py-32">
      <div className={SHELL}>
        <div className="grid gap-14 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-4">
            <Eyebrow index="06">{copy.map.eyebrow}</Eyebrow>
            <h2 className="mt-5 max-w-[16ch] text-[clamp(1.85rem,3.6vw,2.85rem)] leading-[1.14] font-medium tracking-[-0.028em] text-ink text-balance">
              {copy.map.title}
            </h2>
            <p className="mt-6 max-w-[36ch] text-[15.5px] leading-[1.7] text-mute">
              {copy.map.body}
            </p>

            {/* Vessel identity sits apart from its telemetry — the header of
                the record, not another cell in the grid. */}
            <div className="mt-12 border-t border-ink/15 pt-6">
              <p className="flex items-baseline justify-between gap-4">
                <span className="text-[19px] font-medium tracking-[-0.02em] text-ink">
                  {active.vessel}
                </span>
                <span className="text-[12px] text-mute tabular-nums">{active.time}</span>
              </p>
              <p className="mt-2 text-[12px] text-mute/70 tabular-nums">
                {copy.map.fields.coords} {active.lat.toFixed(4)}° N {active.lng.toFixed(4)}° E ·{' '}
                {copy.map.fields.heading} {String(active.heading).padStart(3, '0')}° ·{' '}
                {active.speed} kn
              </p>
            </div>

            {/* The headline channel gets the display size and a meter that
                places it in its own operating range; the rest is a ledger,
                one line per channel, each with the same measure beneath it.
                A number alone says nothing — a number against its scale does. */}
            <div key={picked} className="readout mt-8">
              <p className="flex items-baseline justify-between gap-4 text-[11px] tracking-[0.18em] text-mute uppercase">
                {copy.map.fields.level}
                <span className="tracking-[0.06em] text-mute/60 normal-case">0 – 15 ppm</span>
              </p>
              <p className="mt-3 text-[clamp(2.6rem,5.5vw,3.6rem)] leading-none font-medium tracking-[-0.05em] text-ink tabular-nums">
                {active.ppm}
                <span className="ml-3 align-baseline text-[0.26em] font-normal tracking-[0.04em] text-mute">
                  ppm
                </span>
              </p>
              <Meter fraction={Number(active.ppm) / 15} tall />

              <dl className="mt-9">
                {CHANNELS.map(({ key, unit, max, min = 0 }) => (
                  <div
                    key={key}
                    className="grid grid-cols-[1fr_auto] items-baseline gap-x-5 border-t border-ink/12 pt-3.5 pb-4"
                  >
                    <dt className="text-[12.5px] text-mute">{copy.map.fields[key]}</dt>
                    <dd className="text-right text-[15px] text-ink tabular-nums">
                      {active[key]}
                      <span className="ml-1.5 text-[11px] text-mute">{unit}</span>
                    </dd>
                    <div className="col-span-2 mt-3">
                      <Meter fraction={(Number(active[key]) - min) / (max - min)} />
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-7 lg:col-start-6">
            {/* Instrument window: hairline frame, cropped corners, a status
                rail below. No rounded card — this is a viewport, not a tile. */}
            <div className="relative border border-ink/15">
              <GoogleMap
                selected={picked}
                onSelect={onSelect}
                missingKeyLabel={copy.map.needKey}
                errorLabel={copy.map.error}
              />

              {[
                'top-0 left-0 border-t border-l',
                'top-0 right-0 border-t border-r',
                'bottom-0 left-0 border-b border-l',
                'bottom-0 right-0 border-b border-r',
              ].map((pos) => (
                <span
                  key={pos}
                  aria-hidden="true"
                  className={`pointer-events-none absolute ${pos} m-[-1px] h-4 w-4 border-ink/70`}
                />
              ))}

              <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-3 border-t border-ink/15 px-5 py-3.5">
                <span className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {copy.map.legend.map((l, i) => (
                    <span
                      key={l}
                      className="flex items-center gap-2.5 text-[11.5px] tracking-[0.02em] text-mute"
                    >
                      <StateGlyph kind={(['clear', 'sheen', 'review'] as const)[i]} />
                      {l}
                    </span>
                  ))}
                </span>
                <span className="text-[11.5px] text-mute/80 tabular-nums">{copy.map.live}</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ── 6. For authorities ───────────────────────────────────────────────── */

export function Authorities({ copy }: { copy: Copy }) {
  const reduced = usePrefersReducedMotion()
  const govCta = useMagnetic<HTMLAnchorElement>(14, reduced)

  return (
    <section id="authorities" className="scroll-mt-20 py-24 md:py-32">
      <div className={`${SHELL} grid gap-12 lg:grid-cols-12`}>
        <Reveal className="lg:col-span-5">
          <Eyebrow index="07">{copy.gov.eyebrow}</Eyebrow>
          <h2 className="mt-5 max-w-[18ch] text-[clamp(1.6rem,2.9vw,2.25rem)] leading-[1.18] font-medium tracking-[-0.025em] text-ink text-balance">
            {copy.gov.title}
          </h2>
        </Reveal>

        <Reveal delay={120} className="lg:col-span-6 lg:col-start-7">
          <p className="max-w-[52ch] text-[15.5px] leading-[1.7] text-mute">{copy.gov.body}</p>
          <ul className="mt-9 divide-y divide-ink/10 border-y border-ink/10">
            {copy.gov.points.map((p) => (
              <li
                key={p}
                className="py-4 text-[14.5px] leading-snug text-mute transition-colors duration-500 hover:text-ink"
              >
                {p}
              </li>
            ))}
          </ul>
          <a
            href="mailto:gov@catchy.kz"
            {...govCta}
            className="group mt-10 inline-flex items-center gap-3 rounded-full border border-ink/25 px-8 py-4 text-[14.5px] font-medium text-ink transition-[transform,background-color,color,border-color] duration-500 ease-[var(--ease-calm)] hover:border-ink hover:bg-ink hover:text-oil active:scale-[0.99]"
          >
            {copy.gov.cta}
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
              className="transition-transform duration-500 ease-[var(--ease-calm)] group-hover:translate-x-0.5"
            >
              <path
                d="M2.6 7h8.8M7.9 3.3 11.6 7l-3.7 3.7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </Reveal>
      </div>
    </section>
  )
}
