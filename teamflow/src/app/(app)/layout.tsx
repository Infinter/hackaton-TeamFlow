import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import { signOut } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { SidebarNav } from '@/components/SidebarNav'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', managerOnly: false },
  { href: '/tasks',     label: 'Tâches',    managerOnly: false },
  { href: '/board',     label: 'Tableau',   managerOnly: false },
  { href: '/workload',  label: 'Charge',    managerOnly: true  },
]

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  const isManager = profile.role === 'manager'

  const visibleNavItems = navItems.filter((item) => !item.managerOnly || isManager)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        {/* Logo */}
        <div className="px-4 py-5">
          <Link href="/dashboard" aria-label="TeamFlow — accueil">
            <Logo />
          </Link>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-1">
          <SidebarNav items={visibleNavItems} />
        </div>

        {/* User / Sign out */}
        <div className="border-t border-sidebar-border px-4 py-4">
          <div
            className="mb-2 truncate text-xs text-sidebar-foreground/50"
            title={profile.full_name ?? undefined}
          >
            {profile.full_name ?? 'Utilisateur'}
          </div>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 text-xs"
            >
              Déconnexion
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        {children}
      </main>
    </div>
  )
}
