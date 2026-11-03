import { useRef, useState } from 'react'
import { Hand } from 'lucide-react'
import { useCloud } from '../../store/cloud'
import { useUI } from '../../store/ui'
import { PEOPLE } from '../../lib/cloud/config'
import { notify } from '../../lib/cloud/push'
import { Menu } from '../common/Menu'

const MESSAGES = [
  { label: 'Sadece dürt', text: '' },
  { label: 'Görevlerine bir bak', text: 'Bugünkü görevlerine bir bakar mısın?' },
  { label: 'Alışkanlıklarını işaretle', text: 'Alışkanlıklarını işaretlemeyi unutma.' },
  { label: 'Seni düşünüyorum', text: 'Seni düşünüyorum 💛' },
]

/** Keeps a nudge from turning into a flood: one every few seconds is plenty. */
const COOLDOWN_MS = 8000

/** Sends the other person a push notification: a plain nudge or one of a few short messages. */
export function NudgeButton({ onDone }: { onDone?: () => void }) {
  const me = useCloud((s) => s.person)
  const toast = useUI((s) => s.toast)
  const button = useRef<HTMLButtonElement>(null)
  const last = useRef(0)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const other = PEOPLE.find((p) => p.id !== me)
  if (!me || !other) return null

  const send = async (text: string) => {
    if (Date.now() - last.current < COOLDOWN_MS) return toast('Biraz bekle, az önce dürttün')
    last.current = Date.now()
    onDone?.()
    const res = await notify({ type: 'nudge', text })
    if (!res) toast('Dürtme gönderilemedi')
    else if (res.sent === 0) toast(`${other.name} henüz bildirimleri açmamış, dürtme ulaşmadı`)
    else toast(`${other.name} dürtüldü 👉`)
  }

  return (
    <>
      <button
        ref={button}
        onClick={() => {
          const r = button.current!.getBoundingClientRect()
          setMenu({ x: r.left, y: r.bottom + 4 })
        }}
        aria-haspopup="menu"
        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-sunken hover:text-ink"
      >
        <Hand className="size-[18px]" />
        {other.acc} dürt
      </button>
      {menu && (
        <Menu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={MESSAGES.map((m) => ({ label: m.label, onSelect: () => void send(m.text) }))}
        />
      )}
    </>
  )
}
