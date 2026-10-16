import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  onClose: () => void
  children: ReactNode
  label: string
  className?: string
  align?: 'center' | 'top'
}

export function Modal({ onClose, children, label, className = '', align = 'center' }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return createPortal(
    <div
      className={`fixed inset-0 z-40 flex justify-center bg-ink/25 p-4 backdrop-blur-[2px] ${
        align === 'top' ? 'items-start pt-[12vh]' : 'items-center'
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`pop-in max-h-full w-full overflow-auto rounded-xl border border-line bg-surface shadow-card ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
