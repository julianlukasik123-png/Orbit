import { db } from '@/server/db'
import { auth } from '@/server/auth'
import { redirect } from 'next/navigation'

export default async function InvitePage({ params }: { params: { token: string } }) {
  const invitation = await db.tenantInvitation.findUnique({
    where: { token: params.token },
    include: { tenant: true },
  })

  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-sm shadow-sm">
          <h1 className="text-lg font-bold text-gray-900 mb-2">Invalid invitation</h1>
          <p className="text-sm text-gray-600">This invitation link has expired or already been used.</p>
        </div>
      </div>
    )
  }

  const session = await auth()

  if (!session?.user) {
    redirect(`/login?callbackUrl=/invite/${params.token}`)
  }

  // Check user email matches invitation
  if (session.user.email !== invitation.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-sm shadow-sm">
          <h1 className="text-lg font-bold text-gray-900 mb-2">Wrong account</h1>
          <p className="text-sm text-gray-600">
            This invitation was sent to <strong>{invitation.email}</strong>. Please sign in with that email address.
          </p>
        </div>
      </div>
    )
  }

  // Accept the invitation
  const user = await db.user.findUnique({ where: { email: invitation.email } })
  if (user) {
    await db.tenantMember.upsert({
      where: { tenantId_userId: { tenantId: invitation.tenantId, userId: user.id } },
      create: {
        tenantId: invitation.tenantId,
        userId: user.id,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        acceptedAt: new Date(),
      },
      update: { acceptedAt: new Date() },
    })

    await db.tenantInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    })
  }

  redirect('/dashboard')
}
