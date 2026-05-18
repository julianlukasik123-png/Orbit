'use client'

import { useState, useRef } from 'react'
import { trpc } from '@/lib/trpc'
import { Loader2, Plus, RefreshCw, User, Mail, Phone, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ClassificationBadge, type Classification } from '@/components/dashboard/ClassificationBadge'
import { LeadSlideOver } from '@/components/dashboard/LeadSlideOver'

const TABS: { label: string; value: Classification | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'High Value', value: 'high_value' },
  { label: 'Low Value', value: 'low_value' },
  { label: 'Pending', value: 'pending' },
  { label: 'Unqualified', value: 'unqualified' },
  { label: 'Invalid', value: 'invalid' },
]

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Manual', typeform: 'Typeform', sms: 'SMS', call: 'Call', csv: 'CSV',
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, ''))
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

function mapRow(row: Record<string, string>) {
  return {
    name: row.name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    jobType: row.jobtype ?? row.job_type ?? row.jobtye ?? '',
    location: row.location ?? row.suburb ?? '',
    budget: row.budget ?? '',
    timeline: row.timeline ?? '',
    message: row.message ?? row.notes ?? '',
  }
}

export default function LeadsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [tab, setTab] = useState<Classification | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [jobType, setJobType] = useState('')
  const [location, setLocation] = useState('')
  const [budget, setBudget] = useState('')
  const [timeline, setTimeline] = useState('')
  const [message, setMessage] = useState('')
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: leads, isLoading, refetch } = trpc.lead.list.useQuery(
    { classification: tab === 'all' ? undefined : tab },
    { refetchInterval: 5000 }
  )

  const create = trpc.lead.create.useMutation({
    onSuccess: () => {
      setShowForm(false)
      setName(''); setEmail(''); setPhone(''); setJobType('')
      setLocation(''); setBudget(''); setTimeline(''); setMessage('')
      refetch()
    },
  })

  const importCsv = trpc.lead.importCsv.useMutation({
    onSuccess: (result) => {
      setImportResult(result)
      refetch()
      setTimeout(() => setImportResult(null), 5000)
    },
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    create.mutate({ name, email, phone, jobType, location, budget, timeline, message })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = parseCsv(text).map(mapRow)
      importCsv.mutate({ rows })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-700 mt-1">All leads captured and classified by AI.</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importCsv.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
          >
            {importCsv.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Import CSV
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <Plus size={16} />
            Add lead
          </button>
        </div>
      </div>

      {importResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700 font-medium">
          ✓ Imported {importResult.imported} lead{importResult.imported !== 1 ? 's' : ''}
          {importResult.skipped > 0 && ` · ${importResult.skipped} skipped (empty rows)`}
        </div>
      )}

      {/* Add lead form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4"
        >
          <h2 className="font-semibold text-gray-900">New lead</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="jane@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="+61 400 000 000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">Job type</label>
              <input
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="e.g. Kitchen renovation, Hot water system"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">Location / Suburb</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="e.g. Bondi, Sydney NSW"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">Budget</label>
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="e.g. $2,000 – $5,000 or Unknown"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-800 mb-1">Timeline</label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent bg-white"
              >
                <option value="">Select timeline…</option>
                <option>ASAP / Emergency</option>
                <option>Within a week</option>
                <option>Within a month</option>
                <option>1–3 months</option>
                <option>Just getting quotes</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-800 mb-1">Additional notes</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                placeholder="Any extra context about this lead…"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-70"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {create.isPending && <Loader2 size={14} className="animate-spin" />}
              Create & classify
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === value
                ? 'border-current'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
            style={tab === value ? { borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' } : {}}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => refetch()}
          className="ml-auto p-2 text-gray-400 hover:text-gray-600"
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : !leads?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <p className="text-gray-700 text-sm">No leads yet.</p>
            <p className="text-gray-600 text-xs">Add one manually or connect Typeform to start capturing leads.</p>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Contact</th>
                <th className="text-left px-5 py-3">Message</th>
                <th className="text-left px-5 py-3">Source</th>
                <th className="text-left px-5 py-3">Classification</th>
                <th className="text-left px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <tr key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <User size={14} className="text-gray-500" />
                      </div>
                      {lead.name ?? <span className="text-gray-400">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-800">
                    <div className="space-y-0.5">
                      {lead.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail size={12} className="text-gray-500 shrink-0" />
                          {lead.email}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-gray-500 shrink-0" />
                          {lead.phone}
                        </div>
                      )}
                      {!lead.email && !lead.phone && <span className="text-gray-400">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 max-w-xs">
                    {lead.message ? (
                      <p className="truncate">{lead.message}</p>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-700">
                    {SOURCE_LABEL[lead.source] ?? lead.source}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="space-y-1">
                      <ClassificationBadge c={lead.classification as Classification} />
                      {lead.classifyReason && (
                        <p className="text-xs text-gray-600 max-w-[200px] truncate">{lead.classifyReason}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <LeadSlideOver leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
    </div>
  )
}
