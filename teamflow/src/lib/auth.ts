import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/types'

export type Profile = Tables<'profiles'>

export type AuthResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

/**
 * Retourne le profil complet (role, weekly_capacity_hours, …) de l'utilisateur courant.
 * Retourne null si aucun utilisateur authentifié ou si le profil est introuvable.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[getCurrentProfile] DB error:', error.message)
    return null
  }

  return profile
}

/**
 * Garde manager : retourne { ok: false, error } si l'utilisateur n'est pas manager.
 * Utilisé comme double barrière (avec la RLS) dans les Server Actions sensibles.
 */
export async function requireManager(): Promise<AuthResult> {
  const profile = await getCurrentProfile()

  if (!profile) {
    return { ok: false, error: 'Non authentifié.' }
  }

  if (profile.role !== 'manager') {
    return { ok: false, error: 'Action réservée aux managers.' }
  }

  return { ok: true, data: undefined }
}
