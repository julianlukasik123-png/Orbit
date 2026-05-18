import { sendEmail } from './resend'
import type { PrismaClient } from '@prisma/client'

export async function notifyHighValueLead(
  leadId: string,
  tenantId: string,
  db: PrismaClient
): Promise<void> {
  const [lead, ownerMember] = await Promise.all([
    db.lead.findFirst({ where: { id: leadId, tenantId } }),
    db.tenantMember.findFirst({
      where: { tenantId, role: 'owner' },
      include: { user: { select: { email: true, name: true } } },
    }),
  ])

  if (!lead || !ownerMember?.user.email) return

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
  const meta = (lead.metadata ?? {}) as Record<string, unknown>
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const label = `padding:8px 0;color:#6b7280;font-size:13px;white-space:nowrap;min-width:100px;padding-right:24px;vertical-align:top;`
  const value = `padding:8px 0;font-size:13px;color:#111827;`

  const rows = [
    lead.name && `<tr><td style="${label}">Name</td><td style="${value} font-weight:600;">${lead.name}</td></tr>`,
    lead.email && `<tr><td style="${label}">Email</td><td style="${value}">${lead.email}</td></tr>`,
    lead.phone && `<tr><td style="${label}">Phone</td><td style="${value}">${lead.phone}</td></tr>`,
    meta.jobType && `<tr><td style="${label}">Job type</td><td style="${value}">${meta.jobType}</td></tr>`,
    meta.location && `<tr><td style="${label}">Location</td><td style="${value}">${meta.location}</td></tr>`,
    meta.budget && `<tr><td style="${label}">Budget</td><td style="${value}">${meta.budget}</td></tr>`,
    meta.timeline && `<tr><td style="${label}">Timeline</td><td style="${value}">${meta.timeline}</td></tr>`,
    lead.score && `<tr><td style="${label}">Score</td><td style="${value}">${lead.score}/10</td></tr>`,
    lead.classifyReason && `<tr><td style="${label}">Reason</td><td style="${value}">${lead.classifyReason}</td></tr>`,
    lead.message && `<tr><td style="${label}">Message</td><td style="${value}">${lead.message}</td></tr>`,
  ].filter(Boolean).join('')

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#16a34a;padding:24px 32px;">
        <p style="margin:0;font-size:12px;color:#bbf7d0;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">High-Value Lead Alert</p>
        <h1 style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700;">${lead.name ?? 'New lead'}</h1>
      </div>
      <div style="padding:28px 32px;">
        <p style="margin:0 0 20px;font-size:14px;color:#374151;">A new high-value lead has been captured for <strong>${tenant?.name ?? 'your business'}</strong>. Here are the details:</p>
        <table style="width:100%;border-collapse:collapse;border-top:1px solid #f3f4f6;">
          ${rows}
        </table>
        <div style="margin-top:28px;">
          <a href="${appUrl}/leads" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">View lead in Orbit</a>
        </div>
      </div>
      <div style="padding:16px 32px;border-top:1px solid #f3f4f6;background:#f9fafb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">Sent by Orbit · You're receiving this because you're the account owner.</p>
      </div>
    </div>
  `

  await sendEmail({
    to: ownerMember.user.email,
    subject: `🔥 New high-value lead${lead.name ? `: ${lead.name}` : ''} — ${tenant?.name ?? 'Orbit'}`,
    html,
  })
}
