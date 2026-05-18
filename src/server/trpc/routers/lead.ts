import { z } from 'zod'
import { router, tenantProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { classifyLead } from '@/server/lib/classifier'
import { triggerSequence } from '@/server/lib/emailSequence'
import { PLANS, type PlanKey } from '@/lib/plans'
import { notifyHighValueLead } from '@/server/lib/notifyHighValueLead'

export const leadRouter = router({
  list: tenantProcedure
    .input(
      z.object({
        classification: z
          .enum(['pending', 'high_value', 'low_value', 'invalid', 'unqualified'])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.lead.findMany({
        where: {
          tenantId: ctx.tenantId,
          ...(input.classification ? { classification: input.classification } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
    }),

  counts: tenantProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const [total, highValue, pending, thisMonth] = await Promise.all([
      ctx.db.lead.count({ where: { tenantId: ctx.tenantId } }),
      ctx.db.lead.count({ where: { tenantId: ctx.tenantId, classification: 'high_value' } }),
      ctx.db.lead.count({ where: { tenantId: ctx.tenantId, classification: 'pending' } }),
      ctx.db.lead.count({ where: { tenantId: ctx.tenantId, createdAt: { gte: monthStart } } }),
    ])
    return { total, highValue, pending, thisMonth }
  }),

  chartData: tenantProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.$queryRaw<
      { day: Date; classification: string; count: bigint }[]
    >`
      SELECT
        DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC') AS day,
        classification,
        COUNT(*) AS count
      FROM leads
      WHERE "tenantId" = ${ctx.tenantId}
        AND "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY day, classification
      ORDER BY day ASC
    `
    return rows.map((r) => ({
      day: r.day.toISOString().slice(0, 10),
      classification: r.classification,
      count: Number(r.count),
    }))
  }),

  recent: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.lead.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, classification: true, createdAt: true },
    })
  }),

  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      if (!lead) throw new TRPCError({ code: 'NOT_FOUND' })
      return lead
    }),

  create: tenantProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
        jobType: z.string().optional(),
        location: z.string().optional(),
        budget: z.string().optional(),
        timeline: z.string().optional(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db.tenant.findUnique({ where: { id: ctx.tenantId } })
      const plan = PLANS[(tenant?.plan ?? 'free') as PlanKey]

      if (plan.leadLimit !== -1) {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const count = await ctx.db.lead.count({
          where: { tenantId: ctx.tenantId, createdAt: { gte: monthStart } },
        })
        if (count >= plan.leadLimit) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Monthly lead limit of ${plan.leadLimit} reached. Upgrade your plan to add more leads.`,
          })
        }
      }

      const lead = await ctx.db.lead.create({
        data: {
          tenantId: ctx.tenantId,
          name: input.name || null,
          email: input.email || null,
          phone: input.phone || null,
          message: input.message || null,
          source: 'manual',
          metadata: {
            jobType: input.jobType || null,
            location: input.location || null,
            budget: input.budget || null,
            timeline: input.timeline || null,
          },
        },
      })

      classifyLead(
        { ...input, jobType: input.jobType, location: input.location, budget: input.budget, timeline: input.timeline },
        { name: tenant?.name ?? '', industry: tenant?.industry }
      )
        .then(async (result) => {
          await ctx.db.lead.update({
            where: { id: lead.id },
            data: {
              classification: result.classification,
              classifyReason: result.reason,
              score: result.score,
              ...(!input.name && result.extractedName ? { name: result.extractedName } : {}),
            },
          })
          if (result.classification === 'high_value') {
            triggerSequence(lead.id, ctx.tenantId, ctx.db).catch(() => {})
            notifyHighValueLead(lead.id, ctx.tenantId, ctx.db).catch(() => {})
          }
        })
        .catch(() => { /* classification failure is non-fatal */ })

      return lead
    }),

  summarize: tenantProcedure
    .input(z.object({ id: z.string(), force: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      if (!lead) throw new TRPCError({ code: 'NOT_FOUND' })

      const meta = (lead.metadata ?? {}) as Record<string, unknown>
      if (meta.aiSummary && !input.force) return { summary: meta.aiSummary as string }

      const context = [
        lead.name && `Name: ${lead.name}`,
        lead.email && `Email: ${lead.email}`,
        lead.phone && `Phone: ${lead.phone}`,
        meta.jobType && `Job type: ${meta.jobType}`,
        meta.location && `Location: ${meta.location}`,
        meta.budget && `Budget: ${meta.budget}`,
        meta.timeline && `Timeline: ${meta.timeline}`,
        lead.message && `Message: ${lead.message}`,
      ].filter(Boolean).join('\n')

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a sales assistant. Write a concise 2-3 sentence overview of this lead for a business owner. Cover: who they are, what they need, urgency/budget if known, and one recommended next action. Be direct and practical.',
            },
            { role: 'user', content: context || '(no details provided)' },
          ],
          max_tokens: 200,
        }),
      })

      const data = await res.json() as { choices: { message: { content: string } }[] }
      const summary = data.choices[0]?.message?.content ?? 'Unable to generate summary.'

      await ctx.db.lead.update({
        where: { id: lead.id },
        data: { metadata: { ...meta, aiSummary: summary } },
      })

      return { summary }
    }),

  reclassify: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.findFirst({
        where: { id: input.id, tenantId: ctx.tenantId },
      })
      if (!lead) throw new TRPCError({ code: 'NOT_FOUND' })

      const tenant = await ctx.db.tenant.findUnique({ where: { id: ctx.tenantId } })
      const result = await classifyLead(lead, { name: tenant?.name ?? '', industry: tenant?.industry })

      const updated = await ctx.db.lead.update({
        where: { id: lead.id },
        data: {
          classification: result.classification,
          classifyReason: result.reason,
          score: result.score,
        },
      })

      if (result.classification === 'high_value') {
        triggerSequence(lead.id, ctx.tenantId, ctx.db).catch(() => {})
        notifyHighValueLead(lead.id, ctx.tenantId, ctx.db).catch(() => {})
      }

      return updated
    }),

  importCsv: tenantProcedure
    .input(z.object({
      rows: z.array(z.object({
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        jobType: z.string().optional(),
        location: z.string().optional(),
        budget: z.string().optional(),
        timeline: z.string().optional(),
        message: z.string().optional(),
      })).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db.tenant.findUnique({ where: { id: ctx.tenantId } })

      const created: string[] = []
      for (const row of input.rows) {
        if (!row.name && !row.email && !row.phone) continue

        const lead = await ctx.db.lead.create({
          data: {
            tenantId: ctx.tenantId,
            name: row.name || null,
            email: row.email || null,
            phone: row.phone || null,
            message: row.message || null,
            source: 'csv',
            metadata: {
              jobType: row.jobType || null,
              location: row.location || null,
              budget: row.budget || null,
              timeline: row.timeline || null,
            },
          },
        })

        created.push(lead.id)

        classifyLead(row, { name: tenant?.name ?? '', industry: tenant?.industry })
          .then(async (result) => {
            await ctx.db.lead.update({
              where: { id: lead.id },
              data: {
                classification: result.classification,
                classifyReason: result.reason,
                score: result.score,
                ...(!row.name && result.extractedName ? { name: result.extractedName } : {}),
              },
            })
            if (result.classification === 'high_value') {
              triggerSequence(lead.id, ctx.tenantId, ctx.db).catch(() => {})
              notifyHighValueLead(lead.id, ctx.tenantId, ctx.db).catch(() => {})
            }
          })
          .catch(() => {})
      }

      return { imported: created.length, skipped: input.rows.length - created.length }
    }),
})
