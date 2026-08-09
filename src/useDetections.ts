import { useEffect, useState } from 'react'
import type { Reading } from './components/GoogleMap'

/**
 * Live oil-spill detections pushed by the field units (Raspberry Pi / laptop
 * camera) and served back by GET /detections.
 *
 * Points at the LOCAL demo server by default (src local_server/server.py).
 * Override with VITE_DETECTIONS_URL to aim at the deployed Supabase edge
 * function instead — the path and record shape are identical.
 *
 * Polls on an interval so the map stays current without a websocket. Returns
 * an empty array until the first successful fetch; the Dashboard merges these
 * with the simulated fleet, so the page is never blank.
 */
const BASE = (import.meta.env.VITE_DETECTIONS_URL as string | undefined) ?? 'http://localhost:8000'
const ENDPOINT = `${BASE}/functions/v1/make-server-fb90d35e/detections`

/** Server record (see local_server/server.py / the edge function) → Reading. */
function toReading(d: Record<string, unknown>): Reading {
  const coverage = Number(d.oil_coverage ?? 0)
  // The site keys its queue/markers by `vessel`, so it must be UNIQUE per
  // detection — one physical device produces many events. Append a short id.
  const device = String(d.device ?? d.vessel ?? 'Pi unit')
  const shortId = String(d.id ?? '').slice(0, 6)
  return {
    lat: Number(d.lat),
    lng: Number(d.lng ?? d.lon),
    kind: (d.kind as Reading['kind']) ?? 'review',
    vessel: shortId ? `${device} · ${shortId}` : device,
    time: String(d.time ?? ''),
    ppm: String(d.ppm ?? (coverage * 100).toFixed(1)),
    // A camera unit does not measure these lab channels.
    film: '—',
    fluor: '—',
    turb: '—',
    temp: '—',
    heading: Number(d.heading ?? 0),
    speed: String(d.speed ?? '0'),
    // Detection extras used by the map + detail panel.
    id: d.id ? String(d.id) : undefined,
    iso: d.iso ? String(d.iso) : undefined,
    image: (d.image as string | null | undefined) ?? null,
    oil_coverage: coverage,
    confidence: Number(d.confidence ?? 0),
    coverage_by_type: (d.coverage_by_type as Record<string, number>) ?? {},
    source: 'pi',
  }
}

export function useDetections(pollMs = 4000): Reading[] {
  const [items, setItems] = useState<Reading[]>([])

  useEffect(() => {
    let alive = true

    const load = () =>
      fetch(ENDPOINT)
        .then((r) => (r.ok ? r.json() : { detections: [] }))
        .then((d: { detections?: Record<string, unknown>[] }) => {
          if (alive && Array.isArray(d.detections)) {
            // Oldest first so array indices stay stable as new ones arrive.
            const rows = [...d.detections].reverse().map(toReading)
            setItems(rows)
          }
        })
        .catch(() => {
          /* server not up yet — keep last known list */
        })

    load()
    const t = setInterval(load, pollMs)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [pollMs])

  return items
}
