import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useLang } from '../lang'
import { LangSwitch, Wordmark } from '../components/Chrome'
import GoogleMap, { READINGS, type Reading } from '../components/GoogleMap'
import { CHANNELS, type Channel } from '../components/Sections'
import { Meter, Stat, StateGlyph } from '../components/ui'
import { useDetections } from '../useDetections'
import type { Copy } from '../copy'

/* ── Operations ───────────────────────────────────────────────────────────
   The public page argues; this page is used. Everything here is a working
   surface: filters that actually filter, a queue you work down, the coast,
   and the day behind you. Same two colours and hairlines as the site, but no
   reveals and no parallax — an inspector reads this twenty times a shift. */

/** ppm at which a reading stops being a data point and becomes a job. */
const THRESHOLD = 5
const CEILING = 15

/* ── Headline figures ─────────────────────────────────────────────────── */

function Figures({ copy, readings }: { copy: Copy; readings: Reading[] }) {
  const flagged = readings.filter((r) => r.kind !== 'clear').length
  const values = [`${readings.length} / 8`, '3 412', String(flagged), copy.dash.median]

  return (
    <ul className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      {copy.dash.kpis.map((label, i) => (
        <li key={label}>
          <Stat value={values[i]} label={label} />
        </li>
      ))}
    </ul>
  )
}

/* ── The period behind you ────────────────────────────────────────────── */

/**
 * Readings per bucket, with the share over threshold stacked at the base.
 * The range control reshapes this rather than sitting there inert.
 */
function buildSeries(range: number) {
  const buckets = range === 0 ? 24 : range === 1 ? 7 : 30
  const per = range === 0 ? 1 : range === 1 ? 24 : 24

  return Array.from({ length: buckets }, (_, i) => {
    const base = 60 + Math.sin(i / 3.4) * 22 + Math.cos(i / 1.7) * 14
    return {
      i,
      total: Math.round(base * per * (range === 0 ? 1 : 0.9)),
      over: Math.max(0, Math.round(Math.sin((i - 9) / 2.2) * 9 * per * (range === 0 ? 1 : 0.7))),
    }
  })
}

function axisFor(range: number, count: number) {
  if (range === 0) return ['00:00', '06:00', '12:00', '18:00', '23:00']
  return Array.from({ length: 5 }, (_, k) => `−${Math.round((1 - k / 4) * count)}`)
}

function Timeline({ copy, range }: { copy: Copy; range: number }) {
  const series = useMemo(() => buildSeries(range), [range])
  const peak = useMemo(() => Math.max(...series.map((d) => d.total)), [series])
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover === null ? null : series[hover]

  return (
    <section className="rounded-[22px] p-5 ring-1 ring-ink/12 ring-inset lg:p-7">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[11.5px] tracking-[0.18em] text-mute uppercase">
          {copy.dash.timeline}
        </h2>
        <p className="flex items-center gap-5 text-[11px] text-mute">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="block h-2 w-2 bg-ink" />
            {copy.map.legend[1]}
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="block h-2 w-2 bg-ink/25" />
            {copy.map.legend[0]}
          </span>
        </p>
      </header>

      <div
        className="relative mt-8 flex h-40 items-end gap-[3px]"
        onPointerLeave={() => setHover(null)}
      >
        {series.map((d) => {
          const on = hover === d.i
          return (
            <button
              key={d.i}
              type="button"
              onPointerEnter={() => setHover(d.i)}
              onFocus={() => setHover(d.i)}
              aria-label={`${d.i} — ${d.total}, ${d.over}`}
              className="flex h-full flex-1 cursor-default flex-col justify-end gap-[2px]"
            >
              <span
                className="block w-full rounded-t-[3px] transition-colors duration-300"
                style={{
                  height: `${((d.total - d.over) / peak) * 100}%`,
                  background: on ? 'rgba(238,242,250,0.42)' : 'rgba(238,242,250,0.22)',
                }}
              />
              {d.over > 0 && (
                <span className="block w-full bg-ink" style={{ height: `${(d.over / peak) * 100}%` }} />
              )}
            </button>
          )
        })}

        {shown && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 rounded-full border border-ink/25 bg-oil/95 px-3 py-2 text-[11px] whitespace-nowrap text-ink backdrop-blur-sm tabular-nums"
            style={{ left: `${((shown.i + 0.5) / series.length) * 100}%` }}
          >
            {range === 0 ? `${String(shown.i).padStart(2, '0')}:00` : `−${series.length - shown.i}`} ·{' '}
            {shown.total}
            {shown.over > 0 && <span className="text-mute"> · +{shown.over}</span>}
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-between border-t border-ink/10 pt-2.5 text-[10.5px] text-mute/70 tabular-nums">
        {axisFor(range, series.length).map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <p className="mt-4 max-w-[52ch] text-[12px] leading-[1.6] text-mute/70">
        {copy.dash.timelineNote}
      </p>
    </section>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const { lang, copy, setLang } = useLang()
  const [picked, setPicked] = useState(4)
  const [range, setRange] = useState(0)
  const [query, setQuery] = useState('')
  const [onlyFlagged, setOnlyFlagged] = useState(false)
  const [acked, setAcked] = useState<number[]>([])
  const [sent, setSent] = useState<number[]>([])
  const listRef = useRef<HTMLUListElement>(null)
  const onSelect = useCallback((i: number) => setPicked(i), [])

  // Live detections from the field units take over once any exist; until then
  // the built-in demo readings keep the page populated.
  const live = useDetections()
  const readings = live.length ? live : READINGS

  const active = readings[Math.min(picked, readings.length - 1)] ?? READINGS[0]
  const isAcked = acked.includes(picked)
  const isSent = sent.includes(picked)

  useEffect(() => {
    document.title = `Catchy — ${copy.dash.title}`
  }, [copy])

  // Worst first: this is a queue, not a fleet roster.
  const queue = useMemo(() => {
    const q = query.trim().toLowerCase()
    return readings.map((r, i) => ({ r, i }))
      .filter(({ r }) => (onlyFlagged ? r.kind !== 'clear' : true))
      .filter(({ r }) => (q ? r.vessel.toLowerCase().includes(q) : true))
      .sort((a, b) => Number(b.r.ppm) - Number(a.r.ppm))
  }, [query, onlyFlagged, readings])

  // Up and down walk the queue in the order it is displayed, so the keyboard
  // and the eye agree about what "next" means.
  const step = (delta: number) => {
    const at = queue.findIndex((e) => e.i === picked)
    const next = queue[Math.min(queue.length - 1, Math.max(0, (at < 0 ? 0 : at) + delta))]
    if (next) setPicked(next.i)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    step(e.key === 'ArrowDown' ? 1 : -1)
  }

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-ink/12 bg-oil/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1560px] flex-wrap items-center justify-between gap-4 px-6 py-3.5 lg:px-10">
          <div className="flex items-center gap-6">
            <Wordmark />
            <span aria-hidden="true" className="hidden h-4 w-px bg-ink/20 sm:block" />
            <p className="hidden text-[11.5px] tracking-[0.14em] text-mute uppercase sm:block">
              {copy.dash.title}
            </p>
          </div>

          <div className="flex items-center gap-5">
            <LangSwitch value={lang} onChange={setLang} />
            <Link
              to="/"
              className="rounded-full border border-ink/25 px-4 py-1.5 text-[11.5px] tracking-[0.12em] text-ink uppercase transition-colors duration-500 ease-[var(--ease-calm)] hover:border-ink hover:bg-ink hover:text-oil"
            >
              {copy.dash.back}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1560px] px-6 py-10 lg:px-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[clamp(1.6rem,2.6vw,2.1rem)] leading-none font-medium tracking-[-0.035em] text-ink">
              {copy.dash.subtitle}
            </h1>
            <p className="mt-3 text-[12.5px] text-mute">{copy.map.live}</p>
          </div>
          <Segmented options={copy.dash.ranges} value={range} onChange={setRange} />
        </div>

        <div className="mt-10">
          <Figures copy={copy} readings={readings} />
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-12">
          {/* The coast leads on narrow screens; on wide ones it holds still
              while the rail beside it scrolls. */}
          <div className="flex flex-col gap-6 xl:order-2 xl:col-span-8">
            <div className="xl:sticky xl:top-24">
              <div className="relative border border-ink/15">
                <GoogleMap
                  selected={picked}
                  onSelect={onSelect}
                  missingKeyLabel={copy.map.needKey}
                  errorLabel={copy.map.error}
                  readings={readings}
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

                {/* The markers are a chart, so they need a key like one. */}
                <div className="flex flex-wrap items-center gap-x-7 gap-y-2.5 border-t border-ink/15 px-5 py-3.5 text-[11.5px] text-mute">
                  <span className="tracking-[0.14em] text-mute/60 uppercase">
                    {copy.dash.key}
                  </span>
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden="true" className="block h-4 w-[3px] bg-ink" />
                    {copy.dash.keyHeight}
                  </span>
                  <span className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="block h-2.5 w-2.5 rounded-full border border-ink"
                    />
                    {copy.dash.keyCollar}
                  </span>
                  <span className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="block h-2.5 w-2.5 rounded-full border border-ink/40"
                    />
                    {copy.dash.keySweep}
                  </span>
                </div>
              </div>
            </div>

            <Timeline copy={copy} range={range} />
          </div>

          {/* Left rail: the queue, then whatever is selected in it. */}
          <div className="flex flex-col gap-6 xl:order-1 xl:col-span-4">
            <section className="overflow-hidden rounded-[22px] ring-1 ring-ink/12 ring-inset">
              <header className="border-b border-ink/15 px-5 py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[11.5px] tracking-[0.18em] text-mute uppercase">
                    {copy.dash.queue}
                  </h2>
                  <span className="text-[11px] text-mute/70 tabular-nums">
                    {queue.length} / {readings.length}
                  </span>
                </div>

                <div className="mt-3.5 flex items-center gap-3">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={copy.dash.search}
                    aria-label={copy.dash.search}
                    className="min-w-0 flex-1 border-b border-ink/15 bg-transparent pb-1.5 text-[13px] text-ink transition-colors duration-300 placeholder:text-mute/50 focus:border-ink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setOnlyFlagged((v) => !v)}
                    aria-pressed={onlyFlagged}
                    className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] tracking-[0.08em] uppercase transition-colors duration-300 ${
                      onlyFlagged
                        ? 'border-ink bg-ink text-oil'
                        : 'border-ink/20 text-mute hover:border-ink/50 hover:text-ink'
                    }`}
                  >
                    {copy.dash.onlyFlagged}
                  </button>
                </div>
              </header>

              {queue.length === 0 ? (
                <p className="px-5 py-10 text-center text-[13px] text-mute/70">
                  {copy.dash.empty}
                </p>
              ) : (
                <ul ref={listRef} onKeyDown={onKeyDown}>
                  {queue.map(({ r, i }) => {
                    const on = picked === i
                    return (
                      <li key={r.id ?? `${r.vessel}-${i}`}>
                        <button
                          type="button"
                          onClick={() => setPicked(i)}
                          onPointerEnter={() => setPicked(i)}
                          onFocus={() => setPicked(i)}
                          aria-pressed={on}
                          className="relative flex w-full cursor-pointer items-center gap-4 border-b border-ink/10 py-4 pr-5 pl-5 text-left transition-colors duration-300 last:border-b-0 hover:bg-ink/[0.04]"
                          style={{ background: on ? 'rgba(238,242,250,0.06)' : undefined }}
                        >
                          {/* Selection is a bar in the margin, not a fill —
                              it survives the row being hovered as well. */}
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-0 left-0 w-px origin-center bg-ink transition-transform duration-300"
                            style={{ transform: on ? 'scaleY(1)' : 'scaleY(0)' }}
                          />
                          <StateGlyph kind={r.kind} />

                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-3">
                              <span
                                className="truncate text-[14px] transition-colors duration-300"
                                style={{ color: on ? '#EEF2FA' : '#7E91B8' }}
                              >
                                {r.vessel}
                              </span>
                              <span className="shrink-0 text-[13.5px] text-ink tabular-nums">
                                {r.ppm}
                                <span className="ml-1 text-[10.5px] text-mute">ppm</span>
                              </span>
                            </span>
                            <span className="mt-2.5 block">
                              <Meter
                                fraction={Number(r.ppm) / CEILING}
                                threshold={THRESHOLD / CEILING}
                              />
                            </span>
                          </span>

                          <span className="shrink-0 text-[11px] text-mute/70 tabular-nums">
                            {r.time}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {/* The selected record, ledgered the same way as on the site. */}
            <section key={picked} className="readout rounded-[22px] p-5 ring-1 ring-ink/12 ring-inset lg:p-7">
              <h2 className="text-[11.5px] tracking-[0.18em] text-mute uppercase">
                {copy.dash.detail}
              </h2>

              <p className="mt-5 flex items-baseline justify-between gap-4">
                <span className="text-[19px] font-medium tracking-[-0.02em] text-ink">
                  {active.vessel}
                </span>
                <span className="text-[12px] text-mute tabular-nums">{active.time}</span>
              </p>
              <p className="mt-2 text-[12px] text-mute/70 tabular-nums">
                {active.lat.toFixed(4)}° N {active.lng.toFixed(4)}° E
                {active.source === 'pi' ? (
                  active.iso ? <> · {active.iso.replace('T', ' ').replace('Z', ' UTC')}</> : null
                ) : (
                  <>
                    {' '}· {String(active.heading).padStart(3, '0')}° · {active.speed} kn
                  </>
                )}
              </p>

              <p className="mt-8 flex items-baseline justify-between gap-4 text-[11px] tracking-[0.18em] text-mute uppercase">
                {copy.map.fields.level}
                <span className="tracking-[0.04em] text-mute/60 normal-case">
                  {copy.dash.threshold}
                </span>
              </p>
              <p className="mt-2.5 text-[clamp(2.2rem,4vw,2.9rem)] leading-none font-medium tracking-[-0.05em] text-ink tabular-nums">
                {active.ppm}
                <span className="ml-3 align-baseline text-[0.26em] font-normal tracking-[0.04em] text-mute">
                  {active.source === 'pi' ? 'ppm (est.)' : 'ppm'}
                </span>
              </p>
              <Meter
                fraction={Number(active.ppm) / CEILING}
                threshold={THRESHOLD / CEILING}
                tall
              />

              {active.source === 'pi' ? (
                /* Camera unit: show the evidence photo and what the model saw,
                   instead of the lab telemetry channels it never measures. */
                <div className="mt-8">
                  {active.image && (
                    <img
                      src={active.image}
                      alt={`Detection from ${active.vessel}`}
                      className="w-full rounded-[14px] border border-ink/15"
                    />
                  )}
                  <dl className="mt-6">
                    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-5 border-t border-ink/12 pt-3.5 pb-4">
                      <dt className="text-[12.5px] text-mute">Oil coverage</dt>
                      <dd className="text-right text-[15px] text-ink tabular-nums">
                        {((active.oil_coverage ?? 0) * 100).toFixed(1)}
                        <span className="ml-1.5 text-[11px] text-mute">%</span>
                      </dd>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-5 border-t border-ink/12 pt-3.5 pb-4">
                      <dt className="text-[12.5px] text-mute">Confidence</dt>
                      <dd className="text-right text-[15px] text-ink tabular-nums">
                        {((active.confidence ?? 0) * 100).toFixed(0)}
                        <span className="ml-1.5 text-[11px] text-mute">%</span>
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <dl className="mt-8">
                  {CHANNELS.map((c: Channel) => (
                    <div
                      key={c.key}
                      className="grid grid-cols-[1fr_auto] items-baseline gap-x-5 border-t border-ink/12 pt-3.5 pb-4"
                    >
                      <dt className="text-[12.5px] text-mute">{copy.map.fields[c.key]}</dt>
                      <dd className="text-right text-[15px] text-ink tabular-nums">
                        {active[c.key]}
                        <span className="ml-1.5 text-[11px] text-mute">{c.unit}</span>
                      </dd>
                      <div className="col-span-2 mt-3">
                        <Meter
                          fraction={(Number(active[c.key]) - (c.min ?? 0)) / (c.max - (c.min ?? 0))}
                        />
                      </div>
                    </div>
                  ))}
                </dl>
              )}

              {/* One action bar rather than two loose buttons: the record's
                  current standing on the left, the only two moves available on
                  the right, and dispatch stays shut until it is acknowledged. */}
              <div className="mt-8 flex flex-col gap-4 rounded-[20px] bg-ink/[0.04] p-4 ring-1 ring-ink/[0.07] ring-inset sm:flex-row sm:items-center sm:justify-between sm:pl-5">
                <p className="flex items-center gap-2.5 text-[12.5px] text-mute">
                  <span
                    aria-hidden="true"
                    className={`block h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                      isSent ? 'bg-ink' : isAcked ? 'bg-ink/60' : 'bg-mute/40'
                    }`}
                  />
                  {isSent ? copy.dash.dispatched : isAcked ? copy.dash.acked : copy.dash.threshold}
                </p>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAcked((a) => (a.includes(picked) ? a : [...a, picked]))}
                    disabled={isAcked}
                    className="rounded-full bg-ink px-5 py-2.5 text-[12.5px] font-medium text-oil transition-[opacity,transform] duration-300 ease-[var(--ease-calm)] enabled:hover:-translate-y-px disabled:bg-ink/12 disabled:text-mute"
                  >
                    {copy.dash.ack}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSent((s) => (s.includes(picked) ? s : [...s, picked]))}
                    disabled={!isAcked || isSent}
                    className="rounded-full px-5 py-2.5 text-[12.5px] text-ink ring-1 ring-ink/25 ring-inset transition-colors duration-300 enabled:hover:bg-ink/10 disabled:text-mute/45 disabled:ring-ink/10"
                  >
                    {copy.dash.dispatch}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

/** Ruled option row. The same setting control as the language switch. */
function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: number
  onChange: (i: number) => void
}) {
  return (
    <div className="flex items-center">
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(i)}
          aria-pressed={value === i}
          className={`relative px-3.5 py-1 text-[11.5px] tracking-[0.08em] transition-colors duration-300 ${
            i > 0 ? 'border-l border-ink/15' : ''
          } ${value === i ? 'text-ink' : 'text-mute/70 hover:text-ink'}`}
        >
          {o}
          <span
            aria-hidden="true"
            className="absolute inset-x-3.5 -bottom-0.5 h-px origin-left bg-ink transition-transform duration-500 ease-[var(--ease-calm)]"
            style={{ transform: value === i ? 'scaleX(1)' : 'scaleX(0)' }}
          />
        </button>
      ))}
    </div>
  )
}
