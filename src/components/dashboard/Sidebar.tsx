'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Mail,
  MessageSquare,
  Activity,
  Settings,
  LogOut,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { OrbitWordmark } from '@/components/shared/OrbitLogo'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/leads', icon: Users },
  { label: 'SMS Inbox', href: '/sms', icon: MessageSquare },
  { label: 'Sequences', href: '/sequences', icon: Mail },
  { label: 'Activity', href: '/activity', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface Props {
  tenantName?: string | null
  logoUrl?: string | null
}

export function Sidebar({ tenantName, logoUrl }: Props) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-gray-950 border-r border-gray-800 shrink-0">
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-gray-800">
        <OrbitWordmark size="sm" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
              )}
              style={active ? { backgroundColor: 'var(--brand-primary)' } : {}}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/60 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
