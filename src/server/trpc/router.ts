import { router } from './trpc'
import { tenantRouter } from './routers/tenant'
import { brandRouter } from './routers/brand'
import { leadRouter } from './routers/lead'
import { smsRouter } from './routers/sms'
import { sequenceRouter } from './routers/sequence'
import { billingRouter } from './routers/billing'
import { teamRouter } from './routers/team'

export const appRouter = router({
  tenant: tenantRouter,
  brand: brandRouter,
  lead: leadRouter,
  sms: smsRouter,
  sequence: sequenceRouter,
  billing: billingRouter,
  team: teamRouter,
})

export type AppRouter = typeof appRouter
