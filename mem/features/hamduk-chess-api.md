---
name: Hamduk Chess external API integration
description: How chess ratings, games, board/puzzle embeds and webhooks are wired to the external Hamduk Chess platform API
type: feature
---
All chess gameplay, ratings, puzzles and live boards come from the external
Hamduk Chess platform API — never built in-app.

- Secrets: `HAMDUK_CHESS_API_KEY` (Bearer), `HAMDUK_CHESS_API_BASE_URL`.
- Server-only client: `src/lib/hamduk/hamduk.server.ts`; sync/cache helpers in `sync.server.ts`.
- Server fns: `src/lib/hamduk/hamduk.functions.ts`.
- Tables: `hamduk_accounts` (member ↔ username link), `hamduk_ratings`, `hamduk_games`,
  `hamduk_embeds` (signed widget tokens), `hamduk_webhooks`, `hamduk_webhook_events`.
- Rating sync mirrors `classical_rating` onto `profiles.chess_rating` so the club leaderboard matches.
- Ratings/games are polled (no rating webhook exists). Webhooks handled:
  `tournament.round_complete`, `class.session_started` (sets class meeting_url + notifies enrolled).
- Webhook receiver: `/api/public/hamduk-webhook`, HMAC-SHA256 over raw body against
  signing secrets stored per webhook row in `hamduk_webhooks`.
- Member UI `/chess`; super-admin UI `/integrations`.