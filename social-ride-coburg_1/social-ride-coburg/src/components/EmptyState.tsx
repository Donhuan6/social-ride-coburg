import type { ReactNode } from 'react'
import { LogoMark } from './Logo'

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="card p-12 text-center">
      <LogoMark className="h-10 text-line mx-auto" />
      <p className="display not-italic text-lg mt-4">{title}</p>
      <p className="mt-1 text-sm text-muted">{text}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}
