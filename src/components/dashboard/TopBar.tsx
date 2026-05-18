'use client'

import { Bell, Search } from 'lucide-react'

interface Props {
  userEmail?: string | null
  userName?: string | null
}

export function TopBar({ userEmail, userName }: Props) {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shrink-0">
      {/* Search placeholder */}
      <div className="flex items-center gap-2 w-80 h-9 px-3 bg-gray-100 rounded-lg text-gray-600 text-sm cursor-pointer hover:bg-gray-200 transition-colors">
        <Search size={15} />
        <span>Search leads, sequences…</span>
        <span className="ml-auto text-xs bg-gray-200 px-1.5 py-0.5 rounded">⌘K</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
          <Bell size={18} />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand-primary)' }} />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            {(userName ?? userEmail ?? 'U')[0].toUpperCase()}
          </div>
          <span className="text-sm text-gray-700 font-medium hidden md:block">
            {userName ?? userEmail}
          </span>
        </div>
      </div>
    </header>
  )
}
