import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface Props {
  children: React.ReactNode
  tenantName?: string | null
  logoUrl?: string | null
  userEmail?: string | null
  userName?: string | null
}

export function AppShell({ children, tenantName, logoUrl, userEmail, userName }: Props) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar tenantName={tenantName} logoUrl={logoUrl} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar userEmail={userEmail} userName={userName} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
