import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dataStorage } from '../lib/storage'
import type { ActivityEvent } from '../types'
import { uid } from '../lib/id'

interface ActivityState {
  events: ActivityEvent[]
  add: (type: ActivityEvent['type'], refId: string, date: string) => void
  remove: (type: ActivityEvent['type'], refId: string, date?: string) => void
}

// Completion history lives apart from tasks so that deleting a finished task keeps the progress it earned.
export const useActivity = create<ActivityState>()(
  persist(
    (set) => ({
      events: [],
      add: (type, refId, date) => set((s) => ({ events: [...s.events, { id: uid(), type, refId, date }] })),
      remove: (type, refId, date) =>
        set((s) => {
          const idx = s.events.findLastIndex((e) => e.type === type && e.refId === refId && (!date || e.date === date))
          if (idx === -1) return s
          return { events: s.events.filter((_, i) => i !== idx) }
        }),
    }),
    { name: 'akis-activity', storage: dataStorage },
  ),
)
