import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { dataStorage } from '../lib/storage'
import type { Page } from '../types'
import { uid } from '../lib/id'
import { useTasks } from './tasks'

interface PagesState {
  pages: Page[]
  addPage: (parentId?: string, init?: Partial<Page>) => Page
  updatePage: (id: string, patch: Partial<Page>) => void
  deletePage: (id: string) => void
  movePage: (id: string, parentId?: string) => void
}

export const descendantIds = (pages: Page[], id: string): string[] => {
  const kids = pages.filter((p) => p.parentId === id).map((p) => p.id)
  return [...kids, ...kids.flatMap((k) => descendantIds(pages, k))]
}

export const pageTitle = (p?: Page) => p?.title.trim() || 'Adsız sayfa'

export const usePages = create<PagesState>()(
  persist(
    (set, get) => ({
      pages: [],
      addPage: (parentId, init) => {
        const now = new Date().toISOString()
        const page: Page = {
          id: uid(),
          title: '',
          icon: '📄',
          content: [],
          favorite: false,
          createdAt: now,
          updatedAt: now,
          ...init,
          parentId,
        }
        set((s) => ({ pages: [...s.pages, page] }))
        return page
      },
      updatePage: (id, patch) =>
        set((s) => ({
          pages: s.pages.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)),
        })),
      deletePage: (id) => {
        const doomed = new Set([id, ...descendantIds(get().pages, id)])
        set((s) => ({ pages: s.pages.filter((p) => !doomed.has(p.id)) }))
        // Tasks outlive their page; they just lose the link.
        const tasks = useTasks.getState()
        tasks.tasks.filter((t) => t.pageId && doomed.has(t.pageId)).forEach((t) => tasks.updateTask(t.id, { pageId: undefined }))
      },
      movePage: (id, parentId) => {
        if (parentId && (parentId === id || descendantIds(get().pages, id).includes(parentId))) return
        set((s) => ({ pages: s.pages.map((p) => (p.id === id ? { ...p, parentId } : p)) }))
      },
    }),
    { name: 'akis-pages', storage: dataStorage },
  ),
)
