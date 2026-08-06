import { lazy, type ComponentType } from 'react'

/**
 * `React.lazy` that survives one bad network moment.
 *
 * The three.js models are code-split, so they arrive after the page does. A
 * dropped request — or a redeploy that retires the hashed chunk an open tab is
 * still asking for — rejects the import, and an unhandled rejection during
 * render takes the whole route down. Retry once before giving up; `Model`
 * catches whatever is left.
 *
 * Deliberately a plain module with no components in it: a file that mixes
 * components with helpers becomes a Fast Refresh boundary, and refreshing it
 * re-runs the module-scope `lazyRetry(...)` calls in every consumer.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyRetry<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() => load().catch(() => new Promise<void>((r) => setTimeout(r, 600)).then(load)))
}
