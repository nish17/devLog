/** Today's date as YYYY-MM-DD in local time. */
export function todayISODate(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Format YYYY-MM-DD for display, e.g. "Mar 12, 2026". */
export function formatDisplayDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return isoDate
  const [, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  )
}

export function isValidISOTimestamp(value: string): boolean {
  if (typeof value !== 'string' || value.trim() === '') return false
  const t = Date.parse(value)
  return !Number.isNaN(t)
}

/** Inclusive date-range check on YYYY-MM-DD strings. */
export function isDateInRange(
  date: string,
  start: string | null,
  end: string | null,
): boolean {
  if (start && date < start) return false
  if (end && date > end) return false
  return true
}

export function currentYear(): number {
  return new Date().getFullYear()
}
