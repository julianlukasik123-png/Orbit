import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { transcribeRecording } from '@/server/lib/transcribe'
import { classifyLead } from '@/server/lib/classifier'
import { triggerSequence } from '@/server/lib/emailSequence'
import { notifyHighValueLead } from '@/server/lib/notifyHighValueLead'

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const tenantSlug = searchParams.get('tenant')
    if (!tenantSlug) return NextResponse.json({ error: 'Missing tenant' }, { status: 400 })

    const tenant = await db.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const form = await req.formData()
    const recordingUrl = form.get('RecordingUrl') as string | null
    const callerPhone = form.get('From') as string | null
    const callSid = form.get('CallSid') as string | null

    if (!recordingUrl) return NextResponse.json({ ok: true })

    // Transcribe then create lead — both are awaited so we get the transcript before classifying
    const transcript = await transcribeRecording(recordingUrl)

    const lead = await db.lead.create({
      data: {
        tenantId: tenant.id,
        phone: callerPhone,
        message: transcript || null,
        source: 'call',
        metadata: { callSid, recordingUrl },
      },
    })

    classifyLead(
      { phone: callerPhone, message: transcript },
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

    return NextResponse.json({ ok: true, leadId: lead.id })
  } catch (err) {
    console.error('Twilio recording webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
