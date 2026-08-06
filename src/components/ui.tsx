export const SHELL = 'mx-auto w-full max-w-[1180px] px-6 lg:px-10'

/**
 * One reading against its scale. The track is the full range and the fill is
 * where this sample lands — the same measure at every size, so channels can
 * be compared down a column without reading a single axis label.
 */
export function Meter({
  fraction,
  tall = false,
  threshold,
}: {
  fraction: number
  tall?: boolean
  /** Where the action limit sits on the same scale, 0–1. Drawn as a notch. */
  threshold?: number
}) {
  const width = Math.min(1, Math.max(0, fraction)) * 100

  return (
    // A span, not a div: meters appear inside buttons, where only phrasing
    // content is legal.
    <span
      aria-hidden="true"
      className={`relative block w-full overflow-hidden bg-ink/10 ${tall ? 'mt-5 h-1' : 'h-px'}`}
    >
      <span
        className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-700 ease-[var(--ease-calm)]"
        style={{ width: `${width}%` }}
      />
      {threshold !== undefined && (
        <span
          className="absolute -top-1 bottom-[-4px] w-px bg-ink/45"
          style={{ left: `${Math.min(1, Math.max(0, threshold)) * 100}%` }}
        />
      )}
    </span>
  )
}

/**
 * A figure on its own quiet surface. Numbers used to hang off hairline rules
 * with tick marks, which made every stat look like a spreadsheet cell and let
 * long labels collapse into narrow columns. A soft, evenly-sized panel gives
 * each figure the same room and lets the type do the work.
 */
export function Stat({
  value,
  unit,
  label,
  size = 'md',
}: {
  value: string
  unit?: string
  label: string
  /** `lg` is the landing page's display scale; `md` suits dense surfaces. */
  size?: 'md' | 'lg'
}) {
  return (
    <div className="group rounded-[20px] bg-ink/[0.035] px-6 py-6 ring-1 ring-ink/[0.07] ring-inset transition-[background-color,transform] duration-500 ease-[var(--ease-calm)] hover:-translate-y-0.5 hover:bg-ink/[0.065] sm:px-7 sm:py-7">
      <p
        className={`leading-none font-medium tracking-[-0.04em] text-ink tabular-nums ${
          size === 'lg'
            ? 'text-[clamp(2rem,3.4vw,2.9rem)]'
            : 'text-[clamp(1.5rem,2.3vw,1.9rem)]'
        }`}
      >
        {value}
        {unit && (
          <span className="ml-2 align-baseline text-[0.42em] font-normal tracking-[0.03em] text-mute">
            {unit}
          </span>
        )}
      </p>
      <p className="mt-4 text-[12.5px] leading-[1.55] text-mute">{label}</p>
    </div>
  )
}

/** Section label. The index gives the page a spine you can feel while scrolling. */
export function Eyebrow({ index, children }: { index: string; children: string }) {
  return (
    <p className="flex items-baseline gap-3 text-[11.5px] font-medium tracking-[0.2em] uppercase">
      <span className="text-ink/40 tabular-nums">{index}</span>
      <span className="h-px w-6 translate-y-[-3px] bg-ink/20" />
      <span className="text-mute">{children}</span>
    </p>
  )
}

/**
 * Reading state as a shape, never as a second hue: an open diamond is clear,
 * a solid one is a sheen, a solid one inside a ring is under review.
 */
export function StateGlyph({ kind }: { kind: 'clear' | 'sheen' | 'review' }) {
  return (
    <span aria-hidden="true" className="relative grid h-4 w-4 shrink-0 place-items-center">
      {kind === 'review' && <span className="absolute h-4 w-4 rotate-45 border border-ink/45" />}
      <span
        className={`h-1.5 w-1.5 rotate-45 border border-ink ${kind === 'clear' ? '' : 'bg-ink'}`}
      />
    </span>
  )
}
