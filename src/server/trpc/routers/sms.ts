import { z } from 'zod'
import { router, tenantProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { sendSms } from '@/server/lib/twilio'

export const smsRouter = router({
  listThreads: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.smsThread.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { updatedAt: 'desc' },
      include: {
        lead: { select: { name: true, classification: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })
  }),

  getThread: tenantProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const thread = await ctx.db.smsThread.findFirst({
        where: { id: input.threadId, tenantId: ctx.tenantId },
        include: {
          lead: { select: { name: true, classification: true } },
          messages: { orderBy: { createdAt: 'asc' } },
        },
      })
      if (!thread) throw new TRPCError({ code: 'NOT_FOUND' })
      return thread
    }),

  sendReply: tenantProcedure
    .input(z.object({ threadId: z.string(), body: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const thread = await ctx.db.smsThread.findFirst({
        where: { id: input.threadId, tenantId: ctx.tenantId },
      })
      if (!thread) throw new TRPCError({ code: 'NOT_FOUND' })

      const ok = await sendSms(thread.fromPhone, input.body)
      if (!ok) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to send SMS' })

      await ctx.db.smsMessage.create({
        data: {
          threadId: thread.id,
          body: input.body,
          direction: 'outbound',
        },
      })

      await ctx.db.smsThread.update({
        where: { id: thread.id },
        data: { updatedAt: new Date() },
      })

      return { ok: true }
    }),
})
