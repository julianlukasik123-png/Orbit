import { z } from 'zod'
import { router, tenantProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const sequenceRouter = router({
  listEnrollments: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.sequenceEnrollment.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { startedAt: 'desc' },
      include: {
        lead: { select: { id: true, name: true, email: true } },
        emails: {
          orderBy: { stepNumber: 'asc' },
          select: { id: true, stepNumber: true, subject: true, sendAt: true, sentAt: true, openedAt: true },
        },
      },
    })
  }),

  cancel: tenantProcedure
    .input(z.object({ enrollmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const enrollment = await ctx.db.sequenceEnrollment.findFirst({
        where: { id: input.enrollmentId, tenantId: ctx.tenantId },
      })
      if (!enrollment) throw new TRPCError({ code: 'NOT_FOUND' })

      return ctx.db.sequenceEnrollment.update({
        where: { id: input.enrollmentId },
        data: { status: 'cancelled' },
      })
    }),
})
