import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { label: 'Company info', description: 'Tell us about your business' },
  { label: 'Brand discovery', description: 'We find your logo & colours' },
  { label: 'Integrations', description: 'Connect your tools' },
  { label: 'All set!', description: 'Start using Orbit' },
]

interface Props {
  currentStep: number
}

export function OnboardingStepper({ currentStep }: Props) {
  return (
    <div className="relative flex justify-between w-full">
      {/* Background connector line sitting behind circles */}
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 z-0" />

      {STEPS.map((step, i) => {
        const done = i < currentStep
        const active = i === currentStep

        return (
          <div key={step.label} className="relative z-10 flex flex-col items-center gap-2 w-1/4">
            {/* Circle */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all',
                done && 'text-white border-transparent',
                active && 'text-white border-transparent',
                !done && !active && 'text-gray-400 border-gray-300 bg-white'
              )}
              style={
                done || active
                  ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }
                  : {}
              }
            >
              {done ? <Check size={14} /> : i + 1}
            </div>

            {/* Label — always directly under its circle */}
            <p
              className={cn(
                'text-xs font-medium text-center leading-tight px-1',
                active ? 'text-gray-900' : 'text-gray-400'
              )}
            >
              {step.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
