import { useEffect, useSyncExternalStore } from 'react'
import { useSettings } from '../store/settings'

const query = '(prefers-color-scheme: dark)'
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useSettings((s) => s.theme)
  const systemDark = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
  return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
}

export function useApplyTheme() {
  const resolved = useResolvedTheme()
  useEffect(() => {
    document.documentElement.dataset.theme = resolved
  }, [resolved])
}

/** `spellcheck` is inherited, so setting it on <html> covers the editor, inputs and textareas alike. */
export function useApplySpellcheck() {
  const on = useSettings((s) => s.spellcheck)
  useEffect(() => {
    document.documentElement.spellcheck = on
  }, [on])
}
