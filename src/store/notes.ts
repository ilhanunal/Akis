import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dataStorage } from '../lib/storage'
import type { Note } from '../types'
import { uid } from '../lib/id'

interface NotesState {
  notes: Note[]
  addNote: (text: string, by: string) => void
  deleteNote: (id: string) => void
}

// Day notes the two of you leave each other on the shared Today screen.
export const useNotes = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (text, by) =>
        set((s) => ({ notes: [...s.notes, { id: uid(), text: text.trim(), by, createdAt: new Date().toISOString() }] })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
    }),
    { name: 'akis-notes', storage: dataStorage },
  ),
)
