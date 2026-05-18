import Link from 'next/link'
import { ArrowRight, Clock, DollarSign, Zap, BarChart3, Mail, Phone } from 'lucide-react'
import { OrbitWordmark } from '@/components/shared/OrbitLogo'

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant Lead Response',
    description: 'Every new lead gets a personalised AI follow-up within seconds — not hours. First to respond wins the job.',
  },
  {
    icon: BarChart3,
    title: 'Smart Lead Scoring',
    description: 'AI automatically sorts leads into High-Value, Low-Value, and Invalid — so your team focuses on what matters.',
  },
  {
    icon: Mail,
    title: 'Automated Email & SMS Sequences',
    description: 'Multi-step follow-up sequences run on autopilot. High-value leads get premium attention, every time.',
  },
  {
    icon: Clock,
    title: '10+ Hours Saved Per Week',
    description: 'Stop chasing leads manually. Orbit handles every follow-up so you can focus on doing the actual work.',
  },
  {
    icon: DollarSign,
    title: 'Never Lose a Lead Again',
    description: 'Businesses lose tens of thousands every year to missed leads. Orbit makes sure that never happens to you.',
  },
  {
    icon: Phone,
    title: 'Works Across Every Channel',
    description: 'Leads come in via form, SMS, or phone call — Orbit captures them all and kicks off follow-up instantly.',
  },
]

const STATS = [
  { value: '10+', label: 'Hours saved per week' },
  { value: '$30k+', label: 'Saved per year in admin' },
  { value: '3x', label: 'Faster response time' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-center px-8 py-5 border-b border-gray-800/60 max-w-7xl mx-auto w-full">
        <OrbitWordmark size="md" />
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 max-w-4xl mx-auto w-full">
        <div
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border"
          style={{ color: 'var(--brand-primary)', borderColor: 'var(--brand-primary)', backgroundColor: 'rgba(79,70,229,0.1)' }}
        >
          <Zap size={12} />
          AI-Powered Sales Automation
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
          Stop Losing Leads to
          <br />
          <span style={{ color: 'var(--brand-primary)' }}>Slow Follow-Up</span>
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Orbit automatically responds to every new lead within seconds, scores them by value,
          and runs personalised email &amp; SMS follow-up sequences — completely on autopilot.
          Your business keeps winning while you sleep.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Start for free <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-gray-300 border border-gray-700 hover:bg-gray-800 transition-colors"
          >
            Sign in to your account
          </Link>
        </div>

        {/* Stats */}
        <div className="flex flex-col sm:flex-row gap-10 mt-16 pt-16 border-t border-gray-800 w-full justify-center">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-4xl font-bold text-white">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-7xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white">Everything your business needs to follow up faster</h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">
            One platform that handles the entire lead follow-up process — from first contact to closed deal.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(79,70,229,0.15)' }}
              >
                <Icon size={20} style={{ color: 'var(--brand-primary)' }} />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Industry Stats */}
      <section className="px-6 py-20 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl border border-gray-800 bg-gray-900/60 px-8 py-14">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--brand-primary)' }}>
              The cost of doing nothing
            </p>
            <h2 className="text-3xl font-bold text-white">
              Your competitors are losing leads every day.
              <br />
              <span className="text-gray-400">Are you?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                stat: '47hrs',
                description: 'The average business takes 47 hours to respond to a new lead — most customers have already moved on.',
              },
              {
                stat: '78%',
                description: 'of buyers choose the first business that responds to them. Speed isn\'t a nice-to-have — it\'s the deciding factor.',
              },
              {
                stat: '21x',
                description: 'more likely to qualify a lead if you respond within 5 minutes vs. 30 minutes. Every minute costs you.',
              },
              {
                stat: '44%',
                description: 'of salespeople give up after just one follow-up — even though 80% of deals require 5 or more touchpoints to close.',
              },
            ].map(({ stat, description }) => (
              <div key={stat} className="flex flex-col gap-3 p-6 rounded-2xl bg-gray-800/50 border border-gray-700/50">
                <p className="text-5xl font-bold" style={{ color: 'var(--brand-primary)' }}>{stat}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-600 mt-8">
            Sources: Harvard Business Review, InsideSales.com, Verse.ai, IRC Sales Solutions
          </p>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 py-20 max-w-4xl mx-auto w-full text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl px-8 py-14">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to stop losing leads?
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Set up Orbit in minutes. No contracts. No technical knowledge required.
            Your first month is completely free.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Get started for free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} Orbit. All rights reserved.
      </footer>
    </div>
  )
}
