'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

type Row = { day: string; classification: string; count: number }

const CLASSIFICATIONS = ['high_value', 'low_value', 'pending', 'unqualified', 'invalid'] as const

const COLOR_MAP: Record<string, string> = {
  high_value:  '#16a34a',
  low_value:   '#d97706',
  pending:     '#2563eb',
  unqualified: '#9ca3af',
  invalid:     '#dc2626',
}

const LABEL_MAP: Record<string, string> = {
  high_value:  'High Value',
  low_value:   'Low Value',
  pending:     'Pending',
  unqualified: 'Unqualified',
  invalid:     'Invalid',
}

function buildDays(): string[] {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function pivot(data: Row[]) {
  const map = new Map<string, Record<string, number>>()
  for (const day of buildDays()) {
    map.set(day, { day_label: 0 })
  }
  for (const row of data) {
    const entry = map.get(row.day) ?? {}
    entry[row.classification] = row.count
    map.set(row.day, entry)
  }
  return Array.from(map.entries()).map(([day, vals]) => ({
    day,
    label: new Date(day + 'T00:00:00').toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
    ...vals,
  }))
}

interface Props {
  data?: Row[]
}

export function LeadVolumeChart({ data }: Props) {
  if (!data) {
    return <div className="h-[220px] bg-gray-100 rounded-lg animate-pulse" />
  }

  const chartData = pivot(data)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          interval={4}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          cursor={{ fill: '#f9fafb' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => LABEL_MAP[value] ?? value}
        />
        {CLASSIFICATIONS.map((c) => (
          <Bar key={c} dataKey={c} stackId="a" fill={COLOR_MAP[c]} radius={c === 'invalid' ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
