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
27. ✓ Calendar page (/calendar) — aggregates user's classes + tournaments, .ics export (Google/Apple/Outlook compatible)
    - lib/calendar/calendar.functions.ts: getMyCalendar (role-aware: super_admin all; tutor sees own classes; school owner sees school events; member sees enrollments/registrations)
    - lib/calendar/ics.ts: buildIcs helper (client-safe, RFC5545 minimal)

# Phase 9 — Performance & Rate-limiting ✓ SHIPPED
28. ✓ Upstash Redis cache + ratelimit helpers (lib/cache/redis.server.ts)
    - cached(key, ttl, loader) — graceful fallback if Redis unavailable
    - rateLimit(id, {name, limit, window}) — sliding window via @upstash/ratelimit
    - Applied to leaderboard (120s), plans (300s, invalidated on opt-in), paystack init (5/min/user), msg send (30/min/user)

# Phase 10 — In-app Messaging ✓ SHIPPED
29. ✓ messages table (sender_id, recipient_id, thread_id, subject, body, read_at) + RLS (sender/recipient read, sender insert, recipient mark-read)
30. ✓ lib/messages/messages.functions.ts: listConversations, getConversation (auto-marks read), sendMessage (writes notification + audit), listMessageContacts (members → staff only; staff → anyone)
31. ✓ /messages route: inbox + thread + compose dialog (refetch every 10–15s); sidebar entry added

# Deferred
- Email/SMS notifications (Resend / SMS provider keys)
- Realtime channel for messages (currently poll every 10s)

# Phase 11 — Storage & Uploads ✓ SHIPPED
32. ✓ Buckets: avatars (5MB), school-logos (5MB, +svg), tournament-banners (10MB) — all public-read, RLS scoped by folder = owner id
33. ✓ schools.logo_url + tournaments.banner_url columns
34. ✓ lib/uploads/upload.ts (uploadImage) + components/uploads/avatar-uploader.tsx; wired into /settings; schools table shows logo thumbnail

# Phase 12 — 2FA TOTP ✓ SHIPPED
35. ✓ Uses Supabase Auth MFA (built-in) — no DB schema, no otplib/qrcode deps. QR code comes from `data.totp.qr_code` (SVG data URL).
36. ✓ components/security/totp-settings.tsx — enroll/verify/disable flow in /settings (list factors, friendly name, 6-digit verify, unenroll w/ confirm)
37. ✓ /verify-2fa route — challenges user post-login when AAL upgrade required; signs out option
38. ✓ _authenticated layout gates on `mfa.getAuthenticatorAssuranceLevel()` — if currentLevel !== nextLevel and nextLevel='aal2', redirect to /verify-2fa

# Integrations (plug-in later when keys provided)
- Chess board / puzzles API
- Paystack keys
- Resend API key
- Google Calendar API
- SMS provider
- Redis (Upstash recommended)

# Phase 13 — Account security & preferences ✓ SHIPPED
39. ✓ profiles.notification_prefs jsonb (channels: in_app/email/sms × events: class_reminders, tournament_alerts, payment_due, results, announcements, messages)
40. ✓ login_events table (device/browser/ip/location/method) + RLS (own rows; super_admin all); written by recordLoginEvent server fn via supabaseAdmin, called after password + Google sign-in
41. ✓ lib/account/account.functions.ts: getNotificationPrefs, updateNotificationPrefs, recordLoginEvent, listLoginHistory
42. ✓ /settings additions: notification prefs matrix, sign-in activity list, "Sign out other devices" (supabase signOut scope:others), change email (re-verify via /auth/callback), change password (re-auth with current password first)
43. Note: app is dark-only by design — no light/dark toggle. SMS delivery pending provider keys.
