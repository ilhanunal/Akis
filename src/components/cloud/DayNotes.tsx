import { useState } from 'react'
import { ChevronDown, SendHorizontal, Trash2 } from 'lucide-react'
import type { Note } from '../../types'
import { personOf } from '../../lib/cloud/shared'
import { dayKey, fmt, todayKey } from '../../lib/dates'
import { useNotes } from '../../store/notes'
import { Avatar } from './LoginScreen'

function NoteItem({ note, me }: { note: Note; me: string }) {
  const deleteNote = useNotes((s) => s.deleteNote)
  const author = personOf(note.by)
  const at = new Date(note.createdAt)
  return (
    <li className="group flex gap-3 rounded-lg px-2 py-2.5 hover:bg-sunken/60">
      {author && <Avatar name={author.name} color={author.color} size="sm" />}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-medium">{author?.name ?? 'Bilinmeyen'}</span>
          <time dateTime={note.createdAt} className="text-xs text-muted">
            {fmt(at, 'd MMMM, HH:mm')}
          </time>
        </p>
        <p className="whitespace-pre-wrap break-words text-[14.5px]">{note.text}</p>
      </div>
      {note.by === me && (
        <button
          onClick={() => deleteNote(note.id)}
          className="self-start rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger md:opacity-0 md:focus:opacity-100 md:group-hover:opacity-100"
          aria-label="Notu sil"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </li>
  )
}

/** Notes the two of you leave each other, shown on the shared Today screen with when each was written. */
export function DayNotes({ me }: { me: string }) {
  const notes = useNotes((s) => s.notes)
  const addNote = useNotes((s) => s.addNote)
  const [draft, setDraft] = useState('')
  const [showOld, setShowOld] = useState(false)
  const today = todayKey()
  const sorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const todays = sorted.filter((n) => dayKey(new Date(n.createdAt)) === today)
  const older = sorted.filter((n) => dayKey(new Date(n.createdAt)) !== today)

  const send = () => {
    if (!draft.trim()) return
    addNote(draft, me)
    setDraft('')
  }

  return (
    <section className="mt-8" aria-labelledby="day-notes">
      <h2 id="day-notes" className="mb-2 flex items-baseline gap-2 px-2 text-sm font-semibold">
        Günün notları
        {todays.length > 0 && <span className="font-normal tabular-nums text-faint">{todays.length}</span>}
      </h2>
      <div className="flex items-end gap-2 rounded-xl border border-line bg-surface px-3 py-2 focus-within:border-accent">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          rows={1}
          placeholder="Birbirinize bir not bırakın"
          aria-label="Not yaz"
          className="field-sizing-content max-h-40 min-h-8 w-full resize-none bg-transparent py-1 outline-none placeholder:text-faint"
        />
        <button
          onClick={send}
          disabled={!draft.trim()}
          className="mb-0.5 flex shrink-0 items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-sm font-medium text-accent-ink disabled:opacity-40"
        >
          <SendHorizontal className="size-4" /> Ekle
        </button>
      </div>
      <p className="mt-1 px-2 text-xs text-faint">Enter ile ekle, alt satır için Shift + Enter.</p>

      {todays.length > 0 ? (
        <ul className="mt-2">
          {todays.map((n) => (
            <NoteItem key={n.id} note={n} me={me} />
          ))}
        </ul>
      ) : (
        <p className="px-2 py-3 text-sm text-muted">Bugün henüz not yok.</p>
      )}

      {older.length > 0 && (
        <>
          <button
            onClick={() => setShowOld(!showOld)}
            aria-expanded={showOld}
            className="mt-1 flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-sunken hover:text-ink"
          >
            <ChevronDown className={`size-4 transition-transform ${showOld ? 'rotate-180' : ''}`} />
            Önceki notlar ({older.length})
          </button>
          {showOld && (
            <ul>
              {older.map((n) => (
                <NoteItem key={n.id} note={n} me={me} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
