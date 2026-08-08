# Hamduk Chess Club — Project Memory

## Core
Project: Hamduk Chess Club dashboard. NO public landing page — auth-first, login is the entry point.
Stack: TanStack Start + Lovable Cloud (Supabase) + Redis cache + Paystack + Resend + Google Calendar/iCal.
Auth emails via Supabase; all other transactional emails via Resend.
Chess board, puzzles, and chess-engine features = plug-in 3rd-party APIs (do NOT build from scratch). Wire stubs first, plug API later.
2FA: TOTP with QR code + manual code entry (authenticator apps).
RBAC roles: Super Admin, School Admin, Tutor, Member. One dashboard, content gated per role + subscription state.
NO static/hardcoded data — everything dynamic via Supabase. Read existing schema; run migrations as needed.
Account states: unverified, pending_payment, active, expired, suspended. Locked dashboard for unpaid with upgrade CTA.

## Memories
- [Full feature spec](mem://features/full-spec) — Complete feature list across all modules (auth, profiles, onboarding, dashboards per role, member/school/tutor/class mgmt, tournaments, live classroom, payments, announcements, analytics, audit, notifications, messaging, leaderboard, calendar, chess play)
- [Build order](mem://features/build-order) — Phased implementation plan
- [Hamduk Chess API](mem://features/hamduk-chess-api) — External chess platform integration: ratings/games sync, embed tokens, webhooks, tables and routes
