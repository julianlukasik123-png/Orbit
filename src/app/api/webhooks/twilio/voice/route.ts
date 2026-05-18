import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'

export async function POST(req: NextRequest) {
  try {
    const { searchParams, origin } = req.nextUrl
    const tenantSlug = searchParams.get('tenant') ?? ''

    const tenant = await db.tenant.findUnique({ where: { slug: tenantSlug } })
    const tenantName = tenant?.name ?? 'us'

    const recordingAction = `${origin}/api/webhooks/twilio/recording?tenant=${tenantSlug}`

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thanks for calling ${tenantName}. Please leave a message after the tone and we'll be in touch shortly.</Say>
  <Record action="${recordingAction}" transcribe="false" maxLength="120" playBeep="true" />
</Response>`

    return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } })
  } catch (err) {
    console.error('Twilio voice webhook error:', err)
    const fallback = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, something went wrong.</Say></Response>`
    return new Response(fallback, { headers: { 'Content-Type': 'text/xml' } })
  }
}
