---
name: Full feature spec
description: Complete Hamduk Chess Club feature inventory across every module
type: feature
---

# AUTH & ACCESS
- Signup: full name, email, password, role select (member or school)
- Email verification via Supabase
- Login email/password, Google OAuth, Remember me
- Forgot password + reset with token expiry
- First-time onboarding wizard (profile -> plan -> payment)
- Session timeout configurable
- Paystack webhook auto-unlock; admin manual verify for bank transfers
- Account states: unverified, pending_payment, active, expired, suspended
- Locked dashboard with upgrade CTA for unpaid
- RBAC: Super Admin, School Admin, Tutor, Member — one dashboard
- Permission inheritance — view expands as subscriptions added, no re-login

# PROFILE & SETTINGS
- View/edit profile (name, photo, phone, DOB, gender, location, bio)
- Photo upload + crop
- Change email (re-verify), change password (current pwd required)
- 2FA: TOTP (authenticator + QR), SMS fallback, backup codes, disable w/ pwd
- Active sessions list (device, browser, location, time), revoke one/all others
- Login history (time, device, IP, location, success/fail)
- Notification prefs per channel (email/in-app/SMS) per event
- Timezone, dark/light, language (EN default)
- Profile visibility (members-only or public)
- GDPR data export, account deletion request w/ grace
- Linked school + cohort, membership level badge, rating, member-since, totals

# ONBOARDING
- Member: profile -> membership type (club / club+lecture) -> billing cycle (monthly/annual w/ savings) -> lecture level -> Paystack pay -> confirmation
- School: details -> program tier (Starter/Standard/Premium) -> payment -> confirmation + tutor assignment notice
- Progress indicator, pause/resume, skip optional, welcome email via Resend

# DASHBOARDS
Super Admin: active members, schools, tutors, revenue (MTD/YTD), pending verifications, signups this week, active tournaments, games this month, classes today, quick actions, recent activity feed, system health
School Admin: students, active classes, upcoming tournaments, plan + days to expiry, attendance rate, overdue reviews, assigned tutors, recent activity, quick actions
Tutor: today's schedule, total students, week upcoming, pending attendance, needs-attention students, recent messages, quick actions, week summary
Member: rating + monthly change, club rank, level badge, next class w/ join, upcoming tournaments, plan card + renew, last 5 results, announcements, quick actions, locked-feature upsells

# MEMBER MGMT (Admin)
Search/sort/paginate/filter, view full profile w/ payment+class+match history, approve, suspend (reason+duration), reactivate, change role, change level, link/unlink school, manage lecture subs, payment history, manual bank verify, DM, broadcast to filter group, CSV export, bulk actions

# SCHOOL MGMT (Admin)
Table w/ filters, full profile, manual onboard, assign/change program tier, assign/remove tutors, view enrolled students, suspend/reactivate, payment history, manual verify, message school admin, CSV export

# TUTOR MGMT (Admin)
Table + filters, full profile w/ schools/students/sessions, add tutor (invite email), edit, assign to school/member, remove assignments, calendar view, student list w/ progress, all session logs, deactivate/reactivate, export performance

# CLASS MGMT (Admin)
Create (title, desc, level, type group/individual, tutor, school, capacity, date/time/duration, recurring), edit, cancel w/ notify, delete, calendar week/month, list w/ filters, enrolled students, manual enroll/remove, attendance records, session notes, resources, duplicate class

# TUTOR FEATURES
Overview panel, calendar (day/week/month), click class for details, mark attendance (present/absent/late), edit within 24h, session notes per student per session, full notes history, student progress dashboard (rating trend, attendance, notes, resources), upload resources (PDF/img/link/FEN), share resource w/ student, weekly availability slots, block out dates, approve/decline session bookings, notifications (assignment, cancel, reschedule, new student), DM students/school admin/Hamduk admin, unified inbox

# SCHOOL ADMIN FEATURES
Overview, student roster w/ filters, add student, CSV bulk import, remove, full student profile, attendance per student, full progress report (rating trend, sessions, tutor notes timeline, resources, homework), flag for tutor attention, register students for tournaments, view registrations, live bracket, final results, class schedule + tutor info, assigned tutor profiles, message tutors, announcements, subscription details + dates, initiate renewal, request tier upgrade/downgrade, payment history + PDF receipts, term calendar

# MEMBER FEATURES (all)
Rating w/ trend chart (week/month/all), rank + percentile, level badge + next-level criteria, totals + win rate, full match history paginated, head-to-head, casual games vs online members, vs computer (adjustable difficulty), all tournaments (public/members-only labeled), member discount entry fee shown, register w/ Paystack pay, my registrations, live bracket, final standings, club news + blog, message admin, in-app notifications (read states, mark all, 90-day history), plan + billing details, payment history + receipts, renew, upgrade plan/tier, switch monthly/annual

# MEMBER FEATURES (lecture sub active)
Class schedule, join button live at start, countdown to next class, in-app classroom (shared board, voice, video, chat, puzzle mode), auto-recorded sessions, past recordings, resources download, progress report, tutor profile + rating, book individual session from availability, reschedule/cancel within policy, booking confirmation, DM tutor

# MEMBER FEATURES (school linked)
School name/tier/cohort on profile, school group class schedule (separate), join school class via classroom, progress shared w/ school admin, tutor notes visible

# TOURNAMENT MGMT (Admin)
Create (name, desc, banner, dates, registration window, location/online, prize), type (public/members-only/inter-school/junior), public + member-discount fees, max participants, Swiss rounds, public-website toggle, publish/unpublish, cancel w/ bulk notify + refund flag, participants table, manual add/remove, auto Swiss pairings, full bracket, input results per pairing, auto-update standings + tiebreakers + next round, manual override w/ log, publish round results, publish final standings, award winner badges (permanent on profile), history filterable, CSV export

# LIVE CLASSROOM
Shared interactive board (tutor moves, all see realtime), grant/reclaim control, reset/FEN load, load saved puzzles, annotate w/ arrows+highlights, voice (request to speak, tutor mute individual/all), tutor video, student video toggle, text chat, pin message, participant list, remove disruptive student, countdown, 5-min warning, auto-end, auto-record, recording available after, rewatch, opt-out recording before start

# PAYMENTS & SUBS (Admin)
Transactions table w/ filters, details, manual bank verify w/ ref+notes, mark failed/disputed, Paystack webhook logs (success/failed/retried), revenue breakdown by type, total revenue chart (D/W/M/Y), churn data, manual refund flag (external process logged), pricing config per plan, member discount %, grace period config, CSV export

# ANNOUNCEMENTS (Admin)
Create (title, body, image, audience filter), schedule, publish now, edit, delete, list w/ read rate, pin to top, broadcast email to filter, newsletter, admin message inbox (all convos), reply, moderation view all DMs

# ANALYTICS (Admin)
Revenue chart D/W/M/Y, revenue breakdown, member growth + churn, active/inactive ratio, level distribution, school enrollment trend, tier distribution, tutor performance, top players leaderboard, most improved, tournament participation, attendance rates, student progress, churn vs renewal, payment method breakdown, CSV + PDF export

# AUDIT & SECURITY (Admin)
Full audit log every action, filters (user/role/action/date/IP), search, failed login attempts, auto-flag suspicious, manual lock/unlock, all active sessions, force logout one/all, 2FA adoption rate, CSV export

# NOTIFICATIONS
In-app bell + unread badge, dropdown w/ mark-all-read, full page paginated/filterable, email reminders (class 24h+1h, tournament reg/pairings/results, payment confirm w/ receipt, expiry 14d+3d, suspension, reactivation, tutor assignment, new student, new school class, session booking confirm/cancel), SMS (class 1h, payment expiry — opt-in), push for mobile browsers (opt-in)

# IN-APP MESSAGING
Unified inbox, compose w/ role restrictions (member->tutor+admin, tutor->students+admin+school admins, school admin->tutors+admin, admin->anyone), thread w/ timestamps + read receipts, unread badge, search, file attach (PDF/img), admin moderation view, archive, report message, delete own within 10min

# LEADERBOARD
Global by rating, filter (level/school/time period), most improved this month, tournament winners hall of fame, top schools by avg rating, each entry shows rank/name/photo/rating/badge/change

# CALENDAR
Club-wide filtered by role, classes color-coded, tournaments, announcements/events, export to Google Cal / iCal, tutor sets availability, members book from view, admin custom events, term dates + holidays

# CHESS PLAY (3rd-party board API)
Casual games between members, matchmaking by rating, challenge specific member, accept/decline, vs computer adjustable difficulty, clock options (bullet/blitz/rapid/classical), move history algebraic, resign/draw, auto record result + rating, post-game analysis, daily puzzle, puzzle library (theme + difficulty filters), solve rate + streak, tutor-assigned puzzles
