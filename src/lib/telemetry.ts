import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * ============================================================================
 *  TELEMETRY — growth & login tracking
 * ============================================================================
 *  First-party, cookie-free analytics that lives entirely in the browser:
 *
 *    • sessions      — one per visit, with device / referrer / timezone
 *    • pageviews     — which sections people actually reach
 *    • sign-ins      — attributed to the Clerk user as soon as they log in
 *    • images        — provenance for anything uploaded from the dashboard
 *
 *  The store is intentionally swappable: `getSnapshot()` is the only read
 *  path, so moving this onto a shared backend later means reimplementing
 *  three functions rather than touching the dashboard.
 * ============================================================================
 */

const STORAGE_KEY = "wz.telemetry.v2";
const VISITOR_KEY = "wz.visitor.v1";
const MAX_EVENTS = 2000;
const MAX_SESSIONS = 600;

/**
 * Remote sink.
 *
 * When `VITE_ANALYTICS_URL` is set — or in a production build, where the
 * bundled `api/analytics.py` is served at `/api/analytics` — every session
 * and event is also posted to a shared Postgres store, so the dashboard can
 * show growth and logins from *all* visitors rather than one browser. With no
 * endpoint the site quietly keeps tracking locally. Nothing ever blocks on it.
 */
const ANALYTICS_URL: string =
  (import.meta.env.VITE_ANALYTICS_URL as string | undefined) ??
  (import.meta.env.PROD ? "/api/analytics" : "");

/** True when a shared backend is configured (drives the dashboard copy). */
export const isRemoteAnalyticsEnabled = ANALYTICS_URL.length > 0;

/** Fire-and-forget POST of new sessions/events. Never throws, never blocks. */
function pushRemote(payload: { sessions?: Session[]; events?: TelemetryEvent[] }): void {
  if (!ANALYTICS_URL) return;
  try {
    void fetch(ANALYTICS_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      // Survives a page unload (tab close, sign-out navigation).
      keepalive: true,
    }).catch(() => {
      /* offline or not yet deployed — local tracking already holds the data */
    });
  } catch {
    /* ignore */
  }
}

export type EventKind = "pageview" | "signin" | "signout" | "image" | "note";

export type AccountRef = {
  id: string;
  name: string;
  email: string;
};

export type TelemetryEvent = {
  id: string;
  kind: EventKind;
  at: number;
  visitor: string;
  label: string;
  account?: AccountRef;
};

export type Session = {
  id: string;
  visitor: string;
  startedAt: number;
  lastSeenAt: number;
  device: "mobile" | "tablet" | "desktop";
  browser: string;
  os: string;
  referrer: string;
  region: string;
  account?: AccountRef;
};

export type Snapshot = {
  sessions: Session[];
  events: TelemetryEvent[];
};

/* -------------------------------------------------------------------------- */
/*  Persistence                                                               */
/* -------------------------------------------------------------------------- */

const EMPTY: Snapshot = { sessions: [], events: [] };

let snapshot: Snapshot = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

function safeParse(raw: string | null): Snapshot {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as Partial<Snapshot>;
    if (!Array.isArray(parsed.sessions) || !Array.isArray(parsed.events)) return EMPTY;
    return { sessions: parsed.sessions, events: parsed.events };
  } catch {
    return EMPTY;
  }
}

function load(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  snapshot = safeParse(window.localStorage.getItem(STORAGE_KEY));
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Quota or private mode — tracking is best-effort and must never throw.
  }
}

function commit(next: Snapshot): void {
  snapshot = {
    sessions: next.sessions.slice(0, MAX_SESSIONS),
    events: next.events.slice(0, MAX_EVENTS),
  };
  persist();
  listeners.forEach((fn) => fn());
}

/* -------------------------------------------------------------------------- */
/*  Environment sniffing                                                       */
/* -------------------------------------------------------------------------- */

function detectDevice(): Session["device"] {
  const w = window.innerWidth;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (w < 768) return "mobile";
  if (w < 1024 || coarse) return "tablet";
  return "desktop";
}

function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  return "Other";
}

function detectOs(ua: string): string {
  if (/Windows/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Other";
}

function detectRegion(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    return tz.split("/").pop()?.replace(/_/g, " ") || "Unknown";
  } catch {
    return "Unknown";
  }
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

export function getVisitorId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = uid("v");
    try {
      window.localStorage.setItem(VISITOR_KEY, id);
    } catch {
      /* ignore */
    }
  }
  return id;
}

let currentSessionId: string | null = null;

/** Open a session for this visit and log the landing pageview. */
export function startSession(): void {
  load();
  if (currentSessionId) return;

  const ua = navigator.userAgent;
  const session: Session = {
    id: uid("s"),
    visitor: getVisitorId(),
    startedAt: Date.now(),
    lastSeenAt: Date.now(),
    device: detectDevice(),
    browser: detectBrowser(ua),
    os: detectOs(ua),
    referrer: document.referrer || "Direct",
    region: detectRegion(),
  };
  currentSessionId = session.id;

  const startEvent = makeEvent("pageview", "Session started");
  commit({
    sessions: [session, ...snapshot.sessions],
    events: [startEvent, ...snapshot.events],
  });
  pushRemote({ sessions: [session], events: [startEvent] });

  // Keep the session's duration honest while the tab is open.
  const beat = window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    const updated = { ...session, lastSeenAt: Date.now() };
    const sessions = snapshot.sessions.map((s) =>
      s.id === session.id ? { ...s, lastSeenAt: updated.lastSeenAt } : s,
    );
    commit({ ...snapshot, sessions });
    pushRemote({ sessions: [updated] });
  }, 15000);

  // A final heartbeat as the tab goes away keeps session length accurate.
  const close = () => {
    window.clearInterval(beat);
    pushRemote({ sessions: [{ ...session, lastSeenAt: Date.now() }] });
  };
  window.addEventListener("pagehide", close, { once: true });
}

function makeEvent(kind: EventKind, label: string, account?: AccountRef): TelemetryEvent {
  return {
    id: uid("e"),
    kind,
    at: Date.now(),
    visitor: getVisitorId(),
    label,
    account,
  };
}

/** Record a discrete event. */
export function track(kind: EventKind, label: string, account?: AccountRef): void {
  load();
  const event = makeEvent(kind, label, account);
  commit({ ...snapshot, events: [event, ...snapshot.events] });
  pushRemote({ events: [event] });
}

/** Attach the signed-in account to this session (and log the sign-in). */
export function recordSignIn(account: AccountRef): void {
  load();
  const sessions = snapshot.sessions.map((s) =>
    s.id === currentSessionId ? { ...s, account, lastSeenAt: Date.now() } : s,
  );
  const event = makeEvent("signin", `${account.name || account.email} signed in`, account);
  commit({ sessions, events: [event, ...snapshot.events] });
  const updated = sessions.find((s) => s.id === currentSessionId);
  pushRemote({ sessions: updated ? [updated] : [], events: [event] });
}

export function recordSignOut(account?: AccountRef): void {
  load();
  const sessions = snapshot.sessions.map((s) =>
    s.id === currentSessionId ? { ...s, account: undefined } : s,
  );
  const event = makeEvent("signout", account ? `${account.name || account.email} signed out` : "Signed out", account);
  commit({ sessions, events: [event, ...snapshot.events] });
  const updated = sessions.find((s) => s.id === currentSessionId);
  pushRemote({ sessions: updated ? [updated] : [], events: [event] });
}

/** Wipe everything the dashboard shows. */
export function clearTelemetry(): void {
  load();
  currentSessionId = null;
  commit(EMPTY);
}

/* -------------------------------------------------------------------------- */
/*  React binding                                                             */
/* -------------------------------------------------------------------------- */

function subscribe(fn: () => void): () => void {
  load();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot(): Snapshot {
  load();
  return snapshot;
}

export function useTelemetry(): Snapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

/* -------------------------------------------------------------------------- */
/*  Remote snapshot — all visitors, when a backend exists                     */
/* -------------------------------------------------------------------------- */

export type RemoteState =
  | { status: "disabled" }
  | { status: "loading" }
  | { status: "ready"; snapshot: Snapshot }
  | { status: "error" };

/** The API speaks ISO-8601; the local model speaks epoch millis. */
function toMillis(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Polls the shared analytics endpoint. The response already matches the local
 * `Snapshot` shape, so every derivation in this file works against it.
 */
export function useRemoteSnapshot(): RemoteState {
  const [state, setState] = useState<RemoteState>(() =>
    isRemoteAnalyticsEnabled ? { status: "loading" } : { status: "disabled" },
  );

  useEffect(() => {
    if (!isRemoteAnalyticsEnabled) return;
    let cancelled = false;
    let timer = 0;

    const load = async () => {
      try {
        const res = await fetch(ANALYTICS_URL, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as {
          sessions?: Array<Record<string, unknown>>;
          events?: Array<Record<string, unknown>>;
        };
        if (cancelled) return;
        const sessions = (data.sessions ?? []).map(
          (s) =>
            ({
              ...s,
              startedAt: toMillis(s.startedAt),
              lastSeenAt: toMillis(s.lastSeenAt),
            }) as unknown as Session,
        );
        const events = (data.events ?? []).map(
          (e) => ({ ...e, at: toMillis(e.at) }) as unknown as TelemetryEvent,
        );
        setState({ status: "ready", snapshot: { sessions, events } });
      } catch {
        if (!cancelled) setState({ status: "error" });
      } finally {
        if (!cancelled) timer = window.setTimeout(load, 20000);
      }
    };

    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return state;
}

/* -------------------------------------------------------------------------- */
/*  Derivations used by the dashboard                                         */
/* -------------------------------------------------------------------------- */

export type DayPoint = {
  key: string;
  label: string;
  dateLabel: string;
  sessions: number;
  visitors: number;
  pageviews: number;
};

const DAY = 86_400_000;

function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Daily session / unique-visitor / pageview series for the last `days`. */
export function dailySeries(snap: Snapshot, days = 14): DayPoint[] {
  const buckets = new Map<string, DayPoint>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const ts = today.getTime() - i * DAY;
    const d = new Date(ts);
    buckets.set(dayKey(ts), {
      key: dayKey(ts),
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      dateLabel: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      sessions: 0,
      visitors: 0,
      pageviews: 0,
    });
  }

  const visitorSeen = new Map<string, Set<string>>();
  snap.sessions.forEach((s) => {
    const bucket = buckets.get(dayKey(s.startedAt));
    if (!bucket) return;
    bucket.sessions += 1;
    const set = visitorSeen.get(bucket.key) ?? new Set<string>();
    set.add(s.visitor);
    visitorSeen.set(bucket.key, set);
  });
  visitorSeen.forEach((set, key) => {
    const bucket = buckets.get(key);
    if (bucket) bucket.visitors = set.size;
  });

  snap.events.forEach((e) => {
    if (e.kind !== "pageview") return;
    const bucket = buckets.get(dayKey(e.at));
    if (bucket) bucket.pageviews += 1;
  });

  return Array.from(buckets.values());
}

export type Summary = {
  visitors: number;
  sessions: number;
  pageviews: number;
  signIns: number;
  accounts: number;
  avgSessionMs: number;
  last7: number;
  prev7: number;
  /** Percentage change in sessions between the last 7 days and the 7 before. */
  delta: number;
};

export function summarise(snap: Snapshot): Summary {
  const now = Date.now();
  const visitors = new Set(snap.sessions.map((s) => s.visitor)).size;
  const pageviews = snap.events.filter((e) => e.kind === "pageview").length;
  const signInEvents = snap.events.filter((e) => e.kind === "signin");
  const accounts = new Set(signInEvents.map((e) => e.account?.id).filter(Boolean)).size;

  const durations = snap.sessions.map((s) => Math.max(0, s.lastSeenAt - s.startedAt));
  const avgSessionMs = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  const last7 = snap.sessions.filter((s) => now - s.startedAt <= 7 * DAY).length;
  const prev7 = snap.sessions.filter(
    (s) => now - s.startedAt > 7 * DAY && now - s.startedAt <= 14 * DAY,
  ).length;

  const delta = prev7 === 0 ? (last7 > 0 ? 100 : 0) : ((last7 - prev7) / prev7) * 100;

  return {
    visitors,
    sessions: snap.sessions.length,
    pageviews,
    signIns: signInEvents.length,
    accounts,
    avgSessionMs,
    last7,
    prev7,
    delta,
  };
}

export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

/** CSV export so the numbers can leave the browser. */
export function toCsv(snap: Snapshot): string {
  const rows: string[] = [
    "type,at,visitor,device,browser,os,region,referrer,account,label",
  ];
  snap.sessions.forEach((s) => {
    rows.push(
      [
        "session",
        new Date(s.startedAt).toISOString(),
        s.visitor,
        s.device,
        s.browser,
        s.os,
        s.region,
        s.referrer,
        s.account?.email ?? "",
        `${Math.round((s.lastSeenAt - s.startedAt) / 1000)}s`,
      ]
        .map(csvCell)
        .join(","),
    );
  });
  snap.events.forEach((e) => {
    rows.push(
      [
        e.kind,
        new Date(e.at).toISOString(),
        e.visitor,
        "",
        "",
        "",
        "",
        "",
        e.account?.email ?? "",
        e.label,
      ]
        .map(csvCell)
        .join(","),
    );
  });
  return rows.join("\n");
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
