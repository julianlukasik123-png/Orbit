import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { classifyLead } from '@/server/lib/classifier'
import { triggerSequence } from '@/server/lib/emailSequence'
import { notifyHighValueLead } from '@/server/lib/notifyHighValueLead'

const TWIML_EMPTY = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const tenantSlug = searchParams.get('tenant')
    if (!tenantSlug) return new Response(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })

    const tenant = await db.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) return new Response(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })

    const form = await req.formData()
    const from = form.get('From') as string | null
    const body = form.get('Body') as string | null
    const messageSid = form.get('MessageSid') as string | null
    const to = form.get('To') as string | null

    if (!from || !body) return new Response(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })

    // Find or create thread for this phone number
    let thread = await db.smsThread.findFirst({
      where: { tenantId: tenant.id, fromPhone: from },
    })

    if (!thread) {
      // New contact — create lead + thread together
      const lead = await db.lead.create({
        data: {
          tenantId: tenant.id,
          phone: from,
          message: body,
          source: 'sms',
        },
      })

      thread = await db.smsThread.create({
        data: {
          tenantId: tenant.id,
          leadId: lead.id,
          fromPhone: from,
          toPhone: to ?? process.env.TWILIO_PHONE_NUMBER ?? '',
        },
      })

      // Classify the new lead async
      classifyLead(
        { phone: from, message: body },
        { name: tenant.name, industry: tenant.industry }
      )
        .then(async (result) => {
          await db.lead.update({
            where: { id: lead.id },
            data: {
              classification: result.classification,
              classifyReason: result.reason,
              score: result.score,
              ...(result.extractedName ? { name: result.extractedName } : {}),
            },
          })
          if (result.classification === 'high_value') {
            triggerSequence(lead.id, tenant.id, db).catch(() => {})
            notifyHighValueLead(lead.id, tenant.id, db).catch(() => {})
          }
        })
        .catch(() => { /* non-fatal */ })
    } else {
      // Existing thread — just update updatedAt
      await db.smsThread.update({
        where: { id: thread.id },
        data: { updatedAt: new Date() },
      })
    }

    // Store the inbound message
    await db.smsMessage.create({
      data: {
        threadId: thread.id,
        body,
        direction: 'inbound',
        sid: messageSid,
      },
    })

    return new Response(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
  } catch (err) {
    console.error('Twilio SMS webhook error:', err)
    return new Response(TWIML_EMPTY, { headers: { 'Content-Type': 'text/xml' } })
  }
}
