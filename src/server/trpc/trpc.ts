import { initTRPC, TRPCError } from '@trpc/server'
import { type Context } from './context'

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, session: ctx.session } })
})

const enforceTenant = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  if (!ctx.tenantId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No tenant associated with this account' })
  }
  return next({ ctx: { ...ctx, session: ctx.session, tenantId: ctx.tenantId } })
})

export const protectedProcedure = t.procedure.use(enforceAuth)
export const tenantProcedure = t.procedure.use(enforceTenant)
