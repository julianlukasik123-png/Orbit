import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { db } from '@/server/db'
import { AppShell } from '@/components/dashboard/AppShell'
import { TenantThemeProvider } from '@/components/shared/TenantThemeProvider'
import { type TenantBrandConfig } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.tenantId) redirect('/onboarding')

  const [tenant, brand] = await Promise.all([
    db.tenant.findUnique({ where: { id: session.user.tenantId } }),
    db.tenantBrandConfig.findUnique({ where: { tenantId: session.user.tenantId } }),
  ])

  if (!tenant) redirect('/onboarding')

  const brandConfig: TenantBrandConfig | null = brand
    ? {
        primaryColor: brand.primaryColor,
        secondaryColor: brand.secondaryColor,
        accentColor: brand.accentColor,
        backgroundColor: brand.backgroundColor,
        textColor: brand.textColor,
        fontFamily: brand.fontFamily,
        fontUrl: brand.fontUrl,
        logoUrl: brand.logoUrl,
      }
    : null

  return (
    <TenantThemeProvider brand={brandConfig}>
      <AppShell
        tenantName={tenant.name}
        logoUrl={brand?.logoUrl}
        userEmail={session.user.email}
        userName={session.user.name}
      >
        {children}
      </AppShell>
    </TenantThemeProvider>
  )
}
