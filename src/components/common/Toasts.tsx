import { useUI } from '../../store/ui'

export function Toasts() {
  const toasts = useUI((s) => s.toasts)
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="toast rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg shadow-card">
          {t.text}
        </div>
      ))}
    </div>
  )
}
