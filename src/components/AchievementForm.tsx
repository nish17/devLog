import { useId, useState, type FormEvent } from 'react'
import {
  ACHIEVEMENT_CATEGORIES,
  type Achievement,
  type AchievementCategory,
  type AchievementInput,
} from '../types/achievement'
import { todayISODate } from '../lib/dates'
import {
  hasFieldErrors,
  validateAchievementInput,
  type FieldErrors,
} from '../lib/validation'
import { Alert } from './Alert'

interface AchievementFormProps {
  initial?: Achievement
  submitting?: boolean
  onSubmit: (input: AchievementInput) => void
  onCancel: () => void
}

function toInput(initial?: Achievement): AchievementInput {
  return {
    title: initial?.title ?? '',
    notes: initial?.notes ?? '',
    category: initial?.category ?? ACHIEVEMENT_CATEGORIES[0],
    date: initial?.date ?? todayISODate(),
    impact: initial?.impact ?? '',
    evidenceUrl: initial?.evidenceUrl ?? '',
  }
}

export function AchievementForm({
  initial,
  submitting = false,
  onSubmit,
  onCancel,
}: AchievementFormProps) {
  const formId = useId()
  const [values, setValues] = useState<AchievementInput>(() => toInput(initial))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [attempted, setAttempted] = useState(false)
  const isEdit = Boolean(initial)

  const setField = <K extends keyof AchievementInput>(
    key: K,
    value: AchievementInput[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    if (attempted) {
      setErrors(
        validateAchievementInput({
          ...values,
          [key]: value,
        }),
      )
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return

    const nextErrors = validateAchievementInput(values)
    setAttempted(true)
    setErrors(nextErrors)
    if (hasFieldErrors(nextErrors)) return

    onSubmit({
      title: values.title.trim(),
      notes: values.notes.trim(),
      category: values.category,
      date: values.date,
      impact: values.impact?.trim() || undefined,
      evidenceUrl: values.evidenceUrl?.trim() || undefined,
    })
  }

  return (
    <form className="achievement-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor={`${formId}-title`}>
          Title <span className="req">required</span>
        </label>
        <input
          id={`${formId}-title`}
          type="text"
          value={values.title}
          onChange={(e) => setField('title', e.target.value)}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? `${formId}-title-error` : undefined}
          autoComplete="off"
          maxLength={200}
        />
        {errors.title ? (
          <p id={`${formId}-title-error`} className="field-error" role="alert">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor={`${formId}-notes`}>
          Notes <span className="req">required</span>
        </label>
        <textarea
          id={`${formId}-notes`}
          value={values.notes}
          onChange={(e) => setField('notes', e.target.value)}
          rows={5}
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={
            errors.notes ? `${formId}-notes-error` : `${formId}-notes-hint`
          }
        />
        <p id={`${formId}-notes-hint`} className="field-hint">
          What happened, in your own words. Keep it factual.
        </p>
        {errors.notes ? (
          <p id={`${formId}-notes-error`} className="field-error" role="alert">
            {errors.notes}
          </p>
        ) : null}
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor={`${formId}-category`}>
            Category <span className="req">required</span>
          </label>
          <select
            id={`${formId}-category`}
            value={values.category}
            onChange={(e) =>
              setField('category', e.target.value as AchievementCategory)
            }
            aria-invalid={Boolean(errors.category)}
            aria-describedby={
              errors.category ? `${formId}-category-error` : undefined
            }
          >
            {ACHIEVEMENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category ? (
            <p
              id={`${formId}-category-error`}
              className="field-error"
              role="alert"
            >
              {errors.category}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor={`${formId}-date`}>
            Date <span className="req">required</span>
          </label>
          <input
            id={`${formId}-date`}
            type="date"
            value={values.date}
            onChange={(e) => setField('date', e.target.value)}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? `${formId}-date-error` : undefined}
          />
          {errors.date ? (
            <p id={`${formId}-date-error`} className="field-error" role="alert">
              {errors.date}
            </p>
          ) : null}
        </div>
      </div>

      <div className="form-field">
        <label htmlFor={`${formId}-impact`}>
          Impact <span className="opt">optional</span>
        </label>
        <textarea
          id={`${formId}-impact`}
          value={values.impact ?? ''}
          onChange={(e) => setField('impact', e.target.value)}
          rows={3}
          aria-describedby={`${formId}-impact-hint`}
        />
        <p id={`${formId}-impact-hint`} className="field-hint">
          Only include outcomes you can support. Leave blank if unsure.
        </p>
      </div>

      <div className="form-field">
        <label htmlFor={`${formId}-evidence`}>
          Evidence URL <span className="opt">optional</span>
        </label>
        <input
          id={`${formId}-evidence`}
          type="url"
          value={values.evidenceUrl ?? ''}
          onChange={(e) => setField('evidenceUrl', e.target.value)}
          placeholder="https://"
          aria-invalid={Boolean(errors.evidenceUrl)}
          aria-describedby={
            errors.evidenceUrl
              ? `${formId}-evidence-error`
              : `${formId}-evidence-hint`
          }
        />
        <p id={`${formId}-evidence-hint`} className="field-hint">
          Link to a PR, doc, ticket, or other artifact.
        </p>
        {errors.evidenceUrl ? (
          <p
            id={`${formId}-evidence-error`}
            className="field-error"
            role="alert"
          >
            {errors.evidenceUrl}
          </p>
        ) : null}
      </div>

      {attempted && hasFieldErrors(errors) ? (
        <Alert tone="error" role="alert">
          Fix the highlighted fields before saving.
        </Alert>
      ) : null}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting
            ? 'Saving…'
            : isEdit
              ? 'Save changes'
              : 'Save achievement'}
        </button>
      </div>
    </form>
  )
}
