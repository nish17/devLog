import { useState } from 'react'
import type { AchievementInput, AppView } from './types/achievement'
import { Layout } from './components/Layout'
import { Alert } from './components/Alert'
import { Dashboard } from './pages/Dashboard'
import { CapturePage } from './pages/CapturePage'
import { Journal } from './pages/Journal'
import { ReviewMode } from './pages/ReviewMode'
import { Backups } from './pages/Backups'
import { useAchievements } from './hooks/useAchievements'

function App() {
  const store = useAchievements()
  const [view, setView] = useState<AppView>('dashboard')
  const [editingId, setEditingId] = useState<string | null>(null)

  const navigate = (next: AppView) => {
    setEditingId(null)
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openCreate = () => {
    setEditingId(null)
    setView('create')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEdit = (id: string) => {
    setEditingId(id)
    setView('edit')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const editing = editingId ? store.getById(editingId) : undefined

  if (store.loading) {
    return (
      <div className="app-loading" role="status">
        Loading DevLog…
      </div>
    )
  }

  return (
    <Layout
      view={view}
      onNavigate={navigate}
      storageWarning={
        !store.storage.available ? store.storage.reason : null
      }
    >
      {store.warning && store.storage.available ? (
        <Alert tone="warning" role="status" onDismiss={store.clearWarning}>
          {store.warning}
        </Alert>
      ) : null}

      {view === 'dashboard' ? (
        <Dashboard
          totalCount={store.totalCount}
          yearCount={store.yearCount}
          recent={store.sorted.slice(0, 5)}
          onLog={openCreate}
          onOpenJournal={() => navigate('journal')}
          onEdit={openEdit}
        />
      ) : null}

      {view === 'create' ? (
        <CapturePage
          onSave={(input: AchievementInput) => store.create(input)}
          onCancel={() => navigate('dashboard')}
          onDone={() => navigate('journal')}
        />
      ) : null}

      {view === 'edit' ? (
        editing ? (
          <CapturePage
            initial={editing}
            onSave={(input: AchievementInput) =>
              store.update(editing.id, input)
            }
            onCancel={() => navigate('journal')}
            onDone={() => navigate('journal')}
          />
        ) : (
          <Alert tone="error" role="alert">
            That achievement could not be found.{' '}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('journal')}
            >
              Back to journal
            </button>
          </Alert>
        )
      ) : null}

      {view === 'journal' ? (
        <Journal
          achievements={store.sorted}
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={store.remove}
        />
      ) : null}

      {view === 'review' ? (
        <ReviewMode achievements={store.achievements} />
      ) : null}

      {view === 'backups' ? (
        <Backups
          achievements={store.achievements}
          onReplaceAll={store.replaceAll}
        />
      ) : null}
    </Layout>
  )
}

export default App
