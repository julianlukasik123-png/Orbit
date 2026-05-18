import { auth } from '@/server/auth'
import { db } from '@/server/db'
import { type NextRequest } from 'next/server'

export async function createContext(req: NextRequest) {
  const session = await auth()

  return {
    db,
    session,
    tenantId: session?.user?.tenantId ?? null,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
