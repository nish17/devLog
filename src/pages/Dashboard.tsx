import type { Achievement } from '../types/achievement'
import { AchievementCard } from '../components/AchievementCard'
import { EmptyState } from '../components/EmptyState'
import { currentYear } from '../lib/dates'

interface DashboardProps {
  totalCount: number
  yearCount: number
  recent: Achievement[]
  onLog: () => void
  onOpenJournal: () => void
  onEdit: (id: string) => void
}

export function Dashboard({
  totalCount,
  yearCount,
  recent,
  onLog,
  onOpenJournal,
  onEdit,
}: DashboardProps) {
  const year = currentYear()

  return (
    <div className="page dashboard-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Personal engineering journal</p>
          <h1>DevLog</h1>
          <p className="lead">Your wins, remembered.</p>
          <p className="hero-support">
            Capture achievements in under 30 seconds. Keep the original notes and
            evidence ready for reviews—no invented metrics.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={onLog}>
              Log an achievement
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={onOpenJournal}
            >
              Open journal
            </button>
          </div>
        </div>

        <div className="stat-panel" aria-label="Achievement counts">
          <div className="stat">
            <p className="stat-value">{totalCount}</p>
            <p className="stat-label">Total achievements</p>
          </div>
          <div className="stat">
            <p className="stat-value">{yearCount}</p>
            <p className="stat-label">{year} so far</p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="recent-heading">
        <div className="section-header">
          <h2 id="recent-heading">Recent achievements</h2>
          {totalCount > 0 ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onOpenJournal}
            >
              View all
            </button>
          ) : null}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No achievements yet"
            description="Log your first win—title, notes, category, and date are enough."
            actionLabel="Log an achievement"
            onAction={onLog}
          />
        ) : (
          <ul className="achievement-list">
            {recent.map((a) => (
              <li key={a.id}>
                <AchievementCard
                  achievement={a}
                  onEdit={onEdit}
                  compact
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
