import { useRef, useState } from 'react'
import type { Achievement } from '../types/achievement'
import { Alert } from '../components/Alert'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { buildBackupEnvelope } from '../lib/storage'
import { parseBackupPayload } from '../lib/validation'
import { journalToMarkdown } from '../lib/markdown'
import { downloadTextFile, stampFilename } from '../lib/download'

interface BackupsProps {
  achievements: Achievement[]
  onReplaceAll: (
    incoming: Achievement[],
  ) => { ok: true; count: number } | { ok: false; error: string }
}

export function Backups({ achievements, onReplaceAll }: BackupsProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{
    tone: 'success' | 'error' | 'info'
    text: string
  } | null>(null)
  const [pendingImport, setPendingImport] = useState<Achievement[] | null>(null)
  const [importMeta, setImportMeta] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const exportJson = () => {
    setBusy(true)
    try {
      const envelope = buildBackupEnvelope(achievements)
      downloadTextFile(
        stampFilename('devlog-backup', 'json'),
        JSON.stringify(envelope, null, 2),
        'application/json;charset=utf-8',
      )
      setMessage({
        tone: 'success',
        text: `Exported ${achievements.length} achievement${achievements.length === 1 ? '' : 's'} as JSON.`,
      })
    } catch {
      setMessage({ tone: 'error', text: 'Could not export JSON backup.' })
    } finally {
      setBusy(false)
    }
  }

  const exportMarkdown = () => {
    setBusy(true)
    try {
      const md = journalToMarkdown(achievements)
      downloadTextFile(
        stampFilename('devlog-journal', 'md'),
        md,
        'text/markdown;charset=utf-8',
      )
      setMessage({
        tone: 'success',
        text: `Exported ${achievements.length} achievement${achievements.length === 1 ? '' : 's'} as Markdown.`,
      })
    } catch {
      setMessage({ tone: 'error', text: 'Could not export Markdown journal.' })
    } finally {
      setBusy(false)
    }
  }

  const onFileChosen = async (file: File | null) => {
    if (!file) return
    setMessage(null)
    setBusy(true)

    let text: string
    try {
      text = await file.text()
    } catch {
      setBusy(false)
      setMessage({
        tone: 'error',
        text: 'Could not read the selected file. Existing data was not changed.',
      })
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      setBusy(false)
      setMessage({
        tone: 'error',
        text: 'File is not valid JSON. Existing data was not changed.',
      })
      return
    }

    const result = parseBackupPayload(parsed)
    setBusy(false)

    if (!result.ok) {
      setMessage({ tone: 'error', text: result.message })
      return
    }

    const metaParts = [
      `${result.recoveredCount} valid achievement${result.recoveredCount === 1 ? '' : 's'}`,
    ]
    if (result.skippedCount > 0) {
      metaParts.push(
        `${result.skippedCount} skipped as unreadable`,
      )
    }

    setImportMeta(metaParts.join('; '))
    setPendingImport(result.achievements)
  }

  const confirmImport = () => {
    if (!pendingImport || busy) return
    setBusy(true)
    const result = onReplaceAll(pendingImport)
    setBusy(false)
    setPendingImport(null)
    setImportMeta(null)

    if (!result.ok) {
      setMessage({
        tone: 'error',
        text: `${result.error} Existing data was not changed.`,
      })
      return
    }

    setMessage({
      tone: 'success',
      text: `Import complete. Journal now has ${result.count} achievement${result.count === 1 ? '' : 's'}.`,
    })
    if (fileRef.current) fileRef.current.value = ''
  }

  const cancelImport = () => {
    setPendingImport(null)
    setImportMeta(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="page backups-page">
      <header className="page-header">
        <h1>Backups</h1>
        <p className="page-subtitle">
          Export and import versioned JSON backups. Invalid imports never overwrite
          your journal.
        </p>
      </header>

      {message ? (
        <Alert
          tone={message.tone}
          role={message.tone === 'error' ? 'alert' : 'status'}
          onDismiss={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      ) : null}

      <section className="panel" aria-labelledby="export-heading">
        <h2 id="export-heading">Export</h2>
        <p>
          Current journal size:{' '}
          <strong>
            {achievements.length} achievement
            {achievements.length === 1 ? '' : 's'}
          </strong>
          .
        </p>
        <div className="button-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={exportJson}
            disabled={busy}
          >
            Download JSON backup
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={exportMarkdown}
            disabled={busy}
          >
            Download Markdown journal
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="import-heading">
        <h2 id="import-heading">Import JSON backup</h2>
        <p>
          Imports replace the current journal after confirmation. Every achievement
          is validated first. On failure, existing data is preserved.
        </p>
        <div className="form-field">
          <label htmlFor="backup-file">Choose backup file</label>
          <input
            ref={fileRef}
            id="backup-file"
            type="file"
            accept="application/json,.json"
            disabled={busy}
            onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
          />
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingImport)}
        title="Replace journal with backup?"
        message={
          importMeta
            ? `This will replace all achievements currently stored in this browser with the backup (${importMeta}). Continue?`
            : 'This will replace all achievements currently stored in this browser. Continue?'
        }
        confirmLabel="Replace journal"
        danger
        busy={busy}
        onConfirm={confirmImport}
        onCancel={cancelImport}
      />
    </div>
  )
}
