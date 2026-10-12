import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  tone?: 'default' | 'danger'
  children: ReactNode
}

export function IconButton({
  label,
  tone = 'default',
  className = '',
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const toneClass = tone === 'danger' ? 'icon-btn is-danger' : 'icon-btn'
  return (
    <button
      type={type}
      className={`${toneClass} ${className}`.trim()}
      aria-label={label}
      title={label}
      {...rest}
    >
      {children}
    </button>
  )
}

export function EditIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M11.5 1.5a1.414 1.414 0 0 1 2 2L5.5 11.5 2 12.5l1-3.5L11.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10 3l3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function DeleteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 4h10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12.5 4v9a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 7v4M9.5 7v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
