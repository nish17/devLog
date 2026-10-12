import type { Achievement } from '../types/achievement'
import { formatDisplayDate } from './dates'
import { escapeMarkdown } from './markdown'

/**
 * Characters that break Obsidian wikilinks when used in note titles.
 * Strip so exported headings stay vault- and link-friendly.
 */
export function sanitizeWikilinkTitle(title: string): string {
  return title
    .replace(/[[\]|#^\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function yamlEscape(value: string): string {
  if (/[:#{}[\],&*?|>!%@`'"\\]/.test(value) || value !== value.trim()) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }
  return value
}

function categoryToTag(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Single vault-friendly Obsidian Markdown file:
 * YAML frontmatter (title/date/tags) + one section per achievement.
 */
export function journalToObsidianMarkdown(achievements: Achievement[]): string {
  const sorted = [...achievements].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.createdAt.localeCompare(a.createdAt)
  })

  const exported = new Date().toISOString().slice(0, 10)
  const categoryTags = [
    ...new Set(sorted.map((a) => categoryToTag(a.category))),
  ]
  const tags = ['devlog', 'journal', ...categoryTags]

  const lines: string[] = []
  lines.push('---')
  lines.push('title: DevLog Achievement Journal')
  lines.push(`date: ${exported}`)
  lines.push(`tags: [${tags.map((t) => yamlEscape(t)).join(', ')}]`)
  lines.push(`achievement_count: ${sorted.length}`)
  lines.push('---')
  lines.push('')
  lines.push('# DevLog Achievement Journal')
  lines.push('')
  lines.push(
    `Exported ${exported}. ${sorted.length} achievement${sorted.length === 1 ? '' : 's'}.`,
  )
  lines.push('')

  if (sorted.length === 0) {
    lines.push('_No achievements recorded yet._')
    lines.push('')
    return lines.join('\n')
  }

  for (const a of sorted) {
    const safeTitle = sanitizeWikilinkTitle(a.title) || 'Untitled'
    const tag = categoryToTag(a.category)
    lines.push(`## ${escapeMarkdown(safeTitle)}`)
    lines.push('')
    lines.push(`- **Date:** ${formatDisplayDate(a.date)}`)
    lines.push(`- **Category:** ${a.category} \`#${tag}\``)
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
  }

  return lines.join('\n')
}

/** Obsidian-friendly review export wrapping the deterministic (or AI) body. */
export function reviewToObsidianMarkdown(
  period: { start: string; end: string },
  bodyMarkdown: string,
  achievementCount: number,
): string {
  const lines: string[] = []
  lines.push('---')
  lines.push('title: DevLog Self-Review')
  lines.push(`date: ${period.end}`)
  lines.push(`period_start: ${period.start}`)
  lines.push(`period_end: ${period.end}`)
  lines.push('tags: [devlog, review]')
  lines.push(`achievement_count: ${achievementCount}`)
  lines.push('---')
  lines.push('')
  lines.push(bodyMarkdown.trimEnd())
  lines.push('')
  return lines.join('\n')
}
