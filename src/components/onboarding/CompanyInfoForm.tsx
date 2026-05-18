'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { Loader2 } from 'lucide-react'

const INDUSTRIES = [
  'Plumbing & HVAC',
  'Electrical',
  'Construction & Renovation',
  'Real Estate',
  'Legal Services',
  'Financial Services',
  'Healthcare',
  'Marketing & Advertising',
  'IT & Technology',
  'Other',
]

export function CompanyInfoForm() {
  const router = useRouter()
  const { update } = useSession()
  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [industry, setIndustry] = useState('')
  const [error, setError] = useState('')

  const createTenant = trpc.tenant.create.useMutation({
    onSuccess: async () => {
      await update()
      router.push('/onboarding/brand')
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    createTenant.mutate({ name, websiteUrl, industry })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Business name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
          placeholder="Acme Plumbing Co."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Website URL{' '}
          <span className="text-gray-600 font-normal">(used to discover your brand)</span>
        </label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
          placeholder="https://acmeplumbing.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent bg-white"
        >
          <option value="">Select your industry…</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={createTenant.isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-70"
        style={{ backgroundColor: 'var(--brand-primary)' }}
      >
        {createTenant.isPending && <Loader2 size={16} className="animate-spin" />}
        Continue
      </button>
    </form>
  )
}
