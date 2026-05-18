import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper'
import Link from 'next/link'
import { Rocket } from 'lucide-react'

export default function OnboardingCompletePage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
      <div className="flex justify-center">
        <OnboardingStepper currentStep={3} />
      </div>

      <div className="flex flex-col items-center text-center gap-3 py-4">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <Rocket size={32} className="text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">You&apos;re all set!</h1>
        <p className="text-sm text-gray-500 max-w-sm">
          Your Orbit account is ready. Head to your dashboard to explore what&apos;s been built
          so far, and watch it grow with each new phase.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="block w-full text-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white"
        style={{ backgroundColor: 'var(--brand-primary)' }}
      >
        Go to Dashboard →
      </Link>
    </div>
  )
}
