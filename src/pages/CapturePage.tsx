import { useState } from 'react'
import type { Achievement, AchievementInput } from '../types/achievement'
import { AchievementForm } from '../components/AchievementForm'
import { Alert } from '../components/Alert'

interface CapturePageProps {
  initial?: Achievement
  onSave: (
    input: AchievementInput,
  ) => { ok: true } | { ok: false; error: string }
  onCancel: () => void
  onDone: () => void
}

export function CapturePage({
  initial,
  onSave,
  onCancel,
  onDone,
}: CapturePageProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const isEdit = Boolean(initial)

  const handleSubmit = (input: AchievementInput) => {
    if (submitting || success) return
    setSubmitting(true)
    setError(null)

    const result = onSave(input)
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setSuccess(true)
    window.setTimeout(() => {
      onDone()
    }, 700)
  }

  return (
    <div className="page capture-page">
      <header className="page-header">
        <h1>{isEdit ? 'Edit achievement' : 'Log an achievement'}</h1>
        <p className="page-subtitle">
          {isEdit
            ? 'Update the record. The original ID and created time are preserved.'
            : 'Keep it short and factual. You can add impact and evidence later.'}
        </p>
      </header>

      {error ? (
        <Alert tone="error" role="alert" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {success ? (
        <Alert tone="success" role="status">
          {isEdit ? 'Changes saved.' : 'Achievement saved.'}
        </Alert>
      ) : (
        <AchievementForm
          initial={initial}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={onCancel}
        />
      )}
    </div>
  )
}
