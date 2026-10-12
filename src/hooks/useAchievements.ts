import { useCallback, useMemo, useState } from 'react'
import type { Achievement, AchievementInput } from '../types/achievement'
import {
  loadAchievements,
  resolveIdCollisions,
  saveAchievements,
  sortNewestFirst,
  type StorageStatus,
} from '../lib/storage'
import { currentYear } from '../lib/dates'

export interface UseAchievementsResult {
  achievements: Achievement[]
  sorted: Achievement[]
  loading: boolean
  storage: StorageStatus
  warning: string | null
  clearWarning: () => void
  totalCount: number
  yearCount: number
  create: (
    input: AchievementInput,
  ) => { ok: true; achievement: Achievement } | { ok: false; error: string }
  update: (
    id: string,
    input: AchievementInput,
  ) => { ok: true; achievement: Achievement } | { ok: false; error: string }
  remove: (id: string) => { ok: true } | { ok: false; error: string }
  replaceAll: (
    incoming: Achievement[],
  ) => { ok: true; count: number } | { ok: false; error: string }
  getById: (id: string) => Achievement | undefined
}

function readInitial() {
  return loadAchievements()
}

export function useAchievements(): UseAchievementsResult {
  const [initial] = useState(readInitial)
  const [achievements, setAchievements] = useState<Achievement[]>(
    () => initial.achievements,
  )
  const [storage, setStorage] = useState<StorageStatus>(() => initial.storage)
  const [warning, setWarning] = useState<string | null>(
    () => initial.warning ?? null,
  )

  const persist = useCallback((next: Achievement[]) => {
    const result = saveAchievements(next)
    if (!result.ok) {
      setStorage({
        available: false,
        reason: result.error ?? 'Storage write failed.',
      })
      return result
    }
    setStorage({ available: true })
    return result
  }, [])

  const sorted = useMemo(() => sortNewestFirst(achievements), [achievements])

  const year = currentYear()
  const yearCount = useMemo(
    () => achievements.filter((a) => a.date.startsWith(String(year))).length,
    [achievements, year],
  )

  const create = useCallback(
    (input: AchievementInput) => {
      const now = new Date().toISOString()
      const achievement: Achievement = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        notes: input.notes.trim(),
        category: input.category,
        date: input.date,
        createdAt: now,
        updatedAt: now,
      }
      if (input.impact?.trim()) achievement.impact = input.impact.trim()
      if (input.evidenceUrl?.trim()) {
        achievement.evidenceUrl = input.evidenceUrl.trim()
      }

      const next = [...achievements, achievement]
      const result = persist(next)
      if (!result.ok) {
        return { ok: false as const, error: result.error ?? 'Failed to save.' }
      }
      setAchievements(next)
      return { ok: true as const, achievement }
    },
    [achievements, persist],
  )

  const update = useCallback(
    (id: string, input: AchievementInput) => {
      const existing = achievements.find((a) => a.id === id)
      if (!existing) {
        return { ok: false as const, error: 'Achievement not found.' }
      }

      const updated: Achievement = {
        ...existing,
        title: input.title.trim(),
        notes: input.notes.trim(),
        category: input.category,
        date: input.date,
        updatedAt: new Date().toISOString(),
      }

      if (input.impact?.trim()) updated.impact = input.impact.trim()
      else delete updated.impact

      if (input.evidenceUrl?.trim()) {
        updated.evidenceUrl = input.evidenceUrl.trim()
      } else {
        delete updated.evidenceUrl
      }

      const next = achievements.map((a) => (a.id === id ? updated : a))
      const result = persist(next)
      if (!result.ok) {
        return { ok: false as const, error: result.error ?? 'Failed to save.' }
      }
      setAchievements(next)
      return { ok: true as const, achievement: updated }
    },
    [achievements, persist],
  )

  const remove = useCallback(
    (id: string) => {
      const next = achievements.filter((a) => a.id !== id)
      const result = persist(next)
      if (!result.ok) {
        return { ok: false as const, error: result.error ?? 'Failed to delete.' }
      }
      setAchievements(next)
      return { ok: true as const }
    },
    [achievements, persist],
  )

  const replaceAll = useCallback(
    (incoming: Achievement[]) => {
      const withUniqueIds = resolveIdCollisions(incoming, new Set())
      const result = persist(withUniqueIds)
      if (!result.ok) {
        return { ok: false as const, error: result.error ?? 'Failed to import.' }
      }
      setAchievements(withUniqueIds)
      return { ok: true as const, count: withUniqueIds.length }
    },
    [persist],
  )

  const getById = useCallback(
    (id: string) => achievements.find((a) => a.id === id),
    [achievements],
  )

  return {
    achievements,
    sorted,
    loading: false,
    storage,
    warning,
    clearWarning: () => setWarning(null),
    totalCount: achievements.length,
    yearCount,
    create,
    update,
    remove,
    replaceAll,
    getById,
  }
}
