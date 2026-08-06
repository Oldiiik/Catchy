import { useEffect, useState } from 'react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import type { Reading } from './components/GoogleMap'

/**
 * Live oil-spill detections pushed by the field units (Raspberry Pi cameras)
 * and served back by the edge function's GET /detections route.
 *
 * Polls on an interval so the map stays current without a websocket. Returns
 * an empty array until the first successful fetch; callers fall back to the
 * built-in demo readings when this is empty so the page is never blank.
 */
export function useDetections(pollMs = 10_000): Reading[] {
  const [items, setItems] = useState<Reading[]>([])

  useEffect(() => {
    let alive = true

    const load = () =>
      fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-fb90d35e/detections`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } },
      )
        .then((r) => (r.ok ? r.json() : { detections: [] }))
        .then((d: { detections?: Reading[] }) => {
          if (alive && Array.isArray(d.detections)) setItems(d.detections)
        })
        .catch(() => {
          /* offline or function not deployed yet — keep last known list */
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
