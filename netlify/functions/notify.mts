// POST /.netlify/functions/notify — called by the app right after a note or a shared-task mark.
// The caller must be signed in as one of the two people; the message goes to the other one.
import { PEOPLE, personByEmail } from '../../src/lib/cloud/people'
import { asUser, devicesOf, sendTo, type Message } from '../lib/push'

type Event =
  | { type: 'note'; text: string }
  | { type: 'mark'; title: string; finished: boolean }
  | { type: 'test' }

const clip = (s: unknown, n: number) => String(s ?? '').trim().slice(0, n)

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return new Response('Unauthorized', { status: 401 })

  const db = asUser(token)
  const { data, error } = await db.auth.getUser(token)
  const me = personByEmail(data.user?.email)
  if (error || !me) return new Response('Unauthorized', { status: 401 })

  let event: Event
  try {
    event = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const other = PEOPLE.find((p) => p.id !== me.id)!
  let target: string = other.id
  let pref: 'notes' | 'tasks' | null
  let message: Message
  if (event.type === 'note') {
    pref = 'notes'
    message = { title: `${me.name} bir not bıraktı`, body: clip(event.text, 160), url: '/', tag: 'note' }
  } else if (event.type === 'mark') {
    pref = 'tasks'
    const title = clip(event.title, 80)
    message = event.finished
      ? { title: 'Ortak görev tamamlandı', body: `"${title}" görevini ikiniz de bitirdiniz.`, url: '/pano', tag: 'mark' }
      : { title: `${me.name} bir görevi yaptı`, body: `"${title}" görevinde sıra sende.`, url: '/pano', tag: 'mark' }
  } else if (event.type === 'test') {
    target = me.id
    pref = null
    message = { title: 'Bildirimler açık', body: 'Akış bildirimleri bu cihaza ulaşıyor.', url: '/ayarlar', tag: 'test' }
  } else {
    return new Response('Bad request', { status: 400 })
  }

  const devices = (await devicesOf(db, target)).filter((d) => !pref || d.prefs?.[pref] !== false)
  const sent = await sendTo(db, devices, message)
  return Response.json({ sent })
}
