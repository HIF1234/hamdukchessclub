// Server-only client for the Hamduk Chess public API.
// Docs: /api/public/v1 — bearer key must never reach the browser.

export type HamdukError = { error: string; message: string };

function baseUrl(): string {
  const raw = process.env["HAMDUK_CHESS_API_BASE_URL"];
  if (!raw) throw new Error("Hamduk Chess API is not configured.");
  return raw.replace(/\/+$/, "");
}

function apiKey(): string {
  const key = process.env["HAMDUK_CHESS_API_KEY"];
  if (!key) throw new Error("Hamduk Chess API is not configured.");
  return key;
}

export type RateInfo = { limit: number | null; remaining: number | null };

let lastRate: RateInfo = { limit: null, remaining: null };
export function lastRateInfo(): RateInfo {
  return lastRate;
}

export async function hamduk<T>(
  path: string,
  init: { method?: string; body?: unknown; query?: Record<string, string | number | undefined> } = {},
): Promise<T> {
  const url = new URL(`${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [k, v] of Object.entries(init.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
  });

  const limit = res.headers.get("x-ratelimit-limit");
  const remaining = res.headers.get("x-ratelimit-remaining");
  lastRate = {
    limit: limit ? Number(limit) : null,
    remaining: remaining ? Number(remaining) : null,
  };

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const err = parsed as HamdukError | null;
    console.error("[hamduk]", res.status, path, err?.error, err?.message);
    if (res.status === 404) throw new Error("NOT_LINKED");
    if (res.status === 429) throw new Error("Hamduk Chess rate limit reached. Please try again shortly.");
    if (res.status === 401) throw new Error("Hamduk Chess rejected the API key.");
    if (res.status === 403) throw new Error("The Hamduk Chess API key is missing a required scope.");
    throw new Error("Hamduk Chess request failed. Please try again.");
  }

  return parsed as T;
}

/* ---------- typed endpoint wrappers ---------- */

export type HamdukRating = {
  username: string;
  classical_rating: number | null;
  country: string | null;
  ratings: Array<{
    time_control: string;
    variant: string;
    rating: number;
    games_played: number;
    wins: number;
    losses: number;
    draws: number;
  }>;
};

export type HamdukGame = {
  game_id: string;
  white: string;
  black: string;
  time_control: string;
  variant: string;
  status: string;
  result: string | null;
  end_reason: string | null;
  rated: boolean;
  moves: number;
  pgn: string | null;
  white_rating_delta: number | null;
  black_rating_delta: number | null;
  created_at: string | null;
  ended_at: string | null;
};

export const fetchRating = (username: string) =>
  hamduk<HamdukRating>(`/users/${encodeURIComponent(username)}/rating`);

export const fetchGames = (username: string, limit = 20, tc?: string) =>
  hamduk<{ username: string; count: number; games: HamdukGame[] }>(
    `/users/${encodeURIComponent(username)}/games`,
    { query: { limit, tc } },
  );

export type EmbedTokenResponse = {
  token: string;
  kind: string;
  expires_at: string;
  embed_url: string;
  iframe: string;
};

export const createEmbedToken = (kind: string, config: Record<string, unknown>, ttlHours = 720) =>
  hamduk<EmbedTokenResponse>("/embed/token", {
    method: "POST",
    body: { kind, config, ttl_hours: ttlHours },
  });

export const revokeEmbedToken = (token: string) =>
  hamduk<unknown>(`/embed/token/${encodeURIComponent(token)}`, { method: "DELETE" });

export const createRemoteTournament = (body: Record<string, unknown>) =>
  hamduk<{ id: string } & Record<string, unknown>>("/tournaments", { method: "POST", body });

export const fetchStandings = (id: string) =>
  hamduk<Record<string, unknown>>(`/tournaments/${encodeURIComponent(id)}/standings`);

export const submitStandings = (id: string, body: Record<string, unknown>) =>
  hamduk<Record<string, unknown>>(`/tournaments/${encodeURIComponent(id)}/standings`, {
    method: "POST",
    body,
  });

export const createClassSession = (body: Record<string, unknown>) =>
  hamduk<{ session_id: string } & Record<string, unknown>>("/classes/session", {
    method: "POST",
    body,
  });

export const setSessionPosition = (sessionId: string, body: Record<string, unknown>) =>
  hamduk<Record<string, unknown>>(`/classes/session/${encodeURIComponent(sessionId)}/set-position`, {
    method: "POST",
    body,
  });

export const fetchSessionStudents = (sessionId: string) =>
  hamduk<Record<string, unknown>>(`/classes/session/${encodeURIComponent(sessionId)}/students`);

export const registerRemoteWebhook = (url: string, events: string[]) =>
  hamduk<{
    webhook: { id: string; url: string; events: string[]; created_at: string };
    signing_secret: string;
  }>("/webhooks", { method: "POST", body: { url, events } });

export const listRemoteWebhooks = () =>
  hamduk<{ webhooks: Array<{ id: string; url: string; events: string[]; disabled?: boolean }> }>(
    "/webhooks",
  );

export const deleteRemoteWebhook = (id: string) =>
  hamduk<unknown>(`/webhooks/${encodeURIComponent(id)}`, { method: "DELETE" });