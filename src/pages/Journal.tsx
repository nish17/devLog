import { useMemo, useState } from 'react'
import {
  ACHIEVEMENT_CATEGORIES,
  type Achievement,
  type AchievementCategory,
} from '../types/achievement'
import { AchievementCard } from '../components/AchievementCard'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { Alert } from '../components/Alert'
import { isDateInRange } from '../lib/dates'

interface JournalProps {
  achievements: Achievement[]
  onCreate: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => { ok: true } | { ok: false; error: string }
}

export function Journal({
  achievements,
  onCreate,
  onEdit,
  onDelete,
}: JournalProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<AchievementCategory | ''>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const hasFilters = Boolean(query || category || startDate || endDate)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return achievements.filter((a) => {
      if (category && a.category !== category) return false
      if (!isDateInRange(a.date, startDate || null, endDate || null)) {
        return false
      }
      if (!q) return true
      const haystack = [a.title, a.notes, a.impact ?? '']
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [achievements, query, category, startDate, endDate])

  const clearFilters = () => {
    setQuery('')
    setCategory('')
    setStartDate('')
    setEndDate('')
  }

  const pending = achievements.find((a) => a.id === pendingDeleteId)

  const confirmDelete = () => {
    if (!pendingDeleteId || busy) return
    setBusy(true)
    const result = onDelete(pendingDeleteId)
    setBusy(false)
    setPendingDeleteId(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setNotice('Achievement deleted.')
  }

  return (
    <div className="page journal-page">
      <header className="page-header page-header-row">
        <div>
          <h1>Journal</h1>
          <p className="page-subtitle">
            Newest first. Search and filter without losing original notes.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onCreate}>
          Log an achievement
        </button>
      </header>

      {error ? (
        <Alert tone="error" role="alert" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert tone="success" role="status" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      ) : null}

      <section className="filters" aria-label="Filter achievements">
        <div className="form-field">
          <label htmlFor="journal-search">Search</label>
          <input
            id="journal-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title, notes, or impact"
          />
        </div>

        <div className="form-field">
          <label htmlFor="journal-category">Category</label>
          <select
            id="journal-category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as AchievementCategory | '')
            }
          >
            <option value="">All categories</option>
            {ACHIEVEMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="journal-start">From</label>
          <input
            id="journal-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="journal-end">To</label>
          <input
            id="journal-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {hasFilters ? (
          <div className="filters-clear">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </section>

      <p className="result-count" role="status">
        Showing {filtered.length} of {achievements.length}
      </p>

      {achievements.length === 0 ? (
        <EmptyState
          title="Your journal is empty"
          description="Log the first achievement to start building your brag book."
          actionLabel="Log an achievement"
          onAction={onCreate}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Try a different search or clear filters."
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      ) : (
        <ul className="achievement-list">
          {filtered.map((a) => (
            <li key={a.id}>
              <AchievementCard
                achievement={a}
                onEdit={onEdit}
                onDelete={(id) => setPendingDeleteId(id)}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete achievement?"
        message={
          pending
            ? `“${pending.title}” will be removed from this browser. This cannot be undone unless you have a backup.`
            : 'This achievement will be removed permanently from this browser.'
        }
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
