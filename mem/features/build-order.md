---
name: Build order
description: Phased implementation plan for Hamduk Chess Club
type: feature
---

# Phase 1 — Foundation (current focus)
1. Design system + dark theme (chess club aesthetic: deep navy + gold)
2. Supabase schema: profiles, user_roles (separate table), schools, subscriptions, account_state
3. Auth: signup w/ role, login, Google OAuth, forgot/reset password, email verification
4. RBAC route guards (_authenticated + role-based layouts)
5. Locked-dashboard state for pending_payment / expired

# Phase 2 — Onboarding & Payments ✓ SHIPPED
6. ✓ Multi-step onboarding wizard (member 4 steps / school 3 steps)
7. ✓ Paystack init + verify server fns + /api/public/paystack-webhook (HMAC-SHA512)
8. ✓ plans + payments tables, 4 seeded plans (member beginner/standard/premium, school starter)
9. ✓ Locked-state redirects: pending_payment → onboarding → billing → payment/callback → active

# Phase 3 — Role Dashboards
10. ✓ Role-aware DashboardShell w/ sidebar (filters items by role)
11. ✓ getDashboardStats server fn (uses supabaseAdmin for super_admin aggregates)
12. ✓ Four role views: super_admin (members/schools/revenue), school_admin (my school), tutor (placeholder), member (rating/level/membership)

# Phase 4 — Core mgmt (Admin)
14. ✓ Member mgmt, School mgmt, Tutor mgmt, Class mgmt, Tournament mgmt
    - /members /schools /tutors (admin lists w/ tables)
    - /classes /tournaments (cards + create dialog + enrol/register)
    - tables: classes, class_enrollments, tournaments, tournament_participants

# Phase 5 — Classes & Live classroom (3rd-party board plug-in)
15. Class scheduling, attendance, session notes, resources
16. Live classroom shell (board API plug-in point)

# Phase 6 — Tournaments + Chess play
17. Swiss pairings, brackets, results
18. Casual play (board API), puzzles (puzzle API)

# Phase 7 — Communications & Analytics
19. Announcements, in-app messaging w/ role restrictions
20. Notifications (in-app + Resend email + opt-in SMS)
21. Leaderboard, Analytics, Audit log

# Phase 8 — Profile polish
22. 2FA TOTP w/ QR, sessions/login history, GDPR export, deletion request
23. Calendar (Google/iCal export), Redis caching layer

# Integrations (plug-in later when keys provided)
- Chess board / puzzles API
- Paystack keys
- Resend API key
- Google Calendar API
- SMS provider
- Redis (Upstash recommended)
