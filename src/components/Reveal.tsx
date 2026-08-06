import { createElement, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { useReveal } from '../hooks'

type RevealProps = {
  children: ReactNode
  as?: ElementType
  delay?: number
  className?: string
  style?: CSSProperties
  id?: string
}

export default function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
  style,
  id,
}: RevealProps) {
  const [ref, shown] = useReveal<HTMLDivElement>()

  return createElement(
    Tag,
    {
      id,
      ref,
      'data-shown': shown,
      className: `reveal ${className}`,
      style: { ...style, '--reveal-delay': `${delay}ms` } as CSSProperties,
    },
    children,
  )
}
