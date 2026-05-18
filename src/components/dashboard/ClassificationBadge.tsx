import { cn } from '@/lib/utils'

export type Classification = 'pending' | 'high_value' | 'low_value' | 'invalid' | 'unqualified'

export const BADGE: Record<Classification, { label: string; className: string }> = {
  high_value:  { label: 'High Value',  className: 'bg-green-100 text-green-700' },
  low_value:   { label: 'Low Value',   className: 'bg-amber-100 text-amber-700' },
  pending:     { label: 'Pending',     className: 'bg-blue-100 text-blue-700' },
  unqualified: { label: 'Unqualified', className: 'bg-gray-100 text-gray-600' },
  invalid:     { label: 'Invalid',     className: 'bg-red-100 text-red-600' },
}

export function ClassificationBadge({ c }: { c: Classification }) {
  const { label, className } = BADGE[c] ?? BADGE.pending
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', className)}>
      {label}
    </span>
  )
}
