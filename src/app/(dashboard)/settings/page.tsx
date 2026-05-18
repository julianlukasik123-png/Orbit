'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Loader2, CheckCircle, Zap, ExternalLink, UserPlus, Trash2, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLANS, type PlanKey } from '@/lib/plans'

const PAID_PLANS: PlanKey[] = ['starter', 'pro', 'enterprise']

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner', admin: 'Admin', member: 'Member', viewer: 'Viewer',
}

function TeamTab() {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [showForm, setShowForm] = useState(false)

  const { data: members, refetch: refetchMembers } = trpc.team.listMembers.useQuery()
  const { data: invitations, refetch: refetchInvites } = trpc.team.listInvitations.useQuery()

  const invite = trpc.team.invite.useMutation({
    onSuccess: () => {
      setInviteEmail(''); setShowForm(false)
      refetchMembers(); refetchInvites()
    },
  })
  const remove = trpc.team.removeMember.useMutation({ onSuccess: () => refetchMembers() })
  const revoke = trpc.team.revokeInvitation.useMutation({ onSuccess: () => refetchInvites() })

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Team members</h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <UserPlus size={14} /> Invite
          </button>
        </div>

        {showForm && (
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                onClick={() => invite.mutate({ email: inviteEmail, role: inviteRole })}
                disabled={!inviteEmail || invite.isPending}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {invite.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Send invite'}
              </button>
            </div>
            {invite.error && <p className="text-xs text-red-500 mt-2">{invite.error.message}</p>}
          </div>
        )}

        <ul className="divide-y divide-gray-100">
          {members?.map((m) => (
            <li key={m.userId} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                  {m.user.name?.[0]?.toUpperCase() ?? m.user.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.user.name ?? m.user.email}</p>
                  {m.user.name && <p className="text-xs text-gray-500">{m.user.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {ROLE_LABELS[m.role] ?? m.role}
                </span>
                {m.role !== 'owner' && (
                  <button
                    onClick={() => remove.mutate({ userId: m.userId })}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {invitations && invitations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Pending invitations</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900">{inv.email}</p>
                    <p className="text-xs text-gray-500">
                      Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[inv.role] ?? inv.role}
                  </span>
                  <button
                    onClick={() => revoke.mutate({ invitationId: inv.id })}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function PlanBadge({ plan }: { plan: PlanKey }) {
  const colors: Record<PlanKey, string> = {
    free: 'bg-gray-100 text-gray-600',
    starter: 'bg-blue-50 text-blue-700',
    pro: 'bg-violet-50 text-violet-700',
    enterprise: 'bg-amber-50 text-amber-700',
  }
  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', colors[plan])}>
      {PLANS[plan].name}
    </span>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'billing' | 'team' | 'account'>('billing')

  const { data: sub, isLoading } = trpc.billing.getSubscription.useQuery()
  const { data: tenant } = trpc.tenant.getCurrent.useQuery()

  const checkout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => { if (url) window.location.href = url },
  })
  const portal = trpc.billing.createPortalSession.useMutation({
    onSuccess: ({ url }) => { window.location.href = url },
  })

  const usagePct = sub && sub.leadLimit !== -1
    ? Math.min(100, Math.round((sub.leadsThisMonth / sub.leadLimit) * 100))
    : 0

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-700 mt-1">Manage your plan and account details.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['billing', 'team', 'account'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize',
              tab === t ? 'border-current' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
            style={tab === t ? { borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' } : {}}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'billing' && (
        <div className="space-y-6">
          {/* Current plan summary */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : sub && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Current plan</p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{sub.planName}</h2>
                    <PlanBadge plan={sub.plan} />
                  </div>
                  {sub.price > 0 && (
                    <p className="text-sm text-gray-500 mt-0.5">${sub.price}/month</p>
                  )}
                </div>
                {sub.hasSubscription && (
                  <button
                    onClick={() => portal.mutate()}
                    disabled={portal.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {portal.isPending ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                    Manage billing
                  </button>
                )}
              </div>

              {/* Usage bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                  <span>Leads this month</span>
                  <span>
                    {sub.leadsThisMonth}
                    {sub.leadLimit !== -1 ? ` / ${sub.leadLimit}` : ' (unlimited)'}
                  </span>
                </div>
                {sub.leadLimit !== -1 && (
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', usagePct >= 90 ? 'bg-red-500' : 'bg-emerald-500')}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                )}
              </div>

              {sub.currentPeriodEnd && (
                <p className="text-xs text-gray-500">
                  {sub.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Upgrade plans */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              {sub?.plan === 'free' ? 'Upgrade your plan' : 'Switch plan'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PAID_PLANS.map((planKey) => {
                const plan = PLANS[planKey]
                const isCurrent = sub?.plan === planKey
                const isPopular = planKey === 'pro'

                return (
                  <div
                    key={planKey}
                    className={cn(
                      'relative bg-white border rounded-xl p-5 shadow-sm flex flex-col gap-4',
                      isCurrent ? 'border-2' : 'border-gray-200',
                    )}
                    style={isCurrent ? { borderColor: 'var(--brand-primary)' } : {}}
                  >
                    {isPopular && !isCurrent && (
                      <span
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-semibold px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                        style={{ backgroundColor: 'var(--brand-primary)' }}
                      >
                        Most popular
                      </span>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{plan.name}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        ${plan.price}
                        <span className="text-sm font-normal text-gray-500">/mo</span>
                      </p>
                    </div>
                    <ul className="space-y-1.5 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-gray-700">
                          <CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => checkout.mutate({ plan: planKey as 'starter' | 'pro' | 'enterprise' })}
                      disabled={isCurrent || checkout.isPending}
                      className={cn(
                        'w-full py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60',
                        isCurrent ? 'bg-gray-100 text-gray-500 cursor-default' : 'text-white'
                      )}
                      style={!isCurrent ? { backgroundColor: 'var(--brand-primary)' } : {}}
                    >
                      {checkout.isPending ? (
                        <Loader2 size={14} className="animate-spin mx-auto" />
                      ) : isCurrent ? (
                        'Current plan'
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <Zap size={13} /> Upgrade
                        </span>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'team' && <TeamTab />}

      {tab === 'account' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-900">Account details</h2>
          {tenant ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Business name</p>
                <p className="text-gray-900 font-medium">{tenant.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Industry</p>
                <p className="text-gray-900 font-medium">{tenant.industry ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Slug</p>
                <p className="text-gray-900 font-mono text-xs">{tenant.slug}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Website</p>
                <p className="text-gray-900 font-medium">{tenant.websiteUrl ?? '—'}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
