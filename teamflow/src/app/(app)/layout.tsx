import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import { signOut } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', managerOnly: false },
  { href: '/tasks', label: 'Tâches', managerOnly: false },
  { href: '/board', label: 'Tableau', managerOnly: false },
  { href: '/workload', label: 'Charge', managerOnly: true },
]

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  const isManager = profile.role === 'manager'

  const visibleNavItems = navItems.filter(
    (item) => !item.managerOnly || isManager,
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link href="/dashboard" aria-label="TeamFlow — accueil">
            <Logo />
          </Link>
          <ul className="flex flex-1 items-center gap-4">
            {visibleNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Déconnexion
            </Button>
          </form>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  )
}
