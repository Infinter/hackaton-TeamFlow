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
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-8">
          <Logo />
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-semibold">Connexion</h1>
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
      </div>
    </main>
  )
}
