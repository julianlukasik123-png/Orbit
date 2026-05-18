'use client'

import { trpc } from '@/lib/trpc'
import { Users, Star, Clock, TrendingUp, CalendarDays } from 'lucide-react'
import { LeadVolumeChart } from '@/components/dashboard/LeadVolumeChart'
import { ClassificationDonut } from '@/components/dashboard/ClassificationDonut'
import { RecentLeadsFeed } from '@/components/dashboard/RecentLeadsFeed'

export default function DashboardPage() {
  const { data: counts } = trpc.lead.counts.useQuery(undefined, { refetchInterval: 10000 })
  const { data: chartData } = trpc.lead.chartData.useQuery(undefined, { refetchInterval: 10000 })
  const { data: recentLeads } = trpc.lead.recent.useQuery(undefined, { refetchInterval: 10000 })

  const KPI_CARDS = [
    { label: 'Total Leads',      value: counts?.total     ?? '—', icon: Users,        description: 'All time' },
    { label: 'High-Value',       value: counts?.highValue ?? '—', icon: Star,         description: 'Ready to follow up' },
    { label: 'Pending',          value: counts?.pending   ?? '—', icon: Clock,        description: 'Awaiting AI classification' },
    { label: 'This Month',       value: counts?.thisMonth ?? '—', icon: CalendarDays, description: 'New leads this month' },
    { label: 'Conversion Rate',  value: '—',                      icon: TrendingUp,   description: 'Coming in Phase 5' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-700 mt-1">Your sales performance at a glance.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {KPI_CARDS.map(({ label, value, icon: Icon, description }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-700">{label}</p>
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                <Icon size={16} className="text-gray-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-600 mt-1">{description}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Lead Volume — Last 30 Days</h2>
          <LeadVolumeChart data={chartData} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">By Classification</h2>
          <ClassificationDonut data={chartData} />
        </div>
      </div>

      {/* Recent leads */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Recent Leads</h2>
        <RecentLeadsFeed leads={recentLeads} />
      </div>
    </div>
  )
}
