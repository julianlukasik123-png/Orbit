'use client'

import { ClassificationBadge, type Classification } from '@/components/dashboard/ClassificationBadge'

type RecentLead = {
  id: string
  name: string | null
  classification: string
  createdAt: Date | string
}

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`
  return `${Math.floor(s / 86400)} days ago`
}

interface Props {
  leads?: RecentLead[]
}

export function RecentLeadsFeed({ leads }: Props) {
  if (!leads) {
    return (
      <ul className="divide-y divide-gray-100">
        {[...Array(3)].map((_, i) => (
          <li key={i} className="flex items-center gap-3 py-3 px-1">
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (leads.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">No leads yet.</p>
    )
  }

  return (
    <ul className="divide-y divide-gray-100">
      {leads.map((lead) => (
        <li key={lead.id} className="flex items-center justify-between gap-3 py-3 px-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-sm font-semibold text-gray-600">
              {(lead.name ?? '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {lead.name ?? <span className="text-gray-400">Unknown</span>}
              </p>
              <p className="text-xs text-gray-500">{timeAgo(lead.createdAt)}</p>
            </div>
          </div>
          <ClassificationBadge c={lead.classification as Classification} />
        </li>
      ))}
    </ul>
  )
}
