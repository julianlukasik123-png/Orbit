import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper'
import Link from 'next/link'
import { Plug } from 'lucide-react'

const INTEGRATIONS = ['Gmail', 'Outlook', 'Twilio (SMS)', 'Slack', 'HubSpot']

export default function OnboardingIntegrationsPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
      <div className="flex justify-center">
        <OnboardingStepper currentStep={2} />
      </div>

      <div className="flex flex-col items-center text-center gap-3 py-2">
        <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
          <Plug size={28} className="text-indigo-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Connect your tools</h1>
        <p className="text-sm text-gray-500 max-w-sm">
          Orbit integrates with the tools your business already uses.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {INTEGRATIONS.map((name) => (
          <div
            key={name}
            className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 bg-gray-50"
          >
            <span className="text-sm font-medium text-gray-700">{name}</span>
            <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded px-2 py-0.5">
              Phase 6
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/onboarding/complete"
        className="block w-full text-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white"
        style={{ backgroundColor: 'var(--brand-primary)' }}
      >
        Continue →
      </Link>
    </div>
  )
}
