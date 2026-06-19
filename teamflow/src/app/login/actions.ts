'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(
  _prevState: { ok: false; error: string } | null | undefined,
  formData: FormData,
): Promise<{ ok: false; error: string } | null> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    return { ok: false, error: 'Adresse e-mail et mot de passe requis.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { ok: false, error: 'Identifiants invalides. Vérifiez votre e-mail et mot de passe.' }
  }

  redirect('/dashboard')
  return null
}

export async function signOut(): Promise<never> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('[signOut] Supabase signOut error:', error.message)
  }
  redirect('/login')
}
