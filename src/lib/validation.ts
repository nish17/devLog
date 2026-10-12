import {
  ACHIEVEMENT_CATEGORIES,
  type Achievement,
  type AchievementCategory,
  type AchievementInput,
  type BackupEnvelope,
  BACKUP_SCHEMA_VERSION,
} from '../types/achievement'
import { isValidISODate, isValidISOTimestamp } from './dates'

export interface FieldErrors {
  title?: string
  notes?: string
  category?: string
  date?: string
  impact?: string
  evidenceUrl?: string
}

export function isAchievementCategory(
  value: unknown,
): value is AchievementCategory {
  return (
    typeof value === 'string' &&
    (ACHIEVEMENT_CATEGORIES as readonly string[]).includes(value)
  )
}

export function validateAchievementInput(
  input: Partial<AchievementInput>,
): FieldErrors {
  const errors: FieldErrors = {}

  if (!input.title || input.title.trim() === '') {
    errors.title = 'Title is required.'
  }

  if (!input.notes || input.notes.trim() === '') {
    errors.notes = 'Notes are required.'
  }

  if (!input.category) {
    errors.category = 'Category is required.'
  } else if (!isAchievementCategory(input.category)) {
    errors.category = 'Choose a valid category.'
  }

  if (!input.date || input.date.trim() === '') {
    errors.date = 'Date is required.'
  } else if (!isValidISODate(input.date)) {
    errors.date = 'Enter a valid date.'
  }

  if (input.evidenceUrl && input.evidenceUrl.trim() !== '') {
    try {
      const url = new URL(input.evidenceUrl.trim())
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.evidenceUrl = 'Evidence URL must start with http:// or https://.'
      }
    } catch {
      errors.evidenceUrl = 'Enter a valid URL.'
    }
  }

  return errors
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

/**
 * Normalize a single achievement from storage or import.
 * Returns null only when the record is unrecoverable.
 */
export function normalizeAchievement(raw: unknown): Achievement | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const title = typeof obj.title === 'string' ? obj.title.trim() : ''
  const notes = typeof obj.notes === 'string' ? obj.notes.trim() : ''
  if (!title || !notes) return null

  if (!isAchievementCategory(obj.category)) return null

  const date =
    typeof obj.date === 'string' && isValidISODate(obj.date.trim())
      ? obj.date.trim()
      : null
  if (!date) return null

  const now = new Date().toISOString()
  const id =
    typeof obj.id === 'string' && obj.id.trim() !== ''
      ? obj.id.trim()
      : crypto.randomUUID()

  const createdAt =
    typeof obj.createdAt === 'string' && isValidISOTimestamp(obj.createdAt)
      ? obj.createdAt
      : now
  const updatedAt =
    typeof obj.updatedAt === 'string' && isValidISOTimestamp(obj.updatedAt)
      ? obj.updatedAt
      : createdAt

  const impact = optionalString(obj.impact)
  const evidenceUrl = optionalString(obj.evidenceUrl)

  const achievement: Achievement = {
    id,
    title,
    notes,
    category: obj.category,
    date,
    createdAt,
    updatedAt,
  }

  if (impact) achievement.impact = impact
  if (evidenceUrl) achievement.evidenceUrl = evidenceUrl

  return achievement
}

export interface ParseBackupResult {
  ok: true
  envelope: BackupEnvelope
  achievements: Achievement[]
  recoveredCount: number
  skippedCount: number
}

export interface ParseBackupError {
  ok: false
  message: string
}

/**
 * Validate a backup JSON payload before mutating storage.
 * Recoverable entries are kept; unrecoverable ones are counted as skipped.
 * Entire payload is rejected when the envelope is invalid or nothing is recoverable.
 */
export function parseBackupPayload(
  raw: unknown,
): ParseBackupResult | ParseBackupError {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ok: false,
      message: 'Backup must be a JSON object with schemaVersion and achievements.',
    }
  }

  const obj = raw as Record<string, unknown>

  if (typeof obj.schemaVersion !== 'number' || !Number.isFinite(obj.schemaVersion)) {
    return {
      ok: false,
      message: 'Backup is missing a numeric schemaVersion.',
    }
  }

  if (obj.schemaVersion > BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      message: `Unsupported schema version ${obj.schemaVersion}. This app supports up to ${BACKUP_SCHEMA_VERSION}.`,
    }
  }

  if (!Array.isArray(obj.achievements)) {
    return {
      ok: false,
      message: 'Backup must include an achievements array.',
    }
  }

  const achievements: Achievement[] = []
  let skippedCount = 0

  for (const item of obj.achievements) {
    const normalized = normalizeAchievement(item)
    if (normalized) {
      achievements.push(normalized)
    } else {
      skippedCount += 1
    }
  }

  if (obj.achievements.length > 0 && achievements.length === 0) {
    return {
      ok: false,
      message: 'No valid achievements found in backup. Existing data was not changed.',
    }
  }

  const exportedAt =
    typeof obj.exportedAt === 'string' && isValidISOTimestamp(obj.exportedAt)
      ? obj.exportedAt
      : new Date().toISOString()

  return {
    ok: true,
    envelope: {
      schemaVersion: obj.schemaVersion,
      exportedAt,
      achievements,
    },
    achievements,
    recoveredCount: achievements.length,
    skippedCount,
  }
}
