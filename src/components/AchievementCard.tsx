import type { Achievement } from '../types/achievement'
import { formatDisplayDate } from '../lib/dates'

interface AchievementCardProps {
  achievement: Achievement
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

export function AchievementCard({
  achievement,
  onEdit,
  onDelete,
  compact = false,
}: AchievementCardProps) {
  return (
    <article className={compact ? 'achievement-card is-compact' : 'achievement-card'}>
      <header className="achievement-card-header">
        <div>
          <h3 className="achievement-title">{achievement.title}</h3>
          <p className="achievement-meta">
            <time dateTime={achievement.date}>
              {formatDisplayDate(achievement.date)}
            </time>
            <span aria-hidden="true"> · </span>
            <span className="category-badge">{achievement.category}</span>
          </p>
        </div>
        {(onEdit || onDelete) && (
          <div className="achievement-actions">
            {onEdit ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onEdit(achievement.id)}
              >
                Edit
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onDelete(achievement.id)}
              >
                Delete
              </button>
            ) : null}
          </div>
        )}
      </header>

      <p className="achievement-notes">{achievement.notes}</p>

      {achievement.impact ? (
        <p className="achievement-impact">
          <span className="label-strong">Impact:</span> {achievement.impact}
        </p>
      ) : null}

      {achievement.evidenceUrl ? (
        <p className="achievement-evidence">
          <span className="label-strong">Evidence:</span>{' '}
          <a
            href={achievement.evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {achievement.evidenceUrl}
          </a>
        </p>
      ) : null}
    </article>
  )
}
