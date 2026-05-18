import { z } from 'zod'
import { router, tenantProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { sendEmail } from '@/server/lib/resend'

export const teamRouter = router({
  listMembers: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.tenantMember.findMany({
      where: { tenantId: ctx.tenantId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { invitedAt: 'asc' },
    })
  }),

  listInvitations: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.tenantInvitation.findMany({
      where: { tenantId: ctx.tenantId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })
  }),

  invite: tenantProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(['admin', 'member', 'viewer']).default('member'),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db.tenant.findUnique({ where: { id: ctx.tenantId } })
      if (!tenant) throw new TRPCError({ code: 'NOT_FOUND' })

      // Check not already a member
      const existingUser = await ctx.db.user.findUnique({ where: { email: input.email } })
      if (existingUser) {
        const existing = await ctx.db.tenantMember.findUnique({
          where: { tenantId_userId: { tenantId: ctx.tenantId, userId: existingUser.id } },
        })
        if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'This person is already a team member.' })
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const invitation = await ctx.db.tenantInvitation.create({
        data: {
          tenantId: ctx.tenantId,
          email: input.email,
          role: input.role,
          invitedBy: ctx.session.user.id,
          expiresAt,
        },
      })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
      const inviteUrl = `${appUrl}/invite/${invitation.token}`

      await sendEmail({
        to: input.email,
        subject: `You've been invited to join ${tenant.name} on Orbit`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <div style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">You're invited to join <strong>${tenant.name}</strong></h1>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">You've been invited to collaborate on Orbit as a <strong>${input.role}</strong>. Click the button below to accept.</p>
              <a href="${inviteUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Accept invitation</a>
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">This invitation expires in 7 days. If you didn't expect this, you can ignore it.</p>
            </div>
          </div>
        `,
      })

      return invitation
    }),

  removeMember: tenantProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.tenantMember.findUnique({
        where: { tenantId_userId: { tenantId: ctx.tenantId, userId: input.userId } },
      })
      if (!member) throw new TRPCError({ code: 'NOT_FOUND' })
      if (member.role === 'owner') throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot remove the owner.' })

      return ctx.db.tenantMember.delete({
        where: { tenantId_userId: { tenantId: ctx.tenantId, userId: input.userId } },
      })
    }),

  revokeInvitation: tenantProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tenantInvitation.deleteMany({
        where: { id: input.invitationId, tenantId: ctx.tenantId },
      })
    }),
})
