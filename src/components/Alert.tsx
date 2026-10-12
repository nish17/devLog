import type { ReactNode } from 'react'

interface AlertProps {
  tone?: 'info' | 'success' | 'error' | 'warning'
  children: ReactNode
  onDismiss?: () => void
  role?: 'status' | 'alert'
}

export function Alert({
  tone = 'info',
  children,
  onDismiss,
  role = 'status',
}: AlertProps) {
  return (
    <div className={`alert alert-${tone}`} role={role}>
      <div className="alert-body">{children}</div>
      {onDismiss ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  )
}
