import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ── Keyless map ────────────────────────────────────────────────────────────
   This was a Google Maps component; it has been swapped for Leaflet + free
   CartoDB dark tiles so the map renders with NO API key. The public surface
   (the `Reading` type, `READINGS`, and the component's props) is unchanged, so
   the rest of the app — Dashboard, queue, detail panel — works untouched.
   The old three.js marker overlay (MapMarkers3D) is simply no longer imported. */

export type Reading = {
  lat: number
  lng: number
  kind: 'clear' | 'sheen' | 'review'
  vessel: string
  time: string
  /** Total hydrocarbons, ppm. */
  ppm: string
  /** Film thickness, µm. */
  film: string
  /** Fluorescence response at 440 nm, relative units. */
  fluor: string
  /** Turbidity, NTU. */
  turb: string
  /** Water temperature, °C. */
  temp: string
  /** Course over ground, degrees true. */
  heading: number
  /** Speed over ground, knots. */
  speed: string

  /* ── Optional, present on live detections from the field units ────────── */
  /** Stable id (used for de-dup + React keys). */
  id?: string
  /** Full ISO-8601 UTC timestamp (the `time` field is just HH:MM). */
  iso?: string
  /** Annotated photo as a data-URI, shown in the detail panel. */
  image?: string | null
  /** Fraction of the frame classified as oil (0–1). */
  oil_coverage?: number
  /** Strongest oil-detection confidence (0–1). */
  confidence?: number
  /** Per-type oil coverage breakdown. */
  coverage_by_type?: Record<string, number>
  /** Where the reading came from: 'pi' for a live camera unit. */
  source?: string
}

/** Sample fleet telemetry, offshore of Aktau along the Mangystau coast. */
export const READINGS: Reading[] = [
  { lat: 43.7126, lng: 51.1402, kind: 'clear', vessel: 'Айсұлу 04', time: '11:42', ppm: '0.3', film: '0.00', fluor: '12', turb: '18', temp: '21.4', heading: 168, speed: '8.2' },
  { lat: 43.6802, lng: 51.0684, kind: 'clear', vessel: 'Бекет-Ата', time: '11:51', ppm: '0.2', film: '0.00', fluor: '9', turb: '24', temp: '21.6', heading: 212, speed: '6.4' },
  { lat: 43.6491, lng: 51.1015, kind: 'sheen', vessel: 'Каспий-17', time: '12:06', ppm: '4.7', film: '0.31', fluor: '86', turb: '31', temp: '21.9', heading: 143, speed: '5.1' },
  { lat: 43.6234, lng: 51.0271, kind: 'clear', vessel: 'Жайық 22', time: '12:11', ppm: '0.4', film: '0.00', fluor: '14', turb: '22', temp: '22.0', heading: 254, speed: '9.7' },
  { lat: 43.6055, lng: 51.1488, kind: 'review', vessel: 'Тұлпар 09', time: '12:24', ppm: '11.2', film: '1.84', fluor: '241', turb: '29', temp: '22.3', heading: 197, speed: '3.6' },
  { lat: 43.5718, lng: 51.0842, kind: 'clear', vessel: 'Нұрлан Б.', time: '12:30', ppm: '0.1', film: '0.00', fluor: '7', turb: '17', temp: '22.1', heading: 302, speed: '7.8' },
  { lat: 43.5462, lng: 51.1673, kind: 'clear', vessel: 'Сарытас', time: '12:37', ppm: '0.5', film: '0.02', fluor: '19', turb: '26', temp: '22.4', heading: 118, speed: '10.3' },
  { lat: 43.5231, lng: 51.0405, kind: 'clear', vessel: 'Ерсай 03', time: '12:44', ppm: '0.3', film: '0.00', fluor: '11', turb: '20', temp: '22.6', heading: 271, speed: '6.9' },
]

const AKTAU: L.LatLngTuple = [43.641, 51.1533]

const KIND_COLOR: Record<Reading['kind'], string> = {
  clear: '#5f739c',
  sheen: '#ffb020',
  review: '#ff4d4d',
}

type Props = {
  selected: number
  onSelect: (index: number) => void
  // Kept for signature compatibility with the old Google Maps component; the
  // keyless Leaflet map never needs a key, so these are unused.
  missingKeyLabel?: string
  errorLabel?: string
  /** Live fleet state. Defaults to the static sample the landing page shows. */
  readings?: Reading[]
}

export default function GoogleMap({ selected, onSelect, readings = READINGS }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.CircleMarker[]>([])
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  // Create the map once.
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return
    const map = L.map(hostRef.current, {
      center: AKTAU,
      zoom: 11,
      zoomControl: true,
      attributionControl: false,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    // The card animates in; recompute size once it has settled.
    setTimeout(() => map.invalidateSize(), 120)

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current = []
    }
  }, [])

  // Sync markers whenever the readings change (the fleet moves every ~0.5 s and
  // live detections arrive over time). Reuse markers where possible.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Grow / shrink the marker pool to match readings.length.
    while (markersRef.current.length < readings.length) {
      const m = L.circleMarker(AKTAU, {
        radius: 7,
        weight: 2,
        color: '#0a0f18',
        fillOpacity: 0.95,
      }).addTo(map)
      const idx = markersRef.current.length
      m.on('click', () => onSelectRef.current(idx))
      markersRef.current.push(m)
    }
    while (markersRef.current.length > readings.length) {
      const m = markersRef.current.pop()
      if (m) map.removeLayer(m)
    }

    // Update each marker's position / style from its reading.
    readings.forEach((r, i) => {
      const m = markersRef.current[i]
      if (!m) return
      const isLive = r.source === 'pi'
      m.setLatLng([r.lat, r.lng])
      m.setStyle({
        fillColor: KIND_COLOR[r.kind] ?? '#5f739c',
        radius: isLive ? 10 : 7,
        // Live detections get a bright ring so they stand out from the fleet.
        color: isLive ? '#22d3ee' : '#0a0f18',
        weight: isLive ? 3 : 2,
      })
      // Bind the tooltip once, then only update its text — re-binding every
      // sim tick (twice a second) would churn Tooltip objects and DOM nodes.
      const text = isLive
        ? `${Math.round((r.oil_coverage ?? 0) * 100)}% oil`
        : `${r.vessel} · ${r.ppm} ppm`
      if (!m.getTooltip()) m.bindTooltip(text, { direction: 'top' })
      else m.setTooltipContent(text)
    })
  }, [readings])

  // Reflect the selected index by emphasising that marker.
  useEffect(() => {
    markersRef.current.forEach((m, i) => {
      m.setStyle({ opacity: i === selected ? 1 : 0.85 })
      if (i === selected) m.bringToFront()
    })
  }, [selected, readings])

  return (
    <div className="relative aspect-[16/11] w-full overflow-hidden bg-oil">
      <div ref={hostRef} className="absolute inset-0" />
    </div>
  )
}
