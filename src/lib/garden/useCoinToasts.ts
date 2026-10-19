import { useEffect, useRef } from 'react'
import { useCloud } from '../../store/cloud'
import { useEarnings } from '../../store/garden'
import { useUI } from '../../store/ui'

/** Shows "+N 🪙" whenever the signed-in person earns coins, wherever in the app it happened. */
export function useCoinToasts() {
  const me = useCloud((s) => s.person)
  const loaded = useCloud((s) => s.loaded)
  const total = useEarnings(me)?.total
  // The last total seen, and for whom and which workspace, so a sign-in or tab switch only sets a new baseline.
  const last = useRef<{ me: string; loaded: string | null; total: number } | null>(null)
  const toast = useUI((s) => s.toast)

  useEffect(() => {
    if (total === undefined || !me) {
      last.current = null
      return
    }
    const prev = last.current
    if (prev && prev.me === me && prev.loaded === loaded && total > prev.total) toast(`+${total - prev.total} 🪙`)
    last.current = { me, loaded, total }
  }, [total, me, loaded, toast])
}
