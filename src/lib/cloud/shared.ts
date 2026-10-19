// Rules of the shared ("ortak") board: every task is for both people. Whoever does it first moves
// the card to their own column; when the other moves it to theirs too, it leaves the board.
import { useCloud } from '../../store/cloud'
import type { Task } from '../../types'
import { cloudEnabled, PEOPLE, type PersonId } from './config'

export type SharedColumn = 'pool' | PersonId

/** The signed-in person while the shared workspace is open; null everywhere else. */
export function useSharedMe(): PersonId | null {
  const workspace = useCloud((s) => s.workspace)
  const person = useCloud((s) => s.person)
  return cloudEnabled && workspace === 'ortak' && person ? person : null
}

export const personOf = (id: string) => PEOPLE.find((p) => p.id === id)
export const otherThan = (me: PersonId) => PEOPLE.find((p) => p.id !== me)!

/** Where a task sits on the shared board; null once both have done it. */
export function sharedColumn(t: Task): SharedColumn | null {
  if (t.status === 'done') return null
  const marked = PEOPLE.filter((p) => t.marks?.[p.id])
  return marked.length === 1 ? marked[0].id : 'pool'
}

/** You may only add your own mark (to your column) or take back your own (to the pool). */
export function canMove(t: Task, to: SharedColumn, me: PersonId) {
  const from = sharedColumn(t)
  if (from === null || from === to) return false
  if (to === me) return true
  return to === 'pool' && from === me
}
