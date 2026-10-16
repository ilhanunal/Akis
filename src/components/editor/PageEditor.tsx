import { useEffect, useRef } from 'react'
import type { PartialBlock } from '@blocknote/core'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import { usePages } from '../../store/pages'
import { useResolvedTheme } from '../../lib/theme'
import { tr } from './trLocale'

interface Props {
  pageId: string
  initialContent: unknown[]
}

/** Notion-style block editor for one page. Mount with `key={pageId}` so switching pages starts fresh. */
export function PageEditor({ pageId, initialContent }: Props) {
  const theme = useResolvedTheme()
  const updatePage = usePages((s) => s.updatePage)
  const editor = useCreateBlockNote({
    dictionary: tr,
    initialContent: initialContent.length ? (initialContent as PartialBlock[]) : undefined,
  })

  // Saving on every keystroke would rewrite localStorage constantly; batch edits briefly instead.
  const timer = useRef<number | undefined>(undefined)
  const flush = useRef<() => void>(() => {})
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      flush.current()
    },
    [],
  )

  return (
    <BlockNoteView
      editor={editor}
      theme={theme}
      onChange={() => {
        flush.current = () => {
          updatePage(pageId, { content: editor.document })
          flush.current = () => {}
        }
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => flush.current(), 400)
      }}
    />
  )
}
