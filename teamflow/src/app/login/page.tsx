'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { signIn } from './actions'

const inputClass =
  'rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring w-full'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<
    { ok: false; error: string } | null,
    FormData
  >(signIn, null)

  return (
    <main className="relative mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-4">
      <Logo className="absolute left-4 top-4" />
      <div>
        <h1 className="text-2xl font-semibold">TeamFlow</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connectez-vous pour accéder à votre espace.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            placeholder="manager@teamflow.dev"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
            placeholder="••••••••"
          />
        </div>

        {state !== null && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>
    </main>
  )
}
