import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export interface MenuItem {
  label: string
  icon?: ReactNode
  danger?: boolean
  onSelect: () => void
}

interface Props {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

/** A small floating menu anchored at a point, kept inside the viewport. */
export function Menu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    setPos({
      left: Math.min(x, window.innerWidth - width - 8),
      top: Math.min(y, window.innerHeight - height - 8),
    })
    el.querySelector<HTMLButtonElement>('button')?.focus()
  }, [x, y])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={ref}
      role="menu"
      className="pop-in fixed z-50 min-w-48 rounded-lg border border-line bg-surface p-1 shadow-card"
      style={pos}
    >
      {items.map((item) => (
        <button
          key={item.label}
          role="menuitem"
          onClick={() => {
            item.onSelect()
            onClose()
          }}
          className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-sunken focus-visible:bg-sunken ${
            item.danger ? 'text-danger' : 'text-ink'
          }`}
        >
          <span className="text-muted [&_svg]:size-4">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  )
}
