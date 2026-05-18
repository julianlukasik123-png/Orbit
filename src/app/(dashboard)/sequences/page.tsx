'use client'

import { trpc } from '@/lib/trpc'
import { Loader2, Mail, CheckCircle, Eye, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type StepEmail = {
  id: string
  stepNumber: number
  subject: string
  sendAt: string | Date
  sentAt: string | Date | null
  openedAt: string | Date | null
}

function StepBadge({ email }: { email: StepEmail }) {
  if (email.openedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <Eye size={11} /> Opened
      </span>
    )
  }
  if (email.sentAt) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
        <CheckCircle size={11} /> Sent
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
      <Clock size={11} /> {new Date(email.sendAt).toLocaleDateString()}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-green-50 text-green-700' },
    completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600' },
    cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-600' },
  }
  const s = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', s.className)}>
      {s.label}
    </span>
  )
}

export default function SequencesPage() {
  const { data: enrollments, isLoading, refetch } = trpc.sequence.listEnrollments.useQuery(
    undefined,
    { refetchInterval: 10000 }
  )
  const cancel = trpc.sequence.cancel.useMutation({ onSuccess: () => refetch() })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Sequences</h1>
        <p className="text-gray-700 mt-1">Automated AI-generated follow-up emails for high-value leads.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : !enrollments?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
              <Mail size={24} className="text-indigo-500" />
            </div>
            <p className="text-gray-700 text-sm font-medium">No sequences yet</p>
            <p className="text-gray-500 text-xs max-w-xs">
              When a lead is classified as high-value and has an email address, a 3-step sequence is automatically started.
            </p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Lead</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Step 1 — Day 1</th>
                <th className="text-left px-5 py-3">Step 2 — Day 3</th>
                <th className="text-left px-5 py-3">Step 3 — Day 7</th>
                <th className="text-left px-5 py-3">Started</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrollments.map((enrollment) => {
                const byStep = Object.fromEntries(
                  enrollment.emails.map((e) => [e.stepNumber, e])
                )
                return (
                  <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{enrollment.lead.name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{enrollment.lead.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={enrollment.status} />
                    </td>
                    {[1, 2, 3].map((step) => (
                      <td key={step} className="px-5 py-4">
                        {byStep[step] ? (
                          <div className="space-y-1">
                            <StepBadge email={byStep[step]} />
                            <p className="text-xs text-gray-500 max-w-[160px] truncate">{byStep[step].subject}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    ))}
                    <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(enrollment.startedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      {enrollment.status === 'active' && (
                        <button
                          onClick={() => cancel.mutate({ enrollmentId: enrollment.id })}
                          disabled={cancel.isPending}
                          className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          <XCircle size={13} />
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
