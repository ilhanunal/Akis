import { useCloud } from '../../store/cloud'
import { useUI } from '../../store/ui'
import { PEOPLE, personByEmail, supabase, type PersonId, type WorkspaceId } from './config'
import { closeWorkspace, openWorkspace } from './sync'
import { startGarden, stopGarden } from './garden'

const LAST_WORKSPACE = 'akis-workspace'

function rememberedWorkspace(person: PersonId): WorkspaceId {
  try {
    const saved = localStorage.getItem(LAST_WORKSPACE)
    if (saved === 'ilhan' || saved === 'sedef' || saved === 'ortak') return saved
  } catch {
    /* storage unavailable */
  }
  return person
}

export function switchWorkspace(ws: WorkspaceId) {
  const cloud = useCloud.getState()
  if (cloud.workspace === ws) return
  try {
    localStorage.setItem(LAST_WORKSPACE, ws)
  } catch {
    /* storage unavailable */
  }
  useUI.getState().openTask(null)
  cloud.setWorkspace(ws)
  void openWorkspace(ws)
}

function onSignedIn(email?: string) {
  const person = personByEmail(email)
  const cloud = useCloud.getState()
  if (!person) {
    // Signed in with an account that isn't one of the two people; the database would refuse it anyway.
    void supabase?.auth.signOut()
    cloud.setPerson(null)
    return
  }
  if (cloud.person === person.id) return
  cloud.setPerson(person.id)
  const ws = rememberedWorkspace(person.id)
  cloud.setWorkspace(ws)
  void openWorkspace(ws)
  void startGarden()
}

/** Restores a saved session and follows sign-ins and sign-outs. Call once at startup. */
export function initAuth() {
  if (!supabase) return
  void supabase.auth.getSession().then(({ data }) => {
    if (data.session) onSignedIn(data.session.user.email)
    else useCloud.getState().setPerson(null)
  })
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) onSignedIn(session.user.email)
    if (event === 'SIGNED_OUT') {
      closeWorkspace()
      stopGarden()
      useCloud.setState({ person: null, workspace: null })
    }
  })
}

export async function signIn(person: PersonId, password: string) {
  if (!supabase) return
  const email = PEOPLE.find((p) => p.id === person)!.email
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(
      error.message.includes('Invalid login') ? 'Şifre yanlış.' : 'Giriş yapılamadı. İnternet bağlantını kontrol et.',
    )
  }
}

export async function signOut() {
  try {
    localStorage.removeItem(LAST_WORKSPACE)
  } catch {
    /* storage unavailable */
  }
  await supabase?.auth.signOut()
}
