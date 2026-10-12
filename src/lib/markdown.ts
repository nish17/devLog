import type { Achievement } from '../types/achievement'
import { formatDisplayDate } from './dates'

/** Escape characters that break Markdown structure in plain text. */
export function escapeMarkdown(text: string): string {
  return text.replace(/([\\`*_{}[\]()#+\-.!|>])/g, '\\$1')
}

export function truncateOneLine(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  if (flat.length <= max) return flat
  return `${flat.slice(0, max - 1)}…`
}

export function achievementToMarkdown(a: Achievement): string {
  const lines: string[] = []
  lines.push(`### ${escapeMarkdown(a.title)}`)
  lines.push('')
  lines.push(`- **Date:** ${formatDisplayDate(a.date)}`)
  lines.push(`- **Category:** ${a.category}`)
  lines.push(`- **Notes:** ${escapeMarkdown(a.notes)}`)
  if (a.impact) {
    lines.push(`- **Impact:** ${escapeMarkdown(a.impact)}`)
  }
  if (a.evidenceUrl) {
    lines.push(
      `- **Evidence:** [${escapeMarkdown(a.evidenceUrl)}](${a.evidenceUrl})`,
    )
  }
  lines.push('')
  return lines.join('\n')
}

export function journalToMarkdown(achievements: Achievement[]): string {
  const sorted = [...achievements].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.createdAt.localeCompare(a.createdAt)
  })

  const lines: string[] = []
  lines.push('# DevLog — Achievement journal')
  lines.push('')
  lines.push(`**Exported:** ${new Date().toISOString()}`)
  lines.push(`**Total achievements:** ${sorted.length}`)
  lines.push('')

  if (sorted.length === 0) {
    lines.push('_No achievements recorded yet._')
    lines.push('')
    return lines.join('\n')
  }

  for (const a of sorted) {
    lines.push(achievementToMarkdown(a))
  }

  return lines.join('\n')
}
