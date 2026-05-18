export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    leadLimit: 50,
    priceId: null,
    features: ['50 leads/month', 'AI classification', 'Manual lead entry', 'Basic dashboard'],
  },
  starter: {
    name: 'Starter',
    price: 75,
    leadLimit: 500,
    priceId: process.env.STRIPE_PRICE_STARTER ?? null,
    features: ['500 leads/month', 'AI classification', 'Email sequences', 'SMS inbox', 'Typeform integration'],
  },
  pro: {
    name: 'Pro',
    price: 250,
    leadLimit: 2000,
    priceId: process.env.STRIPE_PRICE_PRO ?? null,
    features: ['2,000 leads/month', 'Everything in Starter', 'Call transcription', 'Priority support', 'Custom branding'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 500,
    leadLimit: -1,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
    features: ['Unlimited leads', 'Everything in Pro', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
  },
} as const

export type PlanKey = keyof typeof PLANS

export function getPlanFromPriceId(priceId: string): PlanKey {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) return key as PlanKey
  }
  return 'free'
}
