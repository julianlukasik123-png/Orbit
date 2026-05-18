import type { PrismaClient } from '@prisma/client'

interface LeadContext {
  name?: string | null
  email?: string | null
  phone?: string | null
  message?: string | null
  metadata?: Record<string, unknown> | null
}

interface TenantContext {
  name: string
  industry?: string | null
}

interface GeneratedEmail {
  step: number
  subject: string
  body: string
}

async function generateSequenceEmails(
  lead: LeadContext,
  tenant: TenantContext
): Promise<GeneratedEmail[]> {
  const meta = (lead.metadata ?? {}) as Record<string, unknown>
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
          content: `You are a sales email writer for a business called "${tenant.name}"${tenant.industry ? ` in the ${tenant.industry} industry` : ''}. Write 3 follow-up emails as a JSON array. Each email should be professional but warm and conversational. Use HTML formatting (paragraphs with <p> tags, no inline styles needed).

Email 1 (sent immediately): Warm intro — acknowledge their specific need, introduce the business, offer to help or schedule a call.
Email 2 (sent 3 days later): Gentle follow-up — add a helpful tip or insight relevant to their job type, reiterate the offer.
Email 3 (sent 7 days later): Final nudge — create soft urgency (limited availability, seasonal, etc.), make it easy to respond.

Respond with ONLY a JSON array in this exact format, no other text:
[
  {"step": 1, "subject": "...", "body": "<p>...</p>"},
  {"step": 2, "subject": "...", "body": "<p>...</p>"},
  {"step": 3, "subject": "...", "body": "<p>...</p>"}
]`,
        },
        {
          role: 'user',
          content: context || '(no lead details provided)',
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    }),
  })

  const data = await res.json() as { choices: { message: { content: string } }[] }
  const raw = data.choices[0]?.message?.content ?? '[]'

  try {
    const parsed = JSON.parse(raw) as GeneratedEmail[]
    return parsed
  } catch {
    console.error('Failed to parse email sequence JSON:', raw)
    return []
  }
}

export async function triggerSequence(
  leadId: string,
  tenantId: string,
  db: PrismaClient
): Promise<string | null> {
  const lead = await db.lead.findFirst({
    where: { id: leadId, tenantId },
  })
  if (!lead || !lead.email) return null

  const existing = await db.sequenceEnrollment.findUnique({
    where: { leadId },
  })
  if (existing) return existing.id

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) return null

  const emails = await generateSequenceEmails(
    {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      message: lead.message,
      metadata: lead.metadata as Record<string, unknown> | null,
    },
    { name: tenant.name, industry: tenant.industry }
  )

  if (!emails.length) return null

  const now = new Date()
  const enrollment = await db.sequenceEnrollment.create({
    data: {
      tenantId,
      leadId,
      emails: {
        create: emails.map((e) => {
          const sendAt = new Date(now)
          if (e.step === 2) sendAt.setDate(sendAt.getDate() + 3)
          if (e.step === 3) sendAt.setDate(sendAt.getDate() + 7)
          return {
            tenantId,
            stepNumber: e.step,
            subject: e.subject,
            body: e.body,
            sendAt,
          }
        }),
      },
    },
  })

  return enrollment.id
}
