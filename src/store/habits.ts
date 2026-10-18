import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dataStorage } from '../lib/storage'
import type { Habit } from '../types'
import { uid } from '../lib/id'
import { todayKey } from '../lib/dates'
import { useActivity } from './activity'

interface HabitsState {
  habits: Habit[]
  addHabit: (input: Pick<Habit, 'name' | 'icon' | 'color' | 'targetPerWeek'>) => void
  updateHabit: (id: string, patch: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  /** Checks or unchecks today. Past and future days are read-only by design. */
  toggleToday: (id: string) => void
}

export const HABIT_COLORS = ['#1F6F66', '#3D6FB6', '#B7791F', '#A04E7B', '#5B7F2B', '#7A5BC2']

export const useHabits = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      addHabit: (input) =>
        set((s) => ({ habits: [...s.habits, { ...input, id: uid(), log: {}, createdAt: new Date().toISOString() }] })),
      updateHabit: (id, patch) => set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      deleteHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),
      toggleToday: (id) => {
        const day = todayKey()
        const habit = get().habits.find((h) => h.id === id)
        if (!habit) return
        const done = !habit.log[day]
        const activity = useActivity.getState()
        const log = { ...habit.log }
        if (done) {
          activity.add('habit_done', id, day)
          log[day] = true
        } else {
          activity.remove('habit_done', id, day)
          delete log[day]
        }
        set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, log } : h)) }))
      },
    }),
    { name: 'akis-habits', storage: dataStorage },
  ),
)
