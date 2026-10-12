import type { Achievement, AchievementCategory } from '../types/achievement'
import { ACHIEVEMENT_CATEGORIES } from '../types/achievement'
import { formatDisplayDate, isDateInRange } from './dates'
import { escapeMarkdown, truncateOneLine } from './markdown'

export interface ReviewPeriod {
  start: string
  end: string
}

export function filterByPeriod(
  achievements: Achievement[],
  period: ReviewPeriod,
): Achievement[] {
  return achievements
    .filter((a) => isDateInRange(a.date, period.start, period.end))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.createdAt.localeCompare(b.createdAt)
    })
}

function groupByCategory(
  achievements: Achievement[],
): Map<AchievementCategory, Achievement[]> {
  const map = new Map<AchievementCategory, Achievement[]>()
  for (const cat of ACHIEVEMENT_CATEGORIES) {
    map.set(cat, [])
  }
  for (const a of achievements) {
    const list = map.get(a.category)
    if (list) list.push(a)
    else map.set(a.category, [a])
  }
  return map
}

/**
 * Deterministic self-review from saved data only.
 * Never invents metrics, outcomes, or narrative beyond what was recorded.
 */
export function generateReviewMarkdown(
  achievements: Achievement[],
  period: ReviewPeriod,
): string {
  const inPeriod = filterByPeriod(achievements, period)
  const lines: string[] = []

  lines.push('# Self-review summary')
  lines.push('')
  lines.push(
    `**Period:** ${formatDisplayDate(period.start)} – ${formatDisplayDate(period.end)}`,
  )
  lines.push(`**Achievements in period:** ${inPeriod.length}`)
  lines.push('')

  if (inPeriod.length === 0) {
    lines.push('_No achievements recorded in this period._')
    lines.push('')
    return lines.join('\n')
  }

  const grouped = groupByCategory(inPeriod)

  lines.push('## Achievements by category')
  lines.push('')

  for (const category of ACHIEVEMENT_CATEGORIES) {
    const items = grouped.get(category) ?? []
    if (items.length === 0) continue

    lines.push(`### ${category} (${items.length})`)
    lines.push('')

    for (const item of items) {
      lines.push(`#### ${escapeMarkdown(item.title)}`)
      lines.push('')
      lines.push(`- **Date:** ${formatDisplayDate(item.date)}`)
      lines.push(`- **Notes:** ${escapeMarkdown(item.notes)}`)
      if (item.impact) {
        lines.push(`- **Impact:** ${escapeMarkdown(item.impact)}`)
      }
      if (item.evidenceUrl) {
        lines.push(
          `- **Evidence:** [${escapeMarkdown(item.evidenceUrl)}](${item.evidenceUrl})`,
        )
      }
      lines.push('')
    }
  }

  lines.push('## Contribution summary')
  lines.push('')
  lines.push(
    `During this period, ${inPeriod.length} achievement${inPeriod.length === 1 ? ' was' : 's were'} recorded across the following categories:`,
  )
  lines.push('')

  for (const category of ACHIEVEMENT_CATEGORIES) {
    const items = grouped.get(category) ?? []
    if (items.length === 0) continue
    const titles = items
      .map((a) => truncateOneLine(a.title, 80))
      .map((t) => escapeMarkdown(t))
      .join('; ')
    lines.push(`- **${category}** (${items.length}): ${titles}`)
  }

  lines.push('')
  lines.push(
    '_This summary uses only titles, notes, impact, and evidence you saved. No additional outcomes were inferred._',
  )
  lines.push('')

  return lines.join('\n')
}
