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
15. ✓ Class detail page w/ tabs (overview, live, resources, attendance, notes)
    - getClassDetail / updateClassNotes / updateMeetingUrl / addClassResource / removeClassResource / setAttendance
    - tutor & school-owner & super-admin manage; enrolled members join
16. ✓ Live classroom shell — meeting URL field + board API plug-in placeholder

# Phase 6 — Tournaments + Chess play
17. ✓ Tournament detail page: standings, rounds, pairings, participants
    - tables: tournament_rounds, tournament_pairings
    - generateNextRound (Swiss top-half pairing, knockout advance-on-win, avoids rematches, byes)
    - recordResult, completeTournament
18. ✓ Play & Puzzles page — board/puzzle/bot plug-in points (provider not yet wired)

# Phase 7 — Communications & Analytics
19. ✓ Announcements w/ audience targeting (all/school/members/tutors/school_admins, pinned)
    - tables: announcements (RLS: super_admin manage / school owner manage own school / audience-based view)
20. ✓ Notifications inbox (in-app) — list, mark read, mark-all-read, delete
    - table: notifications (RLS: user owns rows)
    - Email (Resend) + SMS deferred until keys provided
21. ✓ Leaderboard (rating-ranked), Analytics dashboard (signups/revenue 14d, totals, level mix), Audit log viewer

# Phase 8 — Profile polish
22. ✓ Settings page — profile edit, GDPR JSON export, deletion request (2FA placeholder)
    - lib/profile/profile.functions.ts: getMyProfile, updateMyProfile, exportMyData, requestAccountDeletion
23. ✓ Subtle UpgradeNudge (bottom-left, 8s delay, dismissible) for unpaid members
24. ✓ Billing: "Continue on free tier" link → optInFreeTier sets account_state=active
25. ✓ Billing fix: initializePayment self-heals missing profile via supabaseAdmin
26. Sidebar: removed Play & Puzzles (chess board/puzzles deferred to 3rd-party API per spec)
27. Deferred: 2FA TOTP, Calendar (Google/iCal export), Redis caching layer

# Integrations (plug-in later when keys provided)
- Chess board / puzzles API
- Paystack keys
- Resend API key
- Google Calendar API
- SMS provider
- Redis (Upstash recommended)
