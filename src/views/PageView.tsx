import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, FilePlus, Star } from 'lucide-react'
import type { Task } from '../types'
import { pageTitle, usePages } from '../store/pages'
import { Board } from '../components/kanban/Board'
import { PageEditor } from '../components/editor/PageEditor'

const ICONS = ['📄', '📝', '📌', '📚', '💡', '🎯', '🗂️', '🏠', '📦', '🛒', '💼', '💪', '🧘', '✈️', '🎨', '🌱', '💰', '🍳', '🎓', '❤️', '⭐', '🔥', '🧠', '👋']

export function PageView() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const pages = usePages((s) => s.pages)
  const updatePage = usePages((s) => s.updatePage)
  const addPage = usePages((s) => s.addPage)
  const page = pages.find((p) => p.id === id)
  const [picker, setPicker] = useState(false)

  const filter = useCallback((t: Task) => t.pageId === id, [id])
  const defaults = useMemo(() => ({ pageId: id }), [id])

  if (!page) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-2xl font-semibold">Bu sayfa bulunamadı</p>
        <p className="mt-1 text-muted">Silinmiş olabilir.</p>
        <Link to="/" className="mt-4 inline-block text-accent underline-offset-4 hover:underline">
          Bugün ekranına dön
        </Link>
      </div>
    )
  }

  const trail = []
  for (let p = pages.find((x) => x.id === page.parentId); p; p = pages.find((x) => x.id === p!.parentId)) trail.unshift(p)
  const children = pages.filter((p) => p.parentId === page.id)

  return (
    <article className="mx-auto max-w-4xl">
      {trail.length > 0 && (
        <nav aria-label="Konum" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted">
          {trail.map((p) => (
            <span key={p.id} className="flex items-center gap-1">
              <Link to={`/sayfa/${p.id}`} className="rounded px-1 hover:bg-sunken hover:text-ink">
                {p.icon} {pageTitle(p)}
              </Link>
              <ChevronRight className="size-3.5 text-faint" />
            </span>
          ))}
        </nav>
      )}

      <div className="relative">
        <button
          onClick={() => setPicker((v) => !v)}
          className="mb-2 rounded-lg p-1 text-5xl leading-none hover:bg-sunken"
          aria-label="Sayfa simgesini değiştir"
          aria-expanded={picker}
        >
          {page.icon}
        </button>
        {picker && (
          <div className="pop-in absolute left-0 top-16 z-20 grid w-72 grid-cols-8 gap-1 rounded-xl border border-line bg-surface p-2 shadow-card">
            {ICONS.map((icon) => (
              <button
                key={icon}
                onClick={() => {
                  updatePage(page.id, { icon })
                  setPicker(false)
                }}
                className="grid aspect-square place-items-center rounded-md text-xl hover:bg-sunken"
              >
                {icon}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-3">
        <textarea
          value={page.title}
          onChange={(e) => updatePage(page.id, { title: e.target.value.replace(/\n/g, '') })}
          placeholder="Adsız sayfa"
          rows={1}
          aria-label="Sayfa başlığı"
          autoFocus={!page.title}
          className="field-sizing-content w-full resize-none overflow-hidden bg-transparent font-display text-4xl font-semibold tracking-tight outline-none placeholder:text-faint md:text-5xl"
        />
        <button
          onClick={() => updatePage(page.id, { favorite: !page.favorite })}
          className={`mt-2 rounded-md p-1.5 hover:bg-sunken ${page.favorite ? 'text-doing' : 'text-faint'}`}
          aria-pressed={page.favorite}
          aria-label={page.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          <Star className="size-5" fill={page.favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="-mx-[54px] mt-4 min-h-40 max-md:-mx-4">
        <PageEditor key={page.id} pageId={page.id} initialContent={page.content} />
      </div>

      {children.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-2 text-sm font-semibold text-muted">Alt sayfalar</h2>
          <ul className="grid gap-1 sm:grid-cols-2">
            {children.map((c) => (
              <li key={c.id}>
                <Link to={`/sayfa/${c.id}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-sunken">
                  <span>{c.icon}</span>
                  <span className="truncate underline decoration-line underline-offset-4">{pageTitle(c)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <button
        onClick={() => navigate(`/sayfa/${addPage(page.id).id}`)}
        className="mt-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-sunken hover:text-ink"
      >
        <FilePlus className="size-4" /> Alt sayfa ekle
      </button>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="mb-4 font-display text-xl font-semibold">Bu sayfanın görevleri</h2>
        <Board filter={filter} defaults={defaults} />
      </section>
    </article>
  )
}
