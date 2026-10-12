import type { Achievement, BackupEnvelope } from '../types/achievement'
import { BACKUP_SCHEMA_VERSION } from '../types/achievement'
import { normalizeAchievement } from './validation'

export const STORAGE_KEY = 'devlog.achievements.v1'

export type StorageStatus =
  | { available: true }
  | { available: false; reason: string }

export interface LoadResult {
  achievements: Achievement[]
  /** Entries that could not be recovered from stored JSON. */
  skippedCount: number
  warning?: string
  storage: StorageStatus
}

export interface SaveResult {
  ok: boolean
  error?: string
}

function probeStorage(): StorageStatus {
  try {
    const probe = '__devlog_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return { available: true }
  } catch {
    return {
      available: false,
      reason:
        'Browser storage is unavailable. Changes will not persist after refresh.',
    }
  }
}

/**
 * Load achievements from localStorage.
 * Malformed entries are skipped; recoverable data is kept.
 * Never silently discards an entire recoverable list.
 */
export function loadAchievements(): LoadResult {
  const storage = probeStorage()

  if (!storage.available) {
    return { achievements: [], skippedCount: 0, warning: storage.reason, storage }
  }

  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return {
      achievements: [],
      skippedCount: 0,
      warning: 'Could not read stored achievements.',
      storage: { available: false, reason: 'Could not read stored achievements.' },
    }
  }

  if (raw === null || raw === '') {
    return { achievements: [], skippedCount: 0, storage }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      achievements: [],
      skippedCount: 0,
      warning:
        'Stored data was corrupted and could not be parsed. Starting with an empty journal. Export a backup if you have one.',
      storage,
    }
  }

  if (!Array.isArray(parsed)) {
    // Accept a wrapped envelope if a user pasted export JSON into storage somehow
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as BackupEnvelope).achievements)
    ) {
      parsed = (parsed as BackupEnvelope).achievements
    } else {
      return {
        achievements: [],
        skippedCount: 0,
        warning: 'Stored data had an unexpected shape. Starting with an empty journal.',
        storage,
      }
    }
  }

  const achievements: Achievement[] = []
  let skippedCount = 0

  for (const item of parsed as unknown[]) {
    const normalized = normalizeAchievement(item)
    if (normalized) {
      achievements.push(normalized)
    } else {
      skippedCount += 1
    }
  }

  const warning =
    skippedCount > 0
      ? `Skipped ${skippedCount} unreadable entr${skippedCount === 1 ? 'y' : 'ies'}; recoverable achievements were kept.`
      : undefined

  return { achievements, skippedCount, warning, storage }
}

export function saveAchievements(achievements: Achievement[]): SaveResult {
  const storage = probeStorage()
  if (!storage.available) {
    return { ok: false, error: storage.reason }
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements))
    return { ok: true }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to write to browser storage.'
    return { ok: false, error: message }
  }
}

export function buildBackupEnvelope(
  achievements: Achievement[],
): BackupEnvelope {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    achievements,
  }
}

/** Assign new IDs when imported IDs collide with existing ones. */
export function resolveIdCollisions(
  incoming: Achievement[],
  existingIds: Set<string>,
): Achievement[] {
  const used = new Set(existingIds)
  return incoming.map((item) => {
    if (!used.has(item.id)) {
      used.add(item.id)
      return item
    }
    const next: Achievement = {
      ...item,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    }
    used.add(next.id)
    return next
  })
}

export function sortNewestFirst(achievements: Achievement[]): Achievement[] {
  return [...achievements].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.createdAt.localeCompare(a.createdAt)
  })
}
