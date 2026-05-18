'use client'

import { useEffect } from 'react'
import { type TenantBrandConfig } from '@/types'

interface Props {
  brand: TenantBrandConfig | null
  children: React.ReactNode
}

export function TenantThemeProvider({ brand, children }: Props) {
  useEffect(() => {
    if (!brand) return
    const root = document.documentElement
    root.style.setProperty('--brand-primary', brand.primaryColor)
    root.style.setProperty('--brand-secondary', brand.secondaryColor)
    root.style.setProperty('--brand-accent', brand.accentColor ?? '#06b6d4')
    root.style.setProperty('--brand-bg', brand.backgroundColor)
    root.style.setProperty('--brand-text', brand.textColor)
    root.style.setProperty('--brand-font', `"${brand.fontFamily}", sans-serif`)
  }, [brand])

  return <>{children}</>
}
