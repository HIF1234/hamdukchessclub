# Hamduk Hub

Here is every single feature of the Hamduk Chess Club dashboard — one unified system, RBAC controls what each role sees and can do:

**AUTHENTICATION & ACCESS**

- Sign up with full name, email, password, role selection (member or school)

- Email verification link or code sent on sign up via supabase

- Login with email and password

- Google OAuth login

- Forgot password flow via email link

- Password reset with token expiry

- First time login onboarding wizard (profile setup, plan selection, payment)

- Remember me on login

- Session timeout after configurable inactivity period

- Automatic access unlock via Paystack webhook on payment success

- Manual payment verification by admin for bank transfers

- Account state management (unverified, pending payment, active, expired, suspended)

- Locked dashboard state with clear messaging and upgrade prompt for unpaid accounts

- Role based access control — one dashboard, content and navigation restricted per role (Super Admin, School Admin, Tutor, Member)

- Permission inheritance — member views expand automatically as subscriptions are added without re-login

---

**PROFILE & PERSONAL SETTINGS**

- View and edit full profile (name, photo, phone number, date of birth, gender, location, short bio)

- Upload and crop profile photo

- Change email with re-verification flow

- Change password requiring current password confirmation

- Enable two factor authentication via authenticator app (Google Authenticator, Authy)

- Enable two factor authentication via SMS as fallback

- Backup codes generation and download for 2FA recovery

- Disable 2FA with password confirmation

- View all active login sessions with device name, browser, location, and time

- Revoke any individual active session remotely

- Revoke all other sessions with one click

- View full login history (time, device, IP address, location, success or failed)

- Notification preferences (toggle email, in-app, SMS independently per event — class reminders, tournament alerts, payment due, results, announcements, messages)

- Timezone preference setting

- Dark mode and light mode toggle

- Language preference (English default, expandable)

- Profile visibility setting (members only or public)

- Download personal data export (GDPR compliance)

- Submit account deletion request with confirmation and grace period

- View linked school name and cohort (student members)

- View membership level badge on profile (Beginner, Intermediate, Advanced)

- View chess rating prominently on profile

- View member since date

- View total games played, win rate, tournaments entered on profile

---

**ONBOARDING FLOW**

- Step 1 — Complete profile (name, photo, date of birth, phone, location)

- Step 2 — Select membership type (club only, club plus lecture tier)

- Step 3 — Select billing cycle (monthly or annual with annual savings shown)

- Step 4 — Select lecture level if applicable (Beginner, Intermediate, Advanced)

- Step 5 — Payment via Paystack (card, bank transfer, USSD, mobile money)

- Step 6 — Confirmation screen with what is now unlocked

- Onboarding progress indicator so user knows what step they are on

- Ability to pause and resume onboarding

- School onboarding — Step 1 school details (name, address, contact person, phone), Step 2 select program tier (Starter, Standard, Premium), Step 3 payment, Step 4 confirmation and tutor assignment notification

- Skip optional fields with ability to complete later from profile settings

- Welcome email sent on successful onboarding completion via resend

---

**HOME OVERVIEW — SUPER ADMIN VIEW**

- Total active members count with week on week change indicator

- Total schools enrolled count with new this month indicator

- Total active tutors count

- Total revenue this month with comparison to last month

- Total revenue this year

- Pending payment verifications count (bank transfers awaiting manual approval) with quick action link

- New member signups this week

- Active tournaments count

- Total games played across the club this month

- Upcoming classes today count

- Quick action buttons (create tournament, add member, add tutor, post announcement)

- Recent activity feed (latest signups, payments, suspensions, tournament registrations)

- System health indicator (Paystack webhook status, email service status)

---

**HOME OVERVIEW — SCHOOL ADMIN VIEW**

- Total students enrolled in the school

- Active classes this week count

- Upcoming tournaments students are registered for

- School subscription plan name and days until expiry

- Attendance rate across all school classes this term

- Number of students with overdue progress reviews

- Assigned tutors count

- Recent student activity feed (new enrollments, attendance marked, results posted)

- Quick action buttons (add student, register for tournament, message tutor)

---

**HOME OVERVIEW — TUTOR VIEW**

- Today's class schedule with times, levels, and student counts

- Total students currently assigned

- Upcoming sessions this week

- Pending attendance sessions to mark

- Number of students with no recent session notes (needs attention)

- Recent messages from students and admins

- Quick action buttons (mark attendance, write session note, set availability)

- My schedule summary for the week in a compact view

---

**HOME OVERVIEW — MEMBER VIEW**

- Personal chess rating displayed prominently with rating change this month

- Current rank among all club members

- Level badge (Beginner, Intermediate, Advanced)

- Next class time, tutor name, and join button (active only when class is live)

- Upcoming tournament registrations

- Membership status card with plan name, expiry date, and renew button

- Recent match results (last 5 games with result and rating change)

- Latest club announcements (top 3 with read more link)

- Quick action buttons (play casual game, browse tournaments, book session)

- Locked feature prompts with upgrade call to action for unsubscribed sections

---

**MEMBER MANAGEMENT — ADMIN**

- View all members in a full searchable sortable paginated table

- Filter by role, membership level, payment status, membership type, linked school, date joined, last active

- Search by name or email

- View individual member full profile with all details, payment history, class history, match history

- Approve a pending member registration

- Suspend a member with mandatory reason field and optional duration

- Reactivate a suspended member

- Manually assign or change a member's role (promote to tutor, school admin, etc)

- Manually assign or change a member's level (Beginner, Intermediate, Advanced)

- Link a member to a school

- Unlink a member from a school

- Manually subscribe a member to a lecture tier

- Remove a member's lecture subscription

- View a member's full payment history with dates, amounts, method, and status

- Manually mark a bank transfer payment as verified with reference number logged

- Send a direct message to any member

- Send a broadcast message to a filtered group of members

- Export member list as CSV with selected fields

- Bulk actions (suspend selected, export selected, message selected)

---

**SCHOOL MANAGEMENT — ADMIN**

- View all registered schools in searchable sortable paginated table

- Filter by program tier, subscription status, location, payment status, date registered

- Search by school name or contact person

- View individual school full profile (name, address, contact, program tier, students, tutors, payment history)

- Onboard a new school manually with all details

- Assign program tier (Starter, Standard, Premium)

- Upgrade or downgrade a school's program tier

- Assign one or more tutors to a school

- Remove a tutor from a school

- View all students enrolled under a school with their individual stats

- Suspend a school account with reason

- Reactivate a suspended school

- View full payment history for the school

- Manually verify school bank transfer payment

- Send message to school admin

- Export school list as CSV

---

**TUTOR MANAGEMENT — ADMIN**

- View all tutors in searchable sortable table

- Filter by assigned schools, class level, availability, active status

- View individual tutor full profile with assigned schools, students, class history, session logs

- Add a new tutor account (sends invite email with setup link)

- Edit tutor profile details

- Assign tutor to a school

- Assign tutor to individual member sessions

- Remove tutor assignments from school or member

- View tutor's full class schedule in calendar view

- View tutor's full student list with progress indicators

- View all session logs and notes submitted by tutor

- Deactivate a tutor account

- Reactivate a tutor account

- Export tutor performance data

---

**CLASS MANAGEMENT — ADMIN**

- Create a new class (title, description, level — Beginner/Intermediate/Advanced, type — group or individual, tutor, school if applicable, capacity, date, time, duration, recurring schedule or one off)

- Edit any class details

- Cancel a class with automatic notification to all enrolled members and tutor

- Delete a class permanently

- View all classes in calendar view (week and month)

- View all classes in list view with filters

- Filter classes by level, tutor, school, type, date range, status

- View all students enrolled in any class

- Manually enroll a member into a class

- Remove a member from a class

- View full attendance records for any class across all sessions

- View session notes submitted by tutor per class per session

- View resources uploaded for any class

- Duplicate a class to create a similar one quickly

---

**TUTOR FEATURES**

- Overview panel showing today's schedule, total students, week's upcoming sessions, pending attendance

- Full calendar view of all classes (group lectures and individual sessions together)

- Switch between day, week, and month calendar views

- Click any class on calendar to see full details (students list, level, notes history, resources)

- Mark attendance for each student in a session with present, absent, or late status

- Edit attendance record after submission within 24 hours

- Write and save session notes per student per session (visible to student, school admin if school class, and Hamduk admin)

- View full notes history for any student across all past sessions

- View student progress dashboard per student (rating trend chart, sessions attended, attendance rate, notes history, resources accessed)

- Upload resources for a class (PDF, image, external link, chess puzzle FEN position)

- Share a specific resource with an individual student

- Set weekly availability slots for individual one on one sessions

- Block out specific dates or times as unavailable

- View all individual session bookings made by members against availability

- Approve or decline a session booking request

- Receive in-app and email notification when a new individual student is assigned

- Receive notification when a class is cancelled, rescheduled, or a student is added

- Message any of my students directly

- Message school admin for school linked classes

- Message Hamduk admin

- View all my messages in unified inbox

---

**SCHOOL ADMIN FEATURES**

- Overview panel showing total students, active classes, upcoming tournaments, subscription status

- View and manage full student roster in searchable table

- Filter students by level, attendance rate, class, progress status

- Add a new student to the school roster (name, email, date of birth, level)

- Bulk import students via CSV upload

- Remove a student from the roster

- View individual student full profile (level, rating, attendance rate, classes enrolled, progress notes from tutor, tournament history)

- View attendance records per student per class with percentage calculation

- View full progress report per student (rating trend chart over time, sessions attended, tutor notes timeline, resources accessed, homework completion)

- Flag a student for tutor attention from the dashboard

- Register one or multiple students for an eligible tournament

- View all tournaments students are currently registered for

- View live tournament bracket and results for registered students

- View final tournament standings and results history

- View class schedule for all school classes with tutor info and room or link details

- View assigned tutor profiles with contact information

- Message any assigned tutor directly

- Receive and read all announcements from Hamduk Chess admin

- View current subscription plan details (Starter, Standard, Premium) with features listed

- View subscription start date, expiry date, and next renewal date

- Initiate subscription renewal

- Request program tier upgrade or downgrade (sent to admin for approval)

- View full payment history with dates, amounts, and receipts

- Download individual payment receipts as PDF

- View term calendar showing all class dates, holidays, and events for the term

---

**MEMBER FEATURES — ALL MEMBERS SEE THESE**

- Personal chess rating displayed with full historical trend chart (week, month, all time)

- Current rank among all club members with percentile indicator

- Level badge (Beginner, Intermediate, Advanced) with criteria for next level shown

- Total games played, wins, losses, draws with win rate percentage

- Full match history in paginated table (opponent, result, date, rating change per game, game type)

- Head to head record against any specific member

- Play casual games against other online members on in-app chess board

- Play against computer bot at adjustable difficulty levels

- View all tournaments (public and members-only clearly labeled with lock icon for members-only)

- See member discounted entry fee versus public entry fee clearly shown on each tournament

- Register for an eligible tournament with entry fee payment via Paystack

- View all my registered tournaments with status (upcoming, in progress, completed)

- View live tournament bracket and current round pairings

- View tournament results and final standings

- View club news and announcements with full read view

- View and read blog posts linked from public website

- Send a message to admin

- View all in-app notifications with read and unread states

- Mark individual notifications as read

- Mark all notifications as read

- Notification history going back 90 days

- View membership plan name, billing cycle, expiry date

- View full payment history with downloadable receipts

- Renew membership before or after expiry

- Upgrade membership plan or lecture tier

- Switch between monthly and annual billing

---

**MEMBER FEATURES — ONLY IF LECTURE SUBSCRIPTION IS ACTIVE**

- View my class schedule with class name, level, tutor, time, and type (group or individual)

- Join live class button becomes active exactly at class start time

- Countdown timer to next class shown on dashboard

- In-app live classroom with shared chess board (tutor controls board, students observe and interact when granted control)

- Voice channel in classroom (tutor speaks, students can unmute if permitted)

- Video feed showing tutor (student video optional and togglable)

- Text chat within the live classroom

- Board puzzle mode where tutor sets a position for students to solve live

- Class recording saved automatically and accessible to enrolled students after class ends

- View all past class recordings

- View and download resources uploaded by tutor (PDFs, puzzles, links)

- View my progress report (rating trend, sessions attended, attendance rate, tutor notes timeline)

- View tutor profile, bio, and rating

- Book an individual session from tutor's published availability slots (individual subscribers only)

- Reschedule a booked individual session (within cancellation policy window)

- Cancel a booked individual session

- Receive confirmation notification when tutor approves a session booking

- Message tutor directly

---

**MEMBER FEATURES — ONLY IF SCHOOL LINKED**

- View my school name, program tier, and cohort on profile and dashboard

- View school group class schedule separately from individual schedule

- Join school group class when it is active via same in-app classroom

- Progress report shared with school admin automatically

- Tutor notes from school classes visible in progress report

---

**TOURNAMENT MANAGEMENT — ADMIN**

- Create a tournament with full details (name, description, banner image, start date, end date, registration open date, registration close date, location or online, prize description)

- Set tournament type (public open, members-only, inter-school, junior age restricted)

- Set entry fee for public participants

- Set discounted entry fee for club members (auto applied when member registers)

- Set maximum number of participants

- Set number of Swiss rounds

- Toggle whether tournament appears on public website

- Publish or unpublish tournament

- Cancel a tournament with bulk notification to all registered participants and optional refund flag

- View all registered participants in a table (name, role, payment status, school if applicable)

- Manually add a participant

- Manually remove a participant with notification

- Generate Swiss system pairings automatically for each round

- View full bracket with all rounds and pairings

- Input match results per pairing per round

- Auto update standings, tiebreakers, and next round pairings after results input

- Override a result manually with reason logged

- Publish round results visible to all participants

- Publish final standings and winner

- Award winner badge or title to top finishers (reflected permanently on their profile and match history)

- View full history of all past tournaments with results

- Filter tournament history by type, date, participants, status

- Export participant list and results as CSV

---

**LIVE CLASSROOM**

- Shared interactive chess board visible to tutor and all enrolled students simultaneously

- Tutor moves pieces and all students see movement in real time

- Tutor grants board control to a specific student for practice or demonstration

- Tutor reclaims board control instantly

- Tutor can reset board to starting position or any saved position (FEN input)

- Tutor can load and present pre-saved puzzles or game positions mid class

- Tutor can annotate moves with arrows and highlights visible to all students

- Voice channel with tutor speaking and students able to request to speak

- Tutor mutes or unmutes individual students

- Tutor mutes all students at once

- Video feed of tutor displayed to students

- Students can toggle their own video on or off

- Text chat panel within the classroom visible to all

- Tutor can pin a message in chat for all to see

- Participant list panel showing who is present in the session

- Tutor can remove a disruptive student from the session

- Class countdown timer visible to tutor and students

- 5 minute warning notification before class ends

- Class ends automatically at scheduled time

- Session recorded automatically from start to end

- Recording processed and made available to enrolled students within the platform after class

- Students can rewatch recordings at any time

- Tutor can choose to not record a session before it starts

---

**PAYMENTS & SUBSCRIPTIONS — ADMIN**

- View all transactions in searchable sortable paginated table

- Filter by payment method, status, amount range, date range, user, role

- View individual transaction details (user, plan, amount, method, reference, timestamp, webhook status)

- Manually verify a bank transfer with reference number and notes

- Mark a payment as failed or disputed

- View Paystack webhook logs (success, failed, retried)

- View revenue breakdown by membership type, lecture tier, school program, tournament entry

- View total revenue chart (daily, weekly, monthly, annual)

- View churn data (members who did not renew per period)

- Issue a manual refund flag (processed externally, logged in system)

- Set and update pricing for each plan (club membership monthly, club membership annual, lecture tiers, school programs, tournament entry fees)

- Set member discount percentage for tournament entry fees

- Configure grace period duration for expired accounts before full lockout

- Export full transaction history as CSV

---

**ANNOUNCEMENTS & COMMUNICATIONS — ADMIN**

- Create an announcement with title, body, optional image, and target audience (all users, members only, schools only, tutors only, specific level, specific school)

- Schedule an announcement to publish at a future date and time

- Publish an announcement immediately

- Edit a published announcement

- Delete an announcement

- View all announcements with publish date, target, and read rate

- Pin an announcement to the top of all dashboards

- Send a broadcast email to a filtered group of users

- Create and send a newsletter to all members

- View message inbox as admin (all conversations between any user and admin)

- Reply to any user message from admin inbox

- View all direct messages across the platform (moderation view)

---

**ANALYTICS & REPORTS — ADMIN**

- Total revenue chart with daily, weekly, monthly, annual toggle

- Revenue breakdown by membership type, lecture tier, school program tier, tournament fees

- Member growth chart over time with new signups and churned members

- Active versus inactive member ratio with trend

- Membership level distribution chart (how many Beginner, Intermediate, Advanced)

- School enrollment trend over time

- School program tier distribution (how many Starter, Standard, Premium)

- Tutor performance report (sessions delivered, students assigned, average attendance rate per tutor)

- Top rated players leaderboard (filterable by level, school, age group)

- Most improved players this month by rating gain

- Tournament participation rate per tournament

- Class attendance rate across all classes and per individual class

- Student progress report across all schools (for school admin reports)

- Churn rate per period with renewal rate comparison

- Payment method breakdown (Paystack card vs bank transfer vs USSD)

- Export any report as CSV

- Export any report as PDF

---

**AUDIT LOG & SECURITY — ADMIN**

- Full audit log of every action taken by every user (login, profile update, payment, role change, suspension, class creation, result input, everything)

- Filter audit log by user, role, action type, date range, IP address

- Search audit log by keyword

- View failed login attempts across all accounts with IP and timestamp

- View accounts with multiple failed login attempts flagged automatically

- Manually lock an account after suspicious activity

- Unlock a locked account

- View all active sessions across all users (user, device, IP, last active)

- Force logout any specific user session remotely

- Force logout all sessions for a specific user

- View 2FA adoption rate across all users

- Export audit log as CSV

---

**NOTIFICATIONS SYSTEM**

- In-app notification bell with live unread count badge

- Notification dropdown showing latest 10 with mark all read option

- Full notifications page with all history paginated and filterable

- Email notification for class reminder 24 hours before

- Email notification for class reminder 1 hour before

- Email notification for tournament registration confirmation

- Email notification for tournament round pairings published

- Email notification for tournament result published

- Email notification for payment confirmation with receipt attached

- Email notification for payment expiry warning 14 days before expiry

- Email notification for payment expiry warning 3 days before expiry

- Email notification for account suspension with reason

- Email notification for account reactivation

- Email notification for tutor assignment confirmation (member receives this)

- Email notification for new student assigned (tutor receives this)

- Email notification for new school class scheduled (school admin receives this)

- Email notification for session booking confirmation (tutor and member both receive)

- Email notification for session booking cancellation

- SMS notification for class reminder 1 hour before (if opted in)

- SMS notification for payment expiry warning (if opted in)

- Push notification support for mobile browsers (if opted in)

---

**IN-APP MESSAGING**

- Unified message inbox for every user

- Compose a new message to any user (restricted by role — members can message their tutor and admin only, tutors can message their students and admin and school admins, school admins can message tutors and admin, admin can message anyone)

- Message thread view with timestamps and read receipts

- Unread message count badge on inbox icon

- Search message history by keyword or sender

- Attach a file to a message (PDF, image)

- Admin moderation view of all platform messages

- Archive a conversation

- Report a message to admin (member facing)

- Delete a message (sender only, within 10 minutes)

---

**LEADERBOARD**

- Global leaderboard of all members ranked by chess rating

- Filter leaderboard by level (Beginner, Intermediate, Advanced)

- Filter leaderboard by school

- Filter leaderboard by time period (this month, this term, all time)

- Most improved players ranked by rating gain this month

- Tournament winners hall of fame listing all past tournament champions

- Top schools ranked by average student rating

- Each leaderboard entry shows rank, name, photo, rating, level badge, and rating change

---

**CALENDAR & SCHEDULING**

- Club-wide calendar visible to all users (filtered to show relevant events per role)

- Classes shown on calendar (color coded by level and type)

- Tournaments shown on calendar

- Announcements and events shown on calendar

- Export calendar to Google Calendar or iCal

- Tutor sets availability on calendar for individual sessions

- Members book individual sessions directly from calendar availability view

- Admin can add custom events to the club calendar

- Term dates and holiday blocks shown on calendar

---

**CHESS PLAY — CASUAL & TRAINING**

- In-app chess board for casual games between members

- Matchmaking to find an available opponent at similar rating

- Challenge a specific member to a game

- Accept or decline a game challenge

- Play against computer bot at adjustable difficulty (Beginner, Intermediate, Advanced, Expert)

- Game clock options (bullet, blitz, rapid, classical time controls)

- Move history panel showing all moves in algebraic notation during and after game

- Resign or offer draw during a game

- Game result recorded automatically to match history with rating adjustment

- Post-game analysis board to review the game move by move

- Puzzle of the day on the dashboard (one daily tactical puzzle for all members)

- Puzzle library filterable by theme (pins, forks, checkmates, endgames) and difficulty

- Track puzzle solve rate and streak

- Tutor can assign specific puzzles to students from the puzzle library

---

That is every feature. The full system. Ready to talk about how to build it whenever you say go.

this is hamduk chess Club its not a public facing it strsight up login no landing page, apart from auth emails sent via supabase other emails are sent via resend, payment integration we use paystack, for the chess board needed in classroom dont build from scratch we plug in a chess third party app api, same as puzzles or anything that seems like a chess app gotten feature we'll plug that in after project building has started, calendar is google calender or ical, for 2fa use the totp and ensure u add qr code and code auth so that auth app can work, ensure to add supabase so that all data are dynamic no static data or hard coded data read the existing schema and run migrations needed for smooth running, use redis cache for caching and smooth rendering,. Finally this is a large project so store all the features listed in the attached in your memory so that u can continue  building the remaining features once done with some

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hamdukchessclub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c19a82c7-095b-4848-a08f-a3e744809d5a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
