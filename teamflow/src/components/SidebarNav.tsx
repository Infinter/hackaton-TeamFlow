'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type NavItem = { href: string; label: string }

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden={true}>
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden={true}>
      <rect x="5" y="3" width="9" height="1.5" rx="0.75" fill="currentColor" opacity="0.7" />
      <rect x="5" y="7.25" width="9" height="1.5" rx="0.75" fill="currentColor" opacity="0.7" />
      <rect x="5" y="11.5" width="9" height="1.5" rx="0.75" fill="currentColor" opacity="0.7" />
      <circle cx="2.5" cy="3.75" r="1.25" fill="currentColor" opacity="0.7" />
      <circle cx="2.5" cy="8" r="1.25" fill="currentColor" opacity="0.7" />
      <circle cx="2.5" cy="12.25" r="1.25" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

function BoardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden={true}>
      <rect x="1" y="2" width="4" height="12" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="6" y="2" width="4" height="8" rx="1.5" fill="currentColor" opacity="0.7" />
      <rect x="11" y="2" width="4" height="10" rx="1.5" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

function WorkloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden={true}>
      <rect x="1" y="9" width="3" height="5" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="5.5" y="6" width="3" height="8" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="10" y="3" width="3" height="11" rx="1" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

function DefaultIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden={true}>
      <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
    </svg>
  )
}

const ICONS: Record<string, React.ReactNode> = {
  '/dashboard': <DashboardIcon />,
  '/tasks':     <ListIcon />,
  '/board':     <BoardIcon />,
  '/workload':  <WorkloadIcon />,
}

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Navigation principale" className="flex flex-col gap-0.5 px-2">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            )}
          >
            <span className={cn('shrink-0', isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground/60')}>
              {ICONS[item.href] ?? <DefaultIcon />}
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
