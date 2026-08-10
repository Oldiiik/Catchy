import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useLang } from '../lang'
import { LangSwitch, Wordmark } from '../components/Chrome'
import GoogleMap, { type Reading } from '../components/GoogleMap'
import { Meter, Stat, StateGlyph } from '../components/ui'
import { useDetections } from '../useDetections'

/** Display an ISO-8601 UTC timestamp in Astana / Kazakhstan time (UTC+5).
    The stored `iso` stays UTC; we only convert for display, falling back to
    the raw HH:MM `time` field when no `iso` is present. */
const astanaTime = (iso?: string, fallback = '—') =>
  iso
    ? new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Asia/Almaty',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(iso))
    : fallback

/* ── Live detections ────────────────────────────────────────────────────────
   The same surface as the operational dashboard, but with NO simulation: only
   real detections streamed from the field units (camera → local server / edge
   function). Each is a red marker on the map with the annotated photo attached;
   selecting one opens the photo and its oil coverage. Built for demonstrations,
   where the simulated fleet only gets in the way. */

export default function Live() {
  const { lang, copy, setLang } = useLang()
  const detections = useDetections()

  // Newest first for the queue, but keep the original index for selection so
  // the map and the list agree about which reading is which.
  const rows = useMemo(
    () => detections.map((r, i) => ({ r, i })).reverse(),
    [detections],
  )

  // `null` = follow the newest detection automatically (nice for a live demo);
  // any click pins a specific one.
  const [picked, setPicked] = useState<number | null>(null)
  const activeIndex = picked ?? detections.length - 1
  const active: Reading | undefined = detections[activeIndex]
  const onSelect = useCallback((i: number) => setPicked(i), [])

  useEffect(() => {
    document.title = 'Catchy — Реальные детекции'
  }, [])

  const flagged = detections.filter((d) => d.kind === 'review').length
  const latest = detections.length
    ? astanaTime(detections[detections.length - 1].iso, detections[detections.length - 1].time)
    : '—'

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-ink/12 bg-oil/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1560px] flex-wrap items-center justify-between gap-4 px-6 py-3.5 lg:px-10">
          <div className="flex items-center gap-6">
            <Wordmark />
            <span aria-hidden="true" className="hidden h-4 w-px bg-ink/20 sm:block" />
            <p className="hidden text-[11.5px] tracking-[0.14em] text-mute uppercase sm:block">
              Реальные детекции
            </p>
          </div>

          <div className="flex items-center gap-5">
            <LangSwitch value={lang} onChange={setLang} />
            <Link
              to="/dashboard"
              className="rounded-full border border-ink/25 px-4 py-1.5 text-[11.5px] tracking-[0.12em] text-ink uppercase transition-colors duration-500 ease-[var(--ease-calm)] hover:border-ink hover:bg-ink hover:text-oil"
            >
              Демо-панель
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1560px] px-6 py-10 lg:px-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[clamp(1.6rem,2.6vw,2.1rem)] leading-none font-medium tracking-[-0.035em] text-ink">
              Каспий · сектор Актау
            </h1>
            <p className="mt-3 flex items-center gap-2.5 text-[12.5px] text-mute tabular-nums">
              <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-ink/60" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-ink" />
              </span>
              живой поток · {detections.length} детекций
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <Stat value={String(detections.length)} label="Детекций получено" />
          <Stat value={String(flagged)} label="Требуют проверки" />
          <Stat value={latest} label="Последняя детекция" />
          <Stat value="RGB" label="Источник · камера на борту" />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-12">
          {/* Map */}
          <div className="flex flex-col gap-6 xl:order-2 xl:col-span-8">
            <div className="relative overflow-hidden rounded-[22px] ring-1 ring-ink/15 ring-inset">
              <GoogleMap
                readings={detections}
                selected={activeIndex}
                onSelect={onSelect}
              />
              <div className="flex flex-wrap items-center gap-x-7 gap-y-2.5 border-t border-ink/15 px-5 py-3.5 text-[11.5px] text-mute">
                <span className="tracking-[0.14em] text-mute/60 uppercase">Обозначения</span>
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="block h-2.5 w-2.5 rounded-full ring-2 ring-[#22d3ee]"
                    style={{ background: '#ff4d4d' }}
                  />
                  Обнаружена нефть
                </span>
                <span className="text-mute/60">
                  Каждая точка — снимок с камеры, где модель нашла нефть.
                </span>
              </div>
            </div>
          </div>

          {/* Queue + detail */}
          <div className="flex flex-col gap-6 xl:order-1 xl:col-span-4">
            <section className="overflow-hidden rounded-[22px] ring-1 ring-ink/12 ring-inset">
              <header className="flex items-baseline justify-between gap-3 border-b border-ink/15 px-5 py-3.5">
                <h2 className="text-[11.5px] tracking-[0.18em] text-mute uppercase">Очередь</h2>
                <span className="text-[11px] text-mute/70 tabular-nums">{detections.length}</span>
              </header>

              {rows.length === 0 ? (
                <p className="px-5 py-12 text-center text-[13px] leading-relaxed text-mute/70">
                  Ожидание детекций с устройства…
                  <br />
                  Запусти детектор — точки появятся здесь.
                </p>
              ) : (
                <ul className="max-h-[420px] overflow-y-auto">
                  {rows.map(({ r, i }) => {
                    const on = activeIndex === i
                    return (
                      <li key={r.id ?? r.vessel}>
                        <button
                          type="button"
                          onClick={() => setPicked(i)}
                          onPointerEnter={() => setPicked(i)}
                          aria-pressed={on}
                          className="relative flex w-full cursor-pointer items-center gap-4 border-b border-ink/10 py-4 pr-5 pl-5 text-left transition-colors duration-300 last:border-b-0 hover:bg-ink/[0.04]"
                          style={{ background: on ? 'rgba(238,242,250,0.06)' : undefined }}
                        >
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-0 left-0 w-px origin-center bg-ink transition-transform duration-300"
                            style={{ transform: on ? 'scaleY(1)' : 'scaleY(0)' }}
                          />
                          <StateGlyph kind={r.kind} />
                          {r.image ? (
                            <img
                              src={r.image}
                              alt=""
                              loading="lazy"
                              className="h-10 w-14 shrink-0 rounded-lg object-cover ring-1 ring-ink/15"
                            />
                          ) : (
                            <span className="h-10 w-14 shrink-0 rounded-lg bg-ink/10 ring-1 ring-ink/10" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-3">
                              <span
                                className="truncate text-[14px] transition-colors duration-300"
                                style={{ color: on ? '#EEF2FA' : '#7E91B8' }}
                              >
                                {r.vessel}
                              </span>
                              <span className="shrink-0 text-[13.5px] text-ink tabular-nums">
                                {((r.oil_coverage ?? 0) * 100).toFixed(0)}
                                <span className="ml-1 text-[10.5px] text-mute">% нефть</span>
                              </span>
                            </span>
                            <span className="mt-2.5 block">
                              <Meter fraction={r.oil_coverage ?? 0} />
                            </span>
                          </span>
                          <span className="shrink-0 text-[11px] text-mute/70 tabular-nums">
                            {astanaTime(r.iso, r.time)}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {/* Selected detection — the photo and what the model saw. */}
            {active && (
              <section className="rounded-[22px] p-5 ring-1 ring-ink/12 ring-inset lg:p-7">
                <h2 className="text-[11.5px] tracking-[0.18em] text-mute uppercase">Карточка детекции</h2>

                <p className="mt-5 flex items-baseline justify-between gap-4">
                  <span className="text-[19px] font-medium tracking-[-0.02em] text-ink">
                    {active.vessel}
                  </span>
                  <span className="text-[12px] text-mute tabular-nums">{astanaTime(active.iso, active.time)}</span>
                </p>
                <p className="mt-2 text-[12px] text-mute/70 tabular-nums">
                  {active.lat.toFixed(4)}° N {active.lng.toFixed(4)}° E
                </p>

                {active.image && (
                  <a href={active.image} target="_blank" rel="noreferrer" className="mt-6 block">
                    <img
                      src={active.image}
                      alt="Oil detection"
                      className="w-full rounded-[14px] ring-1 ring-ink/15 transition-opacity duration-300 hover:opacity-90"
                    />
                  </a>
                )}
                <p className="mt-4 text-[12px] leading-[1.6] text-mute/70">
                  Выделенные области на снимке — это то, что модель определила как нефть.
                  Нажми на фото, чтобы открыть в полном размере.
                </p>

                <dl className="mt-5">
                  <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-5 border-t border-ink/12 pt-3.5 pb-4">
                    <dt className="text-[12.5px] text-mute">Покрытие нефтью</dt>
                    <dd className="text-right text-[15px] text-ink tabular-nums">
                      {((active.oil_coverage ?? 0) * 100).toFixed(1)}
                      <span className="ml-1.5 text-[11px] text-mute">%</span>
                    </dd>
                    <div className="col-span-2 mt-3">
                      <Meter fraction={active.oil_coverage ?? 0} />
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-5 border-t border-ink/12 pt-3.5 pb-4">
                    <dt className="text-[12.5px] text-mute">Уверенность модели</dt>
                    <dd className="text-right text-[15px] text-ink tabular-nums">
                      {((active.confidence ?? 0) * 100).toFixed(0)}
                      <span className="ml-1.5 text-[11px] text-mute">%</span>
                    </dd>
                    <div className="col-span-2 mt-3">
                      <Meter fraction={active.confidence ?? 0} />
                    </div>
                  </div>
                </dl>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
