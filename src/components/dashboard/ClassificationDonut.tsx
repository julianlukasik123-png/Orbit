'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Row = { day: string; classification: string; count: number }

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

interface Props {
  data?: Row[]
}

export function ClassificationDonut({ data }: Props) {
  if (!data) {
    return <div className="h-[220px] bg-gray-100 rounded-lg animate-pulse" />
  }

  const totals: Record<string, number> = {}
  for (const row of data) {
    totals[row.classification] = (totals[row.classification] ?? 0) + row.count
  }

  const pieData = Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([classification, value]) => ({
      name: LABEL_MAP[classification] ?? classification,
      value,
      classification,
    }))

  if (pieData.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">
        No data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
        >
          {pieData.map((entry) => (
            <Cell key={entry.classification} fill={COLOR_MAP[entry.classification] ?? '#9ca3af'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
