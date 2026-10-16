export type Status = 'todo' | 'doing' | 'done'
export type Priority = 'düşük' | 'orta' | 'yüksek'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  description: string
  status: Status
  order: number
  priority: Priority
  tags: string[]
  dueDate?: string // YYYY-MM-DD
  pageId?: string
  subtasks: Subtask[]
  createdAt: string
  completedAt?: string
}

export interface Page {
  id: string
  title: string
  icon: string
  parentId?: string
  // BlockNote document JSON; kept untyped so the store doesn't depend on the editor's schema types
  content: unknown[]
  favorite: boolean
  createdAt: string
  updatedAt: string
}

export interface Habit {
  id: string
  name: string
  icon: string
  color: string
  targetPerWeek: number
  log: Record<string, boolean>
  createdAt: string
}

export interface ActivityEvent {
  id: string
  type: 'task_done' | 'habit_done'
  date: string // YYYY-MM-DD
  refId: string
}

export const STATUSES: Status[] = ['todo', 'doing', 'done']

export const STATUS_LABEL: Record<Status, string> = {
  todo: 'Yapılacak',
  doing: 'Devam ediyor',
  done: 'Tamamlandı',
}

export const PRIORITIES: Priority[] = ['yüksek', 'orta', 'düşük']

export const PRIORITY_LABEL: Record<Priority, string> = {
  yüksek: 'Yüksek',
  orta: 'Orta',
  düşük: 'Düşük',
}
