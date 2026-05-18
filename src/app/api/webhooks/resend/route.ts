import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { type: string; data: { email_id: string } }

    if (body.type === 'email.opened' && body.data?.email_id) {
      await db.sequenceEmail.updateMany({
        where: { resendId: body.data.email_id, openedAt: null },
        data: { openedAt: new Date() },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Resend webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
