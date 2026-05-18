export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Orbit'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const DEFAULT_BRAND = {
  primaryColor: '#4F46E5',
  secondaryColor: '#7C3AED',
  backgroundColor: '#FFFFFF',
  textColor: '#111827',
  fontFamily: 'Inter',
} as const

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Leads', href: '/leads', icon: 'Users' },
  { label: 'Sequences', href: '/sequences', icon: 'Mail' },
  { label: 'Activity', href: '/activity', icon: 'Activity' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const
