import { z } from 'zod'
import { router, protectedProcedure, tenantProcedure } from '../trpc'
import { slugify } from '@/lib/utils'
import { TRPCError } from '@trpc/server'

export const tenantRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        websiteUrl: z.string().url().optional().or(z.literal('')),
        industry: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const baseSlug = slugify(input.name)

      // Ensure unique slug
      let slug = baseSlug
      let attempt = 0
      while (await ctx.db.tenant.findUnique({ where: { slug } })) {
        attempt++
        slug = `${baseSlug}-${attempt}`
      }

      const tenant = await ctx.db.tenant.create({
        data: {
          name: input.name,
          slug,
          websiteUrl: input.websiteUrl || null,
          industry: input.industry || null,
          members: {
            create: {
              userId,
              role: 'owner',
              acceptedAt: new Date(),
            },
          },
          brandConfig: {
            create: {},
          },
        },
      })

      return tenant
    }),

  getCurrent: tenantProcedure.query(async ({ ctx }) => {
    const tenant = await ctx.db.tenant.findUnique({
      where: { id: ctx.tenantId },
      include: { brandConfig: true },
    })
    if (!tenant) throw new TRPCError({ code: 'NOT_FOUND' })
    return tenant
  }),

  getBrand: tenantProcedure.query(async ({ ctx }) => {
    const brand = await ctx.db.tenantBrandConfig.findUnique({
      where: { tenantId: ctx.tenantId },
    })
    return brand
  }),
})
