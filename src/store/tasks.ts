import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dataStorage } from '../lib/storage'
import type { Status, Task } from '../types'
import { uid } from '../lib/id'
import { dayKey, todayKey } from '../lib/dates'
import { useActivity } from './activity'

interface TasksState {
  tasks: Task[]
  addTask: (input: Partial<Task> & { title: string }) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  setStatus: (id: string, status: Status) => void
  /** Writes the order and status of every id in each given column, as produced by a drag. */
  commitColumns: (columns: Partial<Record<Status, string[]>>) => void
}

/** Applies the side effects of entering or leaving "done": completion time and progress history. */
function withStatus(task: Task, status: Status): Task {
  if (task.status === status) return task
  if (status === 'done') {
    useActivity.getState().add('task_done', task.id, todayKey())
    return { ...task, status, completedAt: new Date().toISOString() }
  }
  if (task.status === 'done') {
    useActivity.getState().remove('task_done', task.id, task.completedAt ? dayKey(new Date(task.completedAt)) : undefined)
  }
  return { ...task, status, completedAt: undefined }
}

const nextOrder = (tasks: Task[], status: Status) =>
  Math.max(-1, ...tasks.filter((t) => t.status === status).map((t) => t.order)) + 1

export const useTasks = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],
      addTask: (input) => {
        const status = input.status ?? 'todo'
        const task: Task = {
          id: uid(),
          description: '',
          priority: 'orta',
          tags: [],
          subtasks: [],
          createdAt: new Date().toISOString(),
          ...input,
          status,
          order: nextOrder(get().tasks, status),
          title: input.title.trim(),
        }
        if (status === 'done') {
          task.completedAt = new Date().toISOString()
          useActivity.getState().add('task_done', task.id, todayKey())
        }
        set((s) => ({ tasks: [...s.tasks, task] }))
        return task
      },
      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== id) return t
            const { status, ...rest } = patch
            const next = { ...t, ...rest }
            return status ? withStatus(next, status) : next
          }),
        })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      setStatus: (id, status) => {
        const order = nextOrder(get().tasks, status)
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id && t.status !== status ? { ...withStatus(t, status), order } : t)),
        }))
      },
      commitColumns: (columns) =>
        set((s) => {
          const placement = new Map<string, { status: Status; order: number }>()
          for (const [status, ids] of Object.entries(columns) as [Status, string[]][]) {
            ids.forEach((id, order) => placement.set(id, { status, order }))
          }
          return {
            tasks: s.tasks.map((t) => {
              const p = placement.get(t.id)
              if (!p) return t
              return { ...withStatus(t, p.status), order: p.order }
            }),
          }
        }),
    }),
    { name: 'akis-tasks', storage: dataStorage },
  ),
)

export const byOrder = (a: Task, b: Task) => a.order - b.order
