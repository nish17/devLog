export const ACHIEVEMENT_CATEGORIES = [
  'Technical Contribution',
  'Business Impact',
  'Collaboration',
  'Leadership',
  'Learning & Initiative',
] as const

export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number]

export interface Achievement {
  id: string
  title: string
  notes: string
  category: AchievementCategory
  date: string
  impact?: string
  evidenceUrl?: string
  createdAt: string
  updatedAt: string
}

export interface AchievementInput {
  title: string
  notes: string
  category: AchievementCategory
  date: string
  impact?: string
  evidenceUrl?: string
}

export const BACKUP_SCHEMA_VERSION = 1

export interface BackupEnvelope {
  schemaVersion: number
  exportedAt: string
  achievements: Achievement[]
}

export type AppView =
  | 'dashboard'
  | 'journal'
  | 'review'
  | 'backups'
  | 'create'
  | 'edit'
