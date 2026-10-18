// One-time move of data saved in this browser (from before the database) into a workspace.
import { useActivity } from '../../store/activity'
import { useHabits } from '../../store/habits'
import { usePages } from '../../store/pages'
import { useTasks } from '../../store/tasks'
import type { ActivityEvent, Habit, Page, Task } from '../../types'

const DONE_FLAG = 'akis-local-imported'

function read<T>(key: string, field: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    const list = raw ? JSON.parse(raw)?.state?.[field] : undefined
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function localData() {
  return {
    tasks: read<Task>('akis-tasks', 'tasks'),
    pages: read<Page>('akis-pages', 'pages'),
    habits: read<Habit>('akis-habits', 'habits'),
    events: read<ActivityEvent>('akis-activity', 'events'),
  }
}

export function importDecided() {
  try {
    return localStorage.getItem(DONE_FLAG) !== null
  } catch {
    return true
  }
}

export function markImportDecided() {
  try {
    localStorage.setItem(DONE_FLAG, new Date().toISOString())
  } catch {
    /* storage unavailable */
  }
}

/**
 * Adds the local data to the open workspace; the sync layer uploads it like any other edit.
 * Local copies stay in place as a fallback.
 */
export function importLocal() {
  const data = localData()
  const merge = <T extends { id: string }>(current: T[], incoming: T[]) => {
    const ids = new Set(current.map((i) => i.id))
    return [...current, ...incoming.filter((i) => !ids.has(i.id))]
  }
  useTasks.setState((s) => ({ tasks: merge(s.tasks, data.tasks) }))
  usePages.setState((s) => ({ pages: merge(s.pages, data.pages) }))
  useHabits.setState((s) => ({ habits: merge(s.habits, data.habits) }))
  useActivity.setState((s) => ({ events: merge(s.events, data.events) }))
  markImportDecided()
}
