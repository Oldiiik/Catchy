/// <reference types="google.maps" />
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { projectId, publicAnonKey } from '../../utils/supabase/info'
import { usePrefersReducedMotion } from '../hooks'
import type { Projected } from './MapMarkers3D'

// Shares the three.js chunk with the sensor model; both live below the fold.
const MapMarkers3D = lazy(() => import('./MapMarkers3D'))

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

const AKTAU = { lat: 43.6215, lng: 51.098 }

declare global {
  interface Window {
    gm_authFailure?: () => void
  }
}

/**
 * Two flat tones. Everything Google wants to add — neighbourhood names, road
 * networks, parcels — is switched off; only the shoreline and the city itself
 * survive, because the coast is the only geography this map is about.
 */
const STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#000205' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5f739c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#000205' }] },
  { featureType: 'administrative', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape', stylers: [{ color: '#000205' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#081842' }] },
  { featureType: 'water', elementType: 'labels', stylers: [{ visibility: 'off' }] },
]

/**
 * The Maps key is a client-side key by design — it travels in the script URL
 * either way — but it can be held in one of two places. Prefer the build-time
 * variable; fall back to the edge function, which is where the Supabase secret
 * store surfaces it. Whichever exists wins, so neither has to be set up first.
 *
 * Cached module-wide: at most one round trip per page load, not one per mount.
 */
const BUILD_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

let keyRequest: Promise<string> | null = null

function fetchKey(): Promise<string> {
  if (BUILD_KEY) return Promise.resolve(BUILD_KEY)
  if (keyRequest) return keyRequest
  keyRequest = fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-fb90d35e/maps-key`,
    { headers: { Authorization: `Bearer ${publicAnonKey}` } },
  )
    // A missing or undeployed function is not an error worth surfacing as one;
    // it just means no key is configured yet.
    .then((r) => (r.ok ? r.json() : { key: '' }))
    .then((d: { key?: string }) => d.key ?? '')
    .catch(() => '')
  return keyRequest
}

let loader: Promise<void> | null = null

function loadMaps(key: string): Promise<void> {
  if (loader) return loader
  loader = new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.maps) return resolve()
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('maps-failed'))
    document.head.appendChild(script)
  })
  return loader
}

/* ── Reading layer ────────────────────────────────────────────────────────
   The markers themselves are modelled in three.js on a canvas above the map
   (see MapMarkers3D). This overlay does two jobs the canvas cannot: it turns
   each reading's lat/lng into container pixels every time the map draws, and
   it provides a real, focusable hit target for pointer and keyboard.

   WebGLOverlayView would have put the meshes inside the map's own camera, but
   it requires a vector map, which requires a cloud mapId — and a mapId
   disables the `styles` array, costing the entire two-tone treatment. A
   projection overlay under a pixel-space orthographic camera keeps both. */

type Layer = google.maps.OverlayView & {
  setActive: (index: number) => void
}

function createLayer(
  onSelect: (i: number) => void,
  points: { current: Projected[] },
  // A ref, not a value: the fleet moves every half second and the layer must
  // draw wherever the boats are now, without being torn down and rebuilt.
  readings: { current: Reading[] },
): Layer {
  class ReadingLayer extends google.maps.OverlayView {
    private root = document.createElement('div')
    private nodes: HTMLButtonElement[] = []

    onAdd() {
      this.root.className = 'rdg-layer'

      this.nodes = readings.current.map((r, i) => {
        const node = document.createElement('button')
        node.type = 'button'
        node.className = 'rdg'
        node.dataset.kind = r.kind
        node.setAttribute('aria-label', `${r.vessel}, ${r.ppm} ppm`)
        node.innerHTML = `<span class="rdg-chip"><b>${r.ppm}</b> ppm</span>`
        node.addEventListener('click', (e) => {
          e.stopPropagation()
          onSelect(i)
        })
        node.addEventListener('pointerenter', () => onSelect(i))
        node.addEventListener('focus', () => onSelect(i))
        this.root.appendChild(node)
        return node
      })

      this.getPanes()?.overlayMouseTarget.appendChild(this.root)
    }

    draw() {
      const projection = this.getProjection()
      if (!projection) return

      readings.current.forEach((r, i) => {
        const node = this.nodes[i]
        if (!node) return
        const latLng = new google.maps.LatLng(r.lat, r.lng)

        // Div pixels position the DOM hit target inside the overlay pane.
        const d = projection.fromLatLngToDivPixel(latLng)
        if (d) {
          node.style.left = `${d.x}px`
          node.style.top = `${d.y}px`
        }

        node.dataset.kind = r.kind
        node.setAttribute('aria-label', `${r.vessel}, ${r.ppm} ppm`)
        const chip = node.firstElementChild
        if (chip) chip.innerHTML = `<b>${r.ppm}</b> ppm`

        // Container pixels are what the canvas above the map needs.
        const c = projection.fromLatLngToContainerPixel(latLng)
        if (c) points.current[i] = { x: c.x, y: c.y, on: true }
      })
    }

    onRemove() {
      this.root.remove()
      this.nodes = []
    }

    setActive(index: number) {
      this.nodes.forEach((n, i) => {
        n.dataset.on = String(i === index)
      })
    }
  }

  return new ReadingLayer() as Layer
}

type Props = {
  selected: number
  onSelect: (index: number) => void
  missingKeyLabel: string
  errorLabel: string
  /** Live fleet state. Defaults to the static sample the landing page shows. */
  readings?: Reading[]
}

export default function GoogleMap({
  selected,
  onSelect,
  missingKeyLabel,
  errorLabel,
  readings = READINGS,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const layerRef = useRef<Layer | null>(null)
  const pointsRef = useRef<Projected[]>(readings.map(() => ({ x: 0, y: 0, on: false })))
  const readingsRef = useRef(readings)
  readingsRef.current = readings
  const reduced = usePrefersReducedMotion()
  const [status, setStatus] = useState<'loading' | 'ready' | 'nokey' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false

    // Google reports a rejected or referer-blocked key through this global
    // rather than a script error, so the load itself still "succeeds".
    const priorAuthFailure = window.gm_authFailure
    window.gm_authFailure = () => {
      if (!cancelled) setStatus('error')
      priorAuthFailure?.()
    }

    fetchKey()
      .then((key) => {
        if (cancelled) return
        if (!key) {
          setStatus('nokey')
          return Promise.reject(new Error('no-key'))
        }
        return loadMaps(key)
      })
      .then(() => {
        if (cancelled || !hostRef.current) return
        const map = new google.maps.Map(hostRef.current, {
          center: AKTAU,
          zoom: 11,
          styles: STYLE,
          disableDefaultUI: true,
          gestureHandling: 'cooperative',
          clickableIcons: false,
          backgroundColor: '#000205',
        })
        mapRef.current = map

        const layer = createLayer(onSelect, pointsRef, readingsRef)
        layer.setMap(map)
        layerRef.current = layer

        setStatus('ready')
      })
      .catch((e: Error) => {
        // 'no-key' already set its own, more specific status.
        if (!cancelled && e.message !== 'no-key') setStatus('error')
      })

    return () => {
      cancelled = true
      window.gm_authFailure = priorAuthFailure
      layerRef.current?.setMap(null)
      layerRef.current = null
      mapRef.current = null
    }
  }, [onSelect])

  // Selection is presentation only — the layer owns its own DOM.
  useEffect(() => {
    if (status === 'ready') layerRef.current?.setActive(selected)
  }, [selected, status])

  // The boats moved: reproject without touching the map itself.
  useEffect(() => {
    if (status === 'ready') layerRef.current?.draw()
  }, [readings, status])

  return (
    <div className="relative aspect-[16/11] w-full overflow-hidden bg-oil">
      <div ref={hostRef} className="absolute inset-0" />

      {status === 'ready' && (
        <Suspense fallback={null}>
          <MapMarkers3D
            readings={readings}
            points={pointsRef}
            selected={selected}
            reduced={reduced}
          />
        </Suspense>
      )}

      {status !== 'ready' && (
        <div className="absolute inset-0 grid place-items-center bg-oil px-8 text-center">
          <p className="max-w-[34ch] text-[13px] leading-relaxed text-mute">
            {status === 'nokey' ? missingKeyLabel : status === 'error' ? errorLabel : ''}
          </p>
        </div>
      )}
    </div>
  )
}
