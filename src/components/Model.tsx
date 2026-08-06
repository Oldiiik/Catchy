import { Component, Suspense, type ReactNode } from 'react'

type Props = { children: ReactNode; fallback?: ReactNode }

class Boundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}

/**
 * Suspense and an error boundary in one wrapper, since every model needs both.
 * A decorative sea plate that fails to load is not worth a blank page, so a
 * broken chunk degrades to the same placeholder that covers the loading state.
 */
export default function Model({ children, fallback }: Props) {
  return (
    <Boundary fallback={fallback}>
      <Suspense fallback={fallback ?? null}>{children}</Suspense>
    </Boundary>
  )
}
