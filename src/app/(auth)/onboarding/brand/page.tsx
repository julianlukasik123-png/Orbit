'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc'
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper'
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'

const LOADING_MESSAGES = [
  'Fetching your website…',
  'Reading your brand colours…',
  'Analysing design tokens…',
  'Almost there…',
]

type DiscoveredBrand = {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string
  logoUrl: string | null
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-10 h-10 rounded-xl border border-gray-200 shadow-sm"
        style={{ backgroundColor: color }}
      />
      <p className="text-xs text-gray-700 text-center leading-tight">{label}</p>
      <p className="text-xs font-mono text-gray-600">{color}</p>
    </div>
  )
}

export default function OnboardingBrandPage() {
  const router = useRouter()
  const [msgIndex, setMsgIndex] = useState(0)

  const discover = trpc.brand.discover.useMutation()
  const apply = trpc.brand.save.useMutation({
    onSuccess: () => router.push('/onboarding/integrations'),
  })

  useEffect(() => {
    discover.mutate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!discover.isPending) return
    const interval = setInterval(() => {
      setMsgIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1))
    }, 1800)
    return () => clearInterval(interval)
  }, [discover.isPending])

  const brand = discover.data as DiscoveredBrand | null | undefined

  function handleApply() {
    if (!brand) return
    apply.mutate(brand)
  }

  function handleSkip() {
    router.push('/onboarding/integrations')
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
      <OnboardingStepper currentStep={1} />

      {/* Loading */}
      {discover.isPending && (
        <div className="flex flex-col items-center text-center gap-4 py-8">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Discovering your brand</h1>
            <p className="text-sm text-gray-700 mt-1">{LOADING_MESSAGES[msgIndex]}</p>
          </div>
        </div>
      )}

      {/* No website URL — discovery returned null */}
      {!discover.isPending && !discover.isError && brand === null && (
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <AlertCircle size={40} className="text-amber-400" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">No website found</h1>
            <p className="text-sm text-gray-700 mt-1 max-w-sm">
              We couldn&apos;t discover brand colours because no website URL was provided.
              You can set your brand colours later in Settings.
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="mt-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Continue with default theme <ArrowRight size={14} className="inline ml-1" />
          </button>
        </div>
      )}

      {/* Discovery error */}
      {discover.isError && (
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <AlertCircle size={40} className="text-red-400" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Discovery failed</h1>
            <p className="text-sm text-gray-700 mt-1 max-w-sm">
              We couldn&apos;t reach your website. You can retry or continue with the default
              theme and update your brand colours in Settings later.
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => { setMsgIndex(0); discover.mutate() }}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={handleSkip}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Success — show brand preview */}
      {!discover.isPending && !discover.isError && brand && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-green-500 shrink-0" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Brand discovered</h1>
              <p className="text-sm text-gray-700">
                Here&apos;s what we found — apply it to your dashboard or skip.
              </p>
            </div>
          </div>

          {/* Logo */}
          {brand.logoUrl && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.logoUrl}
                alt="Discovered logo"
                className="h-10 max-w-[120px] object-contain rounded"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <p className="text-xs text-gray-700">Logo detected from your website</p>
            </div>
          )}

          {/* Colour swatches */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Colours</p>
            <div className="flex gap-6 flex-wrap">
              <ColorSwatch color={brand.primaryColor} label="Primary" />
              <ColorSwatch color={brand.secondaryColor} label="Secondary" />
              <ColorSwatch color={brand.backgroundColor} label="Background" />
              <ColorSwatch color={brand.textColor} label="Text" />
            </div>
          </div>

          {/* Font */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center gap-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide shrink-0">Font</p>
            <p className="text-sm text-gray-800 font-medium">{brand.fontFamily}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleApply}
              disabled={apply.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-70 transition-opacity"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {apply.isPending && <Loader2 size={14} className="animate-spin" />}
              Apply this theme
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Skip, use default
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
