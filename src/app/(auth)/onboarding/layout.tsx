import { OrbitWordmark } from '@/components/shared/OrbitLogo'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-10">
          <OrbitWordmark size="lg" />
        </div>
        {children}
      </div>
    </div>
  )
}
