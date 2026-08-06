import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useActiveSection, usePageProgress, usePrefersReducedMotion } from '../hooks'
import { LANGS, type Copy, type Lang } from '../copy'

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <a
      href="#top"
      className={`group inline-flex items-center gap-3 text-ink transition-opacity duration-300 hover:opacity-80 ${className}`}
    >
      {/* The same diamond the buoys are modelled from, drawn in one element. */}
      <span
        aria-hidden="true"
        className="block h-2 w-2 rotate-45 border border-ink transition-transform duration-700 ease-[var(--ease-calm)] group-hover:rotate-[135deg]"
      />
      <span className="text-[14px] font-medium tracking-[0.05em] uppercase">Catchy</span>
    </a>
  )
}

/** Three letters on one rule. No pill, no capsule — this is a setting. */
export function LangSwitch({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  return (
    <div role="group" aria-label="Language" className="flex items-center">
      {LANGS.map((l, i) => (
        <button
          key={l.id}
          type="button"
          onClick={() => onChange(l.id)}
          aria-pressed={value === l.id}
          title={l.label}
          className={`relative px-2.5 py-1 text-[11px] tracking-[0.14em] transition-colors duration-300 ${
            i > 0 ? 'border-l border-ink/15' : ''
          } ${value === l.id ? 'text-ink' : 'text-mute/70 hover:text-ink'}`}
        >
          {l.short}
          <span
            aria-hidden="true"
            className="absolute inset-x-2.5 -bottom-0.5 h-px origin-left bg-ink transition-transform duration-500 ease-[var(--ease-calm)]"
            style={{ transform: value === l.id ? 'scaleX(1)' : 'scaleX(0)' }}
          />
        </button>
      ))}
    </div>
  )
}

/**
 * A link that leans very slightly toward the cursor. Small enough that it
 * registers as responsiveness rather than as a trick.
 */
function MagneticLink({
  href,
  index,
  label,
  active,
  reduced,
  onMeasure,
}: {
  href: string
  index: string
  label: string
  active: boolean
  reduced: boolean
  onMeasure: (node: HTMLAnchorElement | null) => void
}) {
  const ref = useRef<HTMLAnchorElement>(null)

  const lean = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (reduced || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width
    ref.current.style.transform = `translate3d(${dx * 6}px, -1px, 0)`
  }

  const release = () => {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <a
      ref={(n) => {
        ref.current = n
        onMeasure(n)
      }}
      href={href}
      aria-current={active ? 'true' : undefined}
      onPointerMove={lean}
      onPointerLeave={release}
      className="group relative flex items-baseline gap-2 px-3.5 py-1.5 text-[11.5px] tracking-[0.12em] uppercase transition-[transform,color] duration-500 ease-[var(--ease-calm)]"
      style={{ color: active ? '#EEF2FA' : '#7E91B8' }}
    >
      <span
        className="text-[9px] tracking-[0.14em] tabular-nums transition-opacity duration-500"
        style={{ opacity: active ? 0.75 : 0.35 }}
      >
        {index}
      </span>
      <span className="whitespace-nowrap group-hover:text-ink">{label}</span>
    </a>
  )
}

const SECTIONS = ['why', 'how', 'sensor', 'map', 'authorities']
const INDICES = ['01', '04', '05', '06', '07']

export function Nav({
  copy,
  lang,
  onLang,
}: {
  copy: Copy
  lang: Lang
  onLang: (l: Lang) => void
}) {
  const [settled, setSettled] = useState(false)
  const [open, setOpen] = useState(false)
  const [pill, setPill] = useState({ x: 0, w: 0 })
  const nodes = useRef<(HTMLAnchorElement | null)[]>([])
  const progress = usePageProgress()
  const active = useActiveSection(SECTIONS)
  const reduced = usePrefersReducedMotion()

  const links = [
    { href: '#why', label: copy.nav.why },
    { href: '#how', label: copy.nav.how },
    { href: '#sensor', label: copy.nav.sensor },
    { href: '#map', label: copy.nav.map },
    { href: '#authorities', label: copy.nav.state },
  ]

  useEffect(() => {
    const onScroll = () => setSettled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The pill tracks whichever link is current. Measured rather than guessed,
  // because the labels are translated and their widths differ per language.
  useLayoutEffect(() => {
    const node = active >= 0 ? nodes.current[active] : null
    if (!node) return setPill((p) => ({ ...p, w: 0 }))
    setPill({ x: node.offsetLeft, w: node.offsetWidth })
  }, [active, lang, settled])

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      {/* Read-through. The nav doubles as the page's progress instrument. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px origin-left bg-ink/70"
        style={{
          transform: `scaleX(${progress})`,
          transition: reduced ? 'none' : 'transform 120ms linear',
        }}
      />

      {/* A full-width instrument header: one rule across the page, a bar that
          tightens rather than detaching into a floating tile. The site is
          built out of hairlines and ruled blocks; the nav is one of them. */}
      <div
        className="border-b transition-[padding,background-color,border-color,backdrop-filter] duration-700 ease-[var(--ease-calm)]"
        style={{
          borderColor: settled ? 'rgba(238,242,250,0.12)' : 'transparent',
          backgroundColor: settled ? 'rgba(0,2,5,0.78)' : 'transparent',
          backdropFilter: settled ? 'blur(14px)' : 'none',
        }}
      >
        <div
          className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-6 transition-[padding] duration-700 ease-[var(--ease-calm)] lg:px-10"
          style={{ paddingBlock: settled ? '0.75rem' : '1.35rem' }}
        >
          <Wordmark />

          {/* Section spine, mirroring the numbered eyebrows down the page. */}
          <nav className="relative hidden lg:block" aria-label="Sections">
            <span
              aria-hidden="true"
              className="absolute -bottom-1.5 h-px bg-ink transition-[transform,width,opacity] duration-500 ease-[var(--ease-calm)]"
              style={{
                width: pill.w || 1,
                transform: `translateX(${pill.x}px)`,
                opacity: pill.w ? 1 : 0,
              }}
            />
            <ul className="flex items-center">
              {links.map((l, i) => (
                <li key={l.href}>
                  <MagneticLink
                    href={l.href}
                    index={INDICES[i]}
                    label={l.label}
                    active={active === i}
                    reduced={reduced}
                    onMeasure={(n) => {
                      nodes.current[i] = n
                    }}
                  />
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-5">
            {/* Live fleet count — the product's own status, in its own chrome. */}
            <span className="hidden items-center gap-2 text-[11px] tracking-[0.14em] text-mute uppercase tabular-nums xl:flex">
              <span className="relative flex h-1 w-1">
                {!reduced && <span className="absolute inset-0 animate-ping bg-ink/60" />}
                <span className="relative h-1 w-1 bg-ink" />
              </span>
              8 / 8
            </span>

            <Link
              to="/dashboard"
              className="hidden rounded-full border border-ink/25 px-4 py-1.5 text-[11.5px] tracking-[0.12em] text-ink uppercase transition-colors duration-500 ease-[var(--ease-calm)] hover:border-ink hover:bg-ink hover:text-oil sm:block"
            >
              {copy.nav.dashboard}
            </Link>

            <LangSwitch value={lang} onChange={onLang} />

            <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Menu"
            className="relative grid h-9 w-9 place-items-center lg:hidden"
          >
            <span
              className="absolute h-px w-5 bg-ink transition-transform duration-500 ease-[var(--ease-calm)]"
              style={{ transform: open ? 'rotate(45deg)' : 'translateY(-3.5px)' }}
            />
            <span
              className="absolute h-px w-5 bg-ink transition-transform duration-500 ease-[var(--ease-calm)]"
              style={{ transform: open ? 'rotate(-45deg)' : 'translateY(3.5px)' }}
            />
          </button>
          </div>
        </div>
      </div>

      {/* Mobile sheet: rows unroll in sequence rather than appearing at once. */}
      <div
        className="grid overflow-hidden transition-[grid-template-rows] duration-[600ms] ease-[var(--ease-calm)] lg:hidden"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <ul className="border-b border-ink/12 bg-oil/92 px-6 backdrop-blur-xl">
            {links.map((l, i) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-4 border-t border-ink/10 py-4 text-[14px] tracking-[0.06em] uppercase transition-colors duration-300 first:border-t-0"
                  style={{
                    color: active === i ? '#EEF2FA' : '#7E91B8',
                    opacity: open ? 1 : 0,
                    transform: open ? 'none' : 'translateY(-6px)',
                    transition: `opacity 400ms var(--ease-calm) ${i * 55}ms, transform 400ms var(--ease-calm) ${i * 55}ms, color 300ms`,
                  }}
                >
                  <span className="text-[10px] tracking-[0.14em] text-mute/60 tabular-nums">
                    {INDICES[i]}
                  </span>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  )
}

export function Footer({ copy }: { copy: Copy }) {
  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-14 md:grid-cols-[1fr_auto] md:items-end lg:px-10">
        <div className="space-y-3">
          <Wordmark />
          <p className="text-[13.5px] text-mute">
            {copy.footer.tagline} · {copy.footer.office}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          {copy.footer.links.map((l) => (
            <a
              key={l}
              href="#top"
              className="text-[13px] text-mute transition-colors duration-300 hover:text-ink"
            >
              {l}
            </a>
          ))}
          <a
            href="mailto:hello@catchy.kz"
            className="text-[13px] text-mute transition-colors duration-500 hover:text-ink"
          >
            hello@catchy.kz
          </a>
        </div>
      </div>
      <div className="mx-auto max-w-[1180px] px-6 pb-10 lg:px-10">
        <p className="text-[12px] text-mute/60">{copy.footer.rights}</p>
      </div>
    </footer>
  )
}
