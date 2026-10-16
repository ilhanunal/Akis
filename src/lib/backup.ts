// Platform-independent backup logic: plain objects in, plain objects out.
// Web-only file handling lives in backupWeb.ts so a mobile build can reuse this file as is.
import { useActivity } from '../store/activity'
import { useHabits } from '../store/habits'
import { usePages } from '../store/pages'
import { useSettings, type Theme } from '../store/settings'
import { useTasks } from '../store/tasks'

const VERSION = 1

export function serializeData() {
  return {
    app: 'akis',
    version: VERSION,
    exportedAt: new Date().toISOString(),
    tasks: useTasks.getState().tasks,
    pages: usePages.getState().pages,
    habits: useHabits.getState().habits,
    events: useActivity.getState().events,
    settings: { name: useSettings.getState().name, theme: useSettings.getState().theme },
  }
}

/** Replaces all data with a backup. Throws a user-facing message if it isn't an Akış backup. */
export function restoreData(data: unknown) {
  const d = data as Record<string, unknown> | null
  if (!d || d.app !== 'akis' || !Array.isArray(d.tasks) || !Array.isArray(d.pages)) {
    throw new Error('Bu dosya bir Akış yedeği değil.')
  }
  useTasks.setState({ tasks: d.tasks })
  usePages.setState({ pages: d.pages })
  useHabits.setState({ habits: Array.isArray(d.habits) ? d.habits : [] })
  useActivity.setState({ events: Array.isArray(d.events) ? d.events : [] })
  const settings = d.settings as { name?: string; theme?: Theme } | undefined
  if (settings) useSettings.setState({ name: settings.name ?? '', theme: settings.theme ?? 'system' })
  useSettings.setState({ seeded: true })
}

export function resetData() {
  useTasks.setState({ tasks: [] })
  usePages.setState({ pages: [] })
  useHabits.setState({ habits: [] })
  useActivity.setState({ events: [] })
  // Stay seeded so a reset gives an empty workspace rather than the sample data again.
  useSettings.setState({ seeded: true })
}
