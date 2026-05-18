import { redirect } from 'next/navigation'
import { auth } from '@/server/auth'
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper'
import { CompanyInfoForm } from '@/components/onboarding/CompanyInfoForm'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.tenantId) redirect('/dashboard')

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
      <OnboardingStepper currentStep={0} />

      <div>
        <h1 className="text-xl font-bold text-gray-900">Tell us about your business</h1>
        <p className="text-sm text-gray-700 mt-1">
          This helps Orbit personalise your dashboard and find your brand assets.
        </p>
      </div>

      <CompanyInfoForm />
    </div>
  )
}
