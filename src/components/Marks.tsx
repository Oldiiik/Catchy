/** Minimal line marks drawn for this page — one stroke weight, two tones. */

const S = {
  stroke: '#7E91B8',
  strokeWidth: 1.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
}

const A = { ...S, stroke: '#EEF2FA', strokeWidth: 1.5 }

export function ClipMark() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <path d="M13 10v18a9 9 0 0 0 18 0V13" {...S} />
      <path d="M31 13a4 4 0 0 0-8 0v16a2.5 2.5 0 0 0 5 0V16" {...A} />
      <path d="M6 36h32" {...S} strokeOpacity={0.3} />
    </svg>
  )
}

export function LensMark() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <rect x="6" y="12" width="32" height="22" rx="5" {...S} />
      <path d="M16 12l2.4-4h7.2L28 12" {...S} />
      <circle cx="22" cy="23" r="6.5" {...S} />
      <path d="M19.2 25.4c1.6-2.6 4-2.6 5.6 0" {...A} />
    </svg>
  )
}

export function PinMark() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <path d="M7 30c5-3 9 3 14 0s9 3 15 0" {...S} strokeOpacity={0.4} />
      <path d="M7 36c5-3 9 3 14 0s9 3 15 0" {...S} strokeOpacity={0.22} />
      <path d="M22 24c3.9-4.2 5.8-7.4 5.8-10a5.8 5.8 0 1 0-11.6 0c0 2.6 1.9 5.8 5.8 10Z" {...A} />
      <circle cx="22" cy="14" r="2" {...S} />
    </svg>
  )
}
