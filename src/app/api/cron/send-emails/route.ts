import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { sendEmail } from '@/server/lib/resend'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const due = await db.sequenceEmail.findMany({
    where: { sendAt: { lte: new Date() }, sentAt: null },
    include: {
      enrollment: {
        include: { lead: true },
      },
    },
  })

  let sent = 0
  for (const email of due) {
    const { enrollment } = email
    if (enrollment.status === 'cancelled') continue
    const lead = enrollment.lead
    if (!lead.email) continue

    const resendId = await sendEmail({
      to: lead.email,
      subject: email.subject,
      html: email.body,
    })

    await db.sequenceEmail.update({
      where: { id: email.id },
      data: { sentAt: new Date(), resendId },
    })

    sent++

    // Check if all steps are now sent — mark enrollment completed
    const allSent = await db.sequenceEmail.count({
      where: { enrollmentId: enrollment.id, sentAt: null },
    })
    if (allSent === 0) {
      await db.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'completed' },
      })
    }
  }

  return NextResponse.json({ sent, total: due.length })
}
