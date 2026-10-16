import { addDays } from 'date-fns'
import { useActivity } from '../store/activity'
import { useHabits } from '../store/habits'
import { usePages } from '../store/pages'
import { useSettings } from '../store/settings'
import { useTasks } from '../store/tasks'
import { dayKey } from './dates'

/** Fills an empty workspace with a small, realistic example on first launch. */
export function seedIfNeeded() {
  const settings = useSettings.getState()
  if (settings.seeded) return
  if (useTasks.getState().tasks.length || usePages.getState().pages.length) {
    settings.markSeeded()
    return
  }

  const pages = usePages.getState()
  const welcome = pages.addPage(undefined, {
    title: 'Akış\'a hoş geldin',
    icon: '👋',
    favorite: true,
    content: [
      { type: 'paragraph', content: 'Akış; görevlerini, notlarını ve alışkanlıklarını tek yerde tutman için var. Her şey bu tarayıcıda saklanır.' },
      { type: 'heading', props: { level: 2 }, content: 'Nereden başlamalı?' },
      { type: 'checkListItem', props: { checked: true }, content: 'Bu sayfayı aç' },
      { type: 'checkListItem', content: 'Pano\'da bir kartı "Tamamlandı" sütununa sürükle' },
      { type: 'checkListItem', content: 'Bugün ekranından bir alışkanlığı işaretle' },
      { type: 'checkListItem', content: 'Sol menüden kendi sayfanı oluştur' },
      { type: 'heading', props: { level: 2 }, content: 'Kısayollar' },
      { type: 'bulletListItem', content: 'Ctrl + K: ara, sayfaya git ya da hızlıca görev ekle' },
      { type: 'bulletListItem', content: "Bu editörde '/' yazınca blok menüsü açılır" },
      { type: 'quote', content: 'Küçük adımlar da akışı ilerletir.' },
    ],
  })
  const project = pages.addPage(undefined, {
    title: 'Ev taşıma',
    icon: '📦',
    content: [
      { type: 'paragraph', content: 'Taşınma günü: ayın son cumartesi. İlgili görevler aşağıdaki panoda.' },
    ],
  })
  pages.addPage(project.id, {
    title: 'Alınacaklar',
    icon: '🛒',
    content: [
      { type: 'checkListItem', content: 'Koli bandı' },
      { type: 'checkListItem', content: 'Streç film' },
      { type: 'checkListItem', content: 'Etiket kalemi' },
    ],
  })

  const today = new Date()
  const d = (n: number) => dayKey(addDays(today, n))
  const tasks = useTasks.getState()
  tasks.addTask({ title: 'Haftalık market alışverişi', priority: 'orta', tags: ['ev'], dueDate: d(0) })
  tasks.addTask({ title: 'Faturaları öde', priority: 'yüksek', tags: ['finans'], dueDate: d(-1) })
  tasks.addTask({
    title: 'Nakliye firmalarından teklif al',
    priority: 'yüksek',
    tags: ['taşınma'],
    dueDate: d(2),
    pageId: project.id,
    subtasks: [
      { id: crypto.randomUUID(), title: 'Üç firmayı ara', done: true },
      { id: crypto.randomUUID(), title: 'Fiyatları karşılaştır', done: false },
    ],
  })
  tasks.addTask({ title: 'Kitap kulübü için 3. bölümü oku', priority: 'düşük', tags: ['kişisel'], dueDate: d(4) })
  tasks.addTask({ title: 'Mutfağı kolile', status: 'doing', priority: 'orta', tags: ['taşınma'], pageId: project.id })
  tasks.addTask({ title: 'Sunum taslağını hazırla', status: 'doing', priority: 'yüksek', tags: ['iş'], dueDate: d(1) })
  tasks.addTask({ title: 'Diş hekimi randevusu al', status: 'done', priority: 'orta', tags: ['sağlık'] })

  const habits = useHabits.getState()
  habits.addHabit({ name: '20 dakika yürüyüş', icon: '🚶', color: '#1F6F66', targetPerWeek: 5 })
  habits.addHabit({ name: 'Kitap oku', icon: '📖', color: '#3D6FB6', targetPerWeek: 7 })
  // Sample history for past days. Users can only check today, so this bypasses toggleToday on purpose.
  const [walk, read] = useHabits.getState().habits
  const history: [string, number[]][] = [
    [walk.id, [-1, -2, -4]],
    [read.id, [-1, -2, -3]],
  ]
  const activity = useActivity.getState()
  for (const [id, offsets] of history) {
    const log = Object.fromEntries(offsets.map((n) => [d(n), true]))
    habits.updateHabit(id, { log })
    offsets.forEach((n) => activity.add('habit_done', id, d(n)))
  }

  settings.markSeeded()
  return welcome.id
}
