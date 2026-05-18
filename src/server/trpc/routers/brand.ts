import { z } from 'zod'
import { router, protectedProcedure, tenantProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

function extractLogoUrl(html: string, baseUrl: string): string | null {
  const ogImage =
    html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ??
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)
  if (ogImage?.[1]) return ogImage[1]

  const appleIcon = html.match(/<link[^>]+rel="apple-touch-icon"[^>]+href="([^"]+)"/i)
  if (appleIcon?.[1]) {
    const href = appleIcon[1]
    try { return href.startsWith('http') ? href : new URL(href, baseUrl).toString() } catch { /* ignore */ }
  }
  return null
}

async function discoverBrand(websiteUrl: string) {
  const res = await fetch(websiteUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OrbitBot/1.0)' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Failed to fetch website: ${res.status}`)
  const html = await res.text()

  const logoUrl = extractLogoUrl(html, websiteUrl)

  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  const truncated = (headMatch?.[1] ?? html).slice(0, 4000)

  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: `Analyze this website HTML from ${websiteUrl} and extract brand design tokens. Return ONLY a valid JSON object:
{"primaryColor":"#hex","secondaryColor":"#hex","backgroundColor":"#hex","textColor":"#hex","fontFamily":"FontName"}
Rules: primaryColor=main brand CTA color, secondaryColor=accent, backgroundColor=page bg, textColor=body text, fontFamily=main font or Inter.
HTML:\n${truncated}`,
      }],
      response_format: { type: 'json_object' },
      max_tokens: 150,
    }),
  })

  if (!aiRes.ok) throw new Error(`OpenAI error: ${aiRes.status}`)
  const aiData = await aiRes.json() as { choices: { message: { content: string } }[] }
  const parsed = JSON.parse(aiData.choices[0]?.message?.content ?? '{}') as {
    primaryColor?: string; secondaryColor?: string; backgroundColor?: string
    textColor?: string; fontFamily?: string
  }

  return {
    primaryColor: parsed.primaryColor ?? '#4F46E5',
    secondaryColor: parsed.secondaryColor ?? '#7C3AED',
    backgroundColor: parsed.backgroundColor ?? '#FFFFFF',
    textColor: parsed.textColor ?? '#111827',
    fontFamily: parsed.fontFamily ?? 'Inter',
    logoUrl,
  }
}

export const brandRouter = router({
  discover: protectedProcedure.mutation(async ({ ctx }) => {
    const membership = await ctx.db.tenantMember.findFirst({
      where: { userId: ctx.session.user.id },
      orderBy: { invitedAt: 'asc' },
    })
    if (!membership) throw new TRPCError({ code: 'NOT_FOUND' })

    const tenant = await ctx.db.tenant.findUnique({ where: { id: membership.tenantId } })
    if (!tenant?.websiteUrl) return null

    try {
      return await discoverBrand(tenant.websiteUrl)
    } catch {
      return null
    }
  }),

  save: protectedProcedure
    .input(
      z.object({
        primaryColor: z.string(),
        secondaryColor: z.string(),
        backgroundColor: z.string(),
        textColor: z.string(),
        fontFamily: z.string(),
        logoUrl: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.tenantMember.findFirst({
        where: { userId: ctx.session.user.id },
        orderBy: { invitedAt: 'asc' },
      })
      if (!membership) throw new TRPCError({ code: 'NOT_FOUND' })

      return ctx.db.tenantBrandConfig.update({
        where: { tenantId: membership.tenantId },
        data: { ...input, autoDiscovered: true, lastUpdatedAt: new Date() },
      })
    }),

  get: tenantProcedure.query(async ({ ctx }) => {
    return ctx.db.tenantBrandConfig.findUnique({ where: { tenantId: ctx.tenantId } })
  }),

  update: tenantProcedure
    .input(
      z.object({
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        backgroundColor: z.string().optional(),
        textColor: z.string().optional(),
        fontFamily: z.string().optional(),
        logoUrl: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tenantBrandConfig.update({
        where: { tenantId: ctx.tenantId },
        data: { ...input, lastUpdatedAt: new Date() },
      })
    }),
})
