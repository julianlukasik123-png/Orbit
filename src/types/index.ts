export type { Session } from 'next-auth'

export interface TenantBrandConfig {
  primaryColor: string
  secondaryColor: string
  accentColor?: string | null
  backgroundColor: string
  textColor: string
  fontFamily: string
  fontUrl?: string | null
  logoUrl?: string | null
}

export interface NavItem {
  label: string
  href: string
  icon: string
}
