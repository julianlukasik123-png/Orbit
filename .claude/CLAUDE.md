# Orbit — AI Sales Follow-Up Platform

## Project overview
SaaS platform for professional businesses to automate lead management and sales follow-up.
Multi-tenant: every database query MUST be scoped to `tenantId`.
Built with Next.js 16 App Router, TypeScript, Tailwind v4, Prisma v7, tRPC v11, NextAuth v5.

## Current status: Phase 1 complete
Auth, multi-tenant DB, dashboard shell, onboarding Step 1 are all working.

## Architecture rules
- All tRPC resolvers use `tenantProcedure` (not `protectedProcedure`) when touching tenant data
- CSS variables `--brand-*` drive all theming — never hardcode brand colours in components
- Dashboard layouts (`(dashboard)/layout.tsx`) fetch brand config server-side and pass to `TenantThemeProvider`
- Registration → `/api/auth/register` POST → then `signIn('credentials')`
- Middleware at root `middleware.ts` guards all dashboard routes

## Key file locations
- DB client: `src/server/db.ts`
- Auth config: `src/server/auth.ts`
- tRPC root: `src/server/trpc/router.ts`
- tRPC context: `src/server/trpc/context.ts`
- tRPC procedures: `src/server/trpc/trpc.ts`
- Theme provider: `src/components/shared/TenantThemeProvider.tsx`
- Dashboard shell: `src/components/dashboard/AppShell.tsx`
- Prisma schema: `prisma/schema.prisma`

## Phase roadmap
1. ✅ Foundation — scaffold, auth, DB, dashboard shell
2. ⬜ Brand discovery — Serper + GPT-4o, logo upload, live theme preview
3. ⬜ Lead intake & AI classification — Typeform, Twilio SMS, call transcription, CSV
4. ⬜ Full dashboard UI — KPI cards, charts, leads table/kanban, activity feed
5. ⬜ Email/SMS sequences — React Email, BullMQ workers, tracking pixels
6. ⬜ Integrations — Gmail, Outlook, Slack, HubSpot, Zapier
7. ⬜ Billing & team — Stripe, invites, RLS hardening
8. ⬜ Production — Vercel + Railway deploy, Sentry, rate limiting

## Environment setup (before running)
1. Create Supabase project → copy DATABASE_URL + DIRECT_URL into .env.local
2. Run `npx prisma migrate dev` to create tables
3. Create Google OAuth app → copy GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET into .env.local
4. Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
5. Run `npm run dev`
