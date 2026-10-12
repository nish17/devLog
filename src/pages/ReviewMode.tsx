import { useEffect, useMemo, useRef, useState } from 'react'
import type { Achievement } from '../types/achievement'
import { AchievementCard } from '../components/AchievementCard'
import { Alert } from '../components/Alert'
import { EmptyState } from '../components/EmptyState'
import { todayISODate } from '../lib/dates'
import { filterByPeriod, generateReviewMarkdown } from '../lib/review'
import { copyToClipboard, downloadTextFile, stampFilename } from '../lib/download'
import { reviewToObsidianMarkdown } from '../lib/obsidian'
import {
  DEFAULT_OLLAMA_MODEL,
  generateOllamaSummary,
  ollamaErrorHelp,
  OllamaRequestError,
  persistOllamaModel,
  readStoredOllamaModel,
} from '../lib/ollama'

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

  const [useOllama, setUseOllama] = useState(false)
  const [ollamaModel, setOllamaModel] = useState(readStoredOllamaModel)
  const [aiResult, setAiResult] = useState<{
    key: string
    text: string
  } | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiHelp, setAiHelp] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const rangeError =
    start && end && start > end
      ? 'Start date must be on or before end date.'
      : null

  const inPeriod = useMemo(() => {
    if (rangeError) return []
    return filterByPeriod(achievements, { start, end })
  }, [achievements, start, end, rangeError])

  const periodKey = useMemo(
    () => `${start}|${end}|${inPeriod.map((a) => a.id).join(',')}`,
    [start, end, inPeriod],
  )

  const markdown = useMemo(() => {
    if (rangeError) return ''
    return generateReviewMarkdown(achievements, { start, end })
  }, [achievements, start, end, rangeError])

  const evidenceLinks = useMemo(
    () =>
      inPeriod
        .filter((a) => a.evidenceUrl)
        .map((a) => ({
          id: a.id,
          title: a.title,
          url: a.evidenceUrl as string,
        })),
    [inPeriod],
  )

  const aiSummary =
    aiResult && aiResult.key === periodKey ? aiResult.text : null

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const handleCopy = async () => {
    if (rangeError || busy) return
    setBusy(true)
    setError(null)
    setCopied(false)
    const text = aiSummary ?? markdown
    const ok = await copyToClipboard(text)
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
        aiSummary ?? markdown,
        'text/markdown;charset=utf-8',
      )
    } catch {
      setError('Could not export Markdown file.')
    } finally {
      setBusy(false)
    }
  }

  const handleExportObsidian = () => {
    if (rangeError || busy) return
    setBusy(true)
    setError(null)
    try {
      const body = aiSummary
        ? `${aiSummary.trim()}\n\n---\n\n## Template review (fallback source)\n\n${markdown}`
        : markdown
      const md = reviewToObsidianMarkdown(
        { start, end },
        body,
        inPeriod.length,
      )
      downloadTextFile(
        stampFilename('devlog-review-obsidian', 'md'),
        md,
        'text/markdown;charset=utf-8',
      )
    } catch {
      setError('Could not export Obsidian Markdown.')
    } finally {
      setBusy(false)
    }
  }

  const runOllamaSummary = async () => {
    if (rangeError || inPeriod.length === 0 || aiLoading) return
    const model = ollamaModel.trim() || DEFAULT_OLLAMA_MODEL
    persistOllamaModel(model)
    setOllamaModel(model)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setAiLoading(true)
    setAiError(null)
    setAiHelp(null)
    setAiResult(null)
    setError(null)

    try {
      const text = await generateOllamaSummary({
        achievements: inPeriod,
        period: { start, end },
        model,
        signal: controller.signal,
      })
      if (!controller.signal.aborted) {
        setAiResult({ key: periodKey, text })
      }
    } catch (err) {
      if (controller.signal.aborted) return
      if (err instanceof OllamaRequestError) {
        setAiError(err.message)
        setAiHelp(ollamaErrorHelp(err.kind))
      } else {
        setAiError(
          err instanceof Error ? err.message : 'Ollama summary failed.',
        )
        setAiHelp(ollamaErrorHelp('unknown'))
      }
    } finally {
      if (!controller.signal.aborted) {
        setAiLoading(false)
      }
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
                disabled={busy || aiLoading}
              >
                {busy ? 'Working…' : 'Copy to clipboard'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExport}
                disabled={busy || aiLoading}
              >
                Export as Markdown
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleExportObsidian}
                disabled={busy || aiLoading}
              >
                Export Obsidian Markdown
              </button>
            </div>
          </div>

          <section className="panel ollama-panel" aria-labelledby="ollama-heading">
            <h2 id="ollama-heading">Optional local AI summary</h2>
            <p className="field-hint">
              Off by default. When enabled, DevLog calls local Ollama with only the
              selected achievements. The template review below stays as the
              fallback if Ollama is unavailable.
            </p>
            <div className="ollama-controls">
              <label className="checkbox-field" htmlFor="use-ollama">
                <input
                  id="use-ollama"
                  type="checkbox"
                  checked={useOllama}
                  onChange={(e) => setUseOllama(e.target.checked)}
                />
                <span>Use Ollama to draft a summary</span>
              </label>
              {useOllama ? (
                <>
                  <div className="form-field ollama-model-field">
                    <label htmlFor="ollama-model">Model</label>
                    <input
                      id="ollama-model"
                      type="text"
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      placeholder={DEFAULT_OLLAMA_MODEL}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={runOllamaSummary}
                    disabled={aiLoading}
                  >
                    {aiLoading ? 'Asking Ollama…' : 'Generate AI summary'}
                  </button>
                </>
              ) : null}
            </div>

            {aiLoading ? (
              <Alert tone="info" role="status">
                Contacting local Ollama at 127.0.0.1:11434…
              </Alert>
            ) : null}

            {aiError ? (
              <Alert
                tone="error"
                role="alert"
                onDismiss={() => {
                  setAiError(null)
                  setAiHelp(null)
                }}
              >
                <p className="alert-stack">{aiError}</p>
                {aiHelp ? <p className="alert-stack field-hint">{aiHelp}</p> : null}
                <p className="alert-stack field-hint">
                  Showing the deterministic template review instead.
                </p>
              </Alert>
            ) : null}

            {aiSummary ? (
              <div className="ai-summary-block">
                <h3>AI summary (Ollama)</h3>
                <pre className="review-preview" tabIndex={0}>
                  {aiSummary}
                </pre>
              </div>
            ) : null}
          </section>

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

          <section className="section" aria-labelledby="evidence-heading">
            <h2 id="evidence-heading">Original evidence links</h2>
            {evidenceLinks.length === 0 ? (
              <p className="field-hint">
                No evidence URLs were saved for achievements in this period.
              </p>
            ) : (
              <ul className="evidence-list">
                {evidenceLinks.map((item) => (
                  <li key={item.id}>
                    <span className="label-strong">{item.title}:</span>{' '}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.url}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="section" aria-labelledby="summary-heading">
            <h2 id="summary-heading">Generated self-review (template)</h2>
            <pre className="review-preview" tabIndex={0}>
              {markdown}
            </pre>
          </section>
        </>
      ) : null}
    </div>
  )
}
