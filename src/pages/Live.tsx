import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useLang } from '../lang'
import { LangSwitch, Wordmark } from '../components/Chrome'
import GoogleMap from '../components/GoogleMap'
import { StateGlyph } from '../components/ui'
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
   Demonstration view: a map and a sidebar of photographed detections, and
   nothing else — no simulation, no KPI tiles, no ceremony. Just real
   detections streamed from the field units (camera → local server / edge
   function), each with its GPS fix and the frame the model flagged. Built
   for the moment in the room where the jury wants to see the thing work. */

export default function Live() {
  const { lang, copy, setLang } = useLang()
  const detections = useDetections()

  // Newest first for the sidebar, but keep the original index for selection
  // so the map and the list agree about which reading is which.
  const rows = useMemo(
    () => detections.map((r, i) => ({ r, i })).reverse(),
    [detections],
  )

  // `null` = follow the newest detection automatically (nice for a live demo);
  // any click pins a specific one.
  const [picked, setPicked] = useState<number | null>(null)
  const activeIndex = picked ?? detections.length - 1
  const onSelect = useCallback((i: number) => setPicked(i), [])

  useEffect(() => {
    document.title = 'Catchy — Реальные детекции'
  }, [])

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <header className="z-30 border-b border-ink/12 bg-oil">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-4 px-6 py-3.5 lg:px-8">
          <div className="flex items-center gap-6">
            <Wordmark />
            <span aria-hidden="true" className="hidden h-4 w-px bg-ink/20 sm:block" />
            <p className="hidden items-center gap-2.5 text-[11.5px] tracking-[0.14em] text-mute uppercase sm:flex">
              <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-ink/60" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-ink" />
              </span>
              Реальные детекции · {detections.length}
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

      <main className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[340px_1fr]">
        {/* Sidebar: detections, each with its photo. Nothing else. */}
        <section className="flex h-[40vh] min-h-0 flex-col border-b border-ink/12 md:h-auto md:border-r md:border-b-0">
          <header className="flex items-baseline justify-between gap-3 px-5 py-4">
            <h1 className="text-[13px] font-medium tracking-[0.02em] text-ink">
              Каспий · сектор Актау
            </h1>
            <span className="text-[11px] text-mute/70 tabular-nums">{detections.length}</span>
          </header>

          {rows.length === 0 ? (
            <p className="px-5 py-12 text-center text-[13px] leading-relaxed text-mute/70">
              Ожидание детекций с устройства…
              <br />
              Запусти детектор — точки появятся здесь.
            </p>
          ) : (
            <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-3">
              {rows.map(({ r, i }) => {
                const on = activeIndex === i
                const label = copy.map.legend[r.kind === 'clear' ? 0 : r.kind === 'sheen' ? 1 : 2]
                return (
                  <li key={r.id ?? r.vessel}>
                    <button
                      type="button"
                      onClick={() => setPicked(i)}
                      aria-pressed={on}
                      className="group relative block w-full cursor-pointer overflow-hidden rounded-[18px] text-left ring-1 ring-inset transition-colors duration-300 ease-[var(--ease-calm)]"
                      style={{ background: on ? 'rgba(238,242,250,0.045)' : undefined }}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 left-0 z-10 w-px origin-center bg-ink transition-transform duration-300"
                        style={{ transform: on ? 'scaleY(1)' : 'scaleY(0)' }}
                      />

                      <span className="relative block h-32 w-full overflow-hidden bg-ink/[0.04]">
                        {r.image && (
                          <img
                            src={r.image}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                      </span>

                      <span className="flex items-center gap-3 border-t border-ink/10 px-3.5 py-3">
                        <StateGlyph kind={r.kind} />
                        <span className="min-w-0 flex-1">
                          <span
                            className="block truncate text-[14px] transition-colors duration-300"
                            style={{ color: on ? '#EEF2FA' : '#7E91B8' }}
                          >
                            {r.vessel}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-mute/70">
                            {label} · {astanaTime(r.iso, r.time)}
                          </span>
                        </span>
                        <span className="shrink-0 text-[13px] text-ink tabular-nums">
                          {((r.oil_coverage ?? 0) * 100).toFixed(0)}
                          <span className="ml-0.5 text-[10px] text-mute">%</span>
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Map fills everything else. */}
        <div className="relative min-h-0 flex-1 md:flex-auto">
          <GoogleMap
            className="absolute inset-0"
            readings={detections}
            selected={activeIndex}
            onSelect={onSelect}
            followSelection
          />
        </div>
      </main>
    </div>
  )
}
