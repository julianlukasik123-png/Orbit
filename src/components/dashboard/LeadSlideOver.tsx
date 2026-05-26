'use client'

import { useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc'
import { X, Mail, Phone, MapPin, Briefcase, DollarSign, Clock, Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { ClassificationBadge, type Classification } from '@/components/dashboard/ClassificationBadge'

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Manual', typeform: 'Typeform', sms: 'SMS', call: 'Call', csv: 'CSV',
}

interface Props {
  leadId: string | null
  onClose: () => void
}

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={13} className="text-gray-500" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export function LeadSlideOver({ leadId, onClose }: Props) {
  const [summary, setSummary] = useState<string | null>(null)

  const { data: lead, isLoading } = trpc.lead.getById.useQuery(
    { id: leadId! },
    { enabled: !!leadId }
  )

  const summarize = trpc.lead.summarize.useMutation({
    onSuccess: (data) => setSummary(data.summary),
  })

  useEffect(() => {
    if (!lead) return
    setSummary(null)
    const meta = (lead.metadata ?? {}) as Record<string, unknown>
    if (meta.aiSummary) {
      setSummary(meta.aiSummary as string)
    } else {
      summarize.mutate({ id: lead.id })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id])

  if (!leadId) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (lead?.metadata ?? {}) as any as Record<string, unknown>
  const hasJobDetails = meta.jobType || meta.location || meta.budget || meta.timeline

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
              {(lead?.name ?? '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{lead?.name ?? 'Unknown'}</p>
              <p className="text-xs text-gray-500">{SOURCE_LABEL[lead?.source ?? ''] ?? lead?.source} · {lead ? new Date(lead.createdAt).toLocaleDateString() : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : lead ? (
            <>
              {/* Classification */}
              <div className="flex items-start gap-3">
                <div>
                  <ClassificationBadge c={lead.classification as Classification} />
                  {lead.score != null && (
                    <span className="ml-2 text-xs text-gray-500">Score: {lead.score}/10</span>
                  )}
                  {lead.classifyReason && (
                    <p className="text-xs text-gray-600 mt-1">{lead.classifyReason}</p>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</p>
                <Field icon={Mail} label="Email" value={lead.email} />
                <Field icon={Phone} label="Phone" value={lead.phone} />
                {!lead.email && !lead.phone && (
                  <p className="text-sm text-gray-400">No contact details provided.</p>
                )}
              </div>

              {/* Job details */}
              {hasJobDetails && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Job Details</p>
                  <Field icon={Briefcase} label="Job type" value={meta.jobType as string} />
                  <Field icon={MapPin} label="Location" value={meta.location as string} />
                  <Field icon={DollarSign} label="Budget" value={meta.budget as string} />
                  <Field icon={Clock} label="Timeline" value={meta.timeline as string} />
                </div>
              )}

              {/* Message */}
              {lead.message && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</p>
                  <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
                    {lead.message}
                  </div>
                </div>
              )}

              {/* AI Overview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-indigo-500" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI Overview</p>
                  </div>
                  {summary && (
                    <button
                      onClick={() => {
                        setSummary(null)
                        summarize.mutate({ id: lead.id, force: true })
                      }}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      <RefreshCw size={11} />
                      Regenerate
                    </button>
                  )}
                </div>
                <div
                  className="rounded-lg px-4 py-3 text-sm border-l-4"
                  style={{ borderColor: 'var(--brand-primary)', backgroundColor: 'color-mix(in srgb, var(--brand-primary) 6%, white)' }}
                >
                  {summarize.isPending || (!summary && !summarize.isError) ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 size={14} className="animate-spin" />
                      Generating overview…
                    </div>
                  ) : summarize.isError ? (
                    <p className="text-gray-500">Could not generate overview.</p>
                  ) : (
                    <p className="text-gray-800">{summary}</p>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}
