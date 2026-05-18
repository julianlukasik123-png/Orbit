import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { classifyLead } from '@/server/lib/classifier'

type TypeformAnswer = {
  field: { ref: string; type: string }
  type: string
  text?: string
  email?: string
  phone_number?: string
}

type TypeformPayload = {
  form_response: {
    answers?: TypeformAnswer[]
  }
}

function extractField(answers: TypeformAnswer[], types: string[]): string | null {
  for (const answer of answers) {
    if (types.includes(answer.type)) {
      return answer.text ?? answer.email ?? answer.phone_number ?? null
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const tenantSlug = searchParams.get('tenant')
    if (!tenantSlug) return NextResponse.json({ error: 'Missing tenant' }, { status: 400 })

    const tenant = await db.tenant.findUnique({ where: { slug: tenantSlug } })
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const body = await req.json() as TypeformPayload
    const answers = body.form_response?.answers ?? []

    const name = extractField(answers, ['short_text', 'text'])
    const email = extractField(answers, ['email'])
    const phone = extractField(answers, ['phone_number'])
    const message = answers
      .filter((a) => a.type === 'long_text' || a.type === 'textarea')
      .map((a) => a.text)
      .filter(Boolean)
      .join('\n') || null

    const lead = await db.lead.create({
      data: {
        tenantId: tenant.id,
        name,
        email,
        phone,
        message,
        source: 'typeform',
      },
    })

    // Classify asynchronously
    classifyLead({ name, email, phone, message }, { name: tenant.name, industry: tenant.industry })
      .then((result) =>
        db.lead.update({
          where: { id: lead.id },
          data: {
            classification: result.classification,
            classifyReason: result.reason,
            score: result.score,
            ...(!name && result.extractedName ? { name: result.extractedName } : {}),
          },
        })
      )
      .catch(() => { /* non-fatal */ })

    return NextResponse.json({ ok: true, leadId: lead.id })
  } catch (err) {
    console.error('Typeform webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
