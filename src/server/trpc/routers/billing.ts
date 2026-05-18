import { z } from 'zod'
import { router, tenantProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { stripe } from '@/server/lib/stripe'
import { PLANS, type PlanKey } from '@/lib/plans'

export const billingRouter = router({
  getSubscription: tenantProcedure.query(async ({ ctx }) => {
    const tenant = await ctx.db.tenant.findUnique({ where: { id: ctx.tenantId } })
    if (!tenant) throw new TRPCError({ code: 'NOT_FOUND' })

    const plan = PLANS[tenant.plan as PlanKey] ?? PLANS.free
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const leadsThisMonth = await ctx.db.lead.count({
      where: { tenantId: ctx.tenantId, createdAt: { gte: monthStart } },
    })

    let currentPeriodEnd: Date | null = null
    let cancelAtPeriodEnd = false

    if (tenant.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId)
        currentPeriodEnd = new Date(sub.current_period_end * 1000)
        cancelAtPeriodEnd = sub.cancel_at_period_end
      } catch {
        // subscription may have been deleted
      }
    }

    return {
      plan: tenant.plan as PlanKey,
      planName: plan.name,
      price: plan.price,
      leadLimit: plan.leadLimit,
      leadsThisMonth,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      hasSubscription: !!tenant.stripeSubscriptionId,
    }
  }),

  createCheckoutSession: tenantProcedure
    .input(z.object({ plan: z.enum(['starter', 'pro', 'enterprise']) }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db.tenant.findUnique({ where: { id: ctx.tenantId } })
      if (!tenant) throw new TRPCError({ code: 'NOT_FOUND' })

      const priceIdMap: Record<string, string | undefined> = {
        starter: process.env.STRIPE_PRICE_STARTER,
        pro: process.env.STRIPE_PRICE_PRO,
        enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
      }
      const priceId = priceIdMap[input.plan]
      if (!priceId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Price not configured' })

      const plan = PLANS[input.plan]

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

      // Reuse existing Stripe customer or create new one
      let customerId = tenant.stripeCustomerId ?? undefined

      if (!customerId) {
        const customer = await stripe.customers.create({
          metadata: { tenantId: tenant.id },
        })
        customerId = customer.id
        await ctx.db.tenant.update({
          where: { id: tenant.id },
          data: { stripeCustomerId: customerId },
        })
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/settings?billing=success`,
        cancel_url: `${appUrl}/settings`,
        metadata: { tenantId: tenant.id },
        subscription_data: { metadata: { tenantId: tenant.id } },
      })

      return { url: session.url }
    }),

  createPortalSession: tenantProcedure.mutation(async ({ ctx }) => {
    const tenant = await ctx.db.tenant.findUnique({ where: { id: ctx.tenantId } })
    if (!tenant?.stripeCustomerId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'No billing account found' })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    })

    return { url: session.url }
  }),
})
