import { useMemo, useState } from 'react'
import type { Achievement } from '../types/achievement'
import { AchievementCard } from '../components/AchievementCard'
import { Alert } from '../components/Alert'
import { EmptyState } from '../components/EmptyState'
import { todayISODate } from '../lib/dates'
import { filterByPeriod, generateReviewMarkdown } from '../lib/review'
import { copyToClipboard, downloadTextFile, stampFilename } from '../lib/download'

interface ReviewModeProps {
  achievements: Achievement[]
}

function defaultStart(): string {
  const now = new Date()
  return `${now.getFullYear()}-01-01`
}

export function ReviewMode({ achievements }: ReviewModeProps) {
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(todayISODate)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const rangeError =
    start && end && start > end
      ? 'Start date must be on or before end date.'
      : null

  const inPeriod = useMemo(() => {
    if (rangeError) return []
    return filterByPeriod(achievements, { start, end })
  }, [achievements, start, end, rangeError])

  const markdown = useMemo(() => {
    if (rangeError) return ''
    return generateReviewMarkdown(achievements, { start, end })
  }, [achievements, start, end, rangeError])

  const handleCopy = async () => {
    if (rangeError || busy) return
    setBusy(true)
    setError(null)
    setCopied(false)
    const ok = await copyToClipboard(markdown)
    setBusy(false)
    if (!ok) {
      setError('Could not copy to clipboard. Try exporting as Markdown instead.')
      return
    }
    setCopied(true)
  }

  const handleExport = () => {
    if (rangeError || busy) return
    setBusy(true)
    setError(null)
    try {
      downloadTextFile(
        stampFilename('devlog-review', 'md'),
        markdown,
        'text/markdown;charset=utf-8',
      )
    } catch {
      setError('Could not export Markdown file.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page review-page">
      <header className="page-header">
        <h1>Review Mode</h1>
        <p className="page-subtitle">
          Build a self-review from saved achievements only. Nothing is invented.
        </p>
      </header>

      <section className="filters filters-review" aria-label="Review period">
        <div className="form-field">
          <label htmlFor="review-start">Start date</label>
          <input
            id="review-start"
            type="date"
            value={start}
            onChange={(e) => {
              setStart(e.target.value)
              setCopied(false)
            }}
          />
        </div>
        <div className="form-field">
          <label htmlFor="review-end">End date</label>
          <input
            id="review-end"
            type="date"
            value={end}
            onChange={(e) => {
              setEnd(e.target.value)
              setCopied(false)
            }}
          />
        </div>
      </section>

      {rangeError ? (
        <Alert tone="error" role="alert">
          {rangeError}
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="error" role="alert" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {copied ? (
        <Alert tone="success" role="status" onDismiss={() => setCopied(false)}>
          Review copied to clipboard.
        </Alert>
      ) : null}

      {!rangeError && inPeriod.length === 0 ? (
        <EmptyState
          title="No achievements in this period"
          description="Adjust the date range, or log achievements that fall within it."
        />
      ) : null}

      {!rangeError && inPeriod.length > 0 ? (
        <>
          <div className="review-toolbar">
            <p className="result-count" role="status">
              {inPeriod.length} achievement
              {inPeriod.length === 1 ? '' : 's'} in period
            </p>
            <div className="button-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCopy}
                disabled={busy}
              >
                {busy ? 'Working…' : 'Copy to clipboard'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExport}
                disabled={busy}
              >
                Export as Markdown
              </button>
            </div>
          </div>

          <section className="section" aria-labelledby="period-list-heading">
            <h2 id="period-list-heading">Achievements in period</h2>
            <ul className="achievement-list">
              {inPeriod.map((a) => (
                <li key={a.id}>
                  <AchievementCard achievement={a} />
                </li>
              ))}
            </ul>
          </section>

          <section className="section" aria-labelledby="summary-heading">
            <h2 id="summary-heading">Generated self-review</h2>
            <pre className="review-preview" tabIndex={0}>
              {markdown}
            </pre>
          </section>
        </>
      ) : null}
    </div>
  )
}
