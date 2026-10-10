import { useEffect, useState, useSyncExternalStore } from "react";
import { AUTH_CHANGED_EVENT, authHeaders } from "./apiAuth";
import { dataApiUrl, getVisitorId } from "./telemetry";

/**
 * ============================================================================
 *  ORDER STORE — website commissions requested from the builder
 * ============================================================================
 *  A visitor picks a template + theme, walks the eight-step brief and sends
 *  it. The order is kept locally (so it works with zero setup) and posted to
 *  the shared backend when one is configured — the same `/api/analytics`
 *  function that serves the dashboard, which also owns the `wz_orders` table.
 *
 *  Reading orders back requires an admin credential: the backend only returns
 *  them to a verified Clerk session from an allowed address, so client data
 *  is never served to the public. The dashboard falls back to this browser's
 *  copy when that is not available.
 * ============================================================================
 */

const STORAGE_KEY = "wz.orders.v2";
const MAX_ORDERS = 400;
const CHANGE_EVENT = "wz:orders-changed";

export type OrderStatus =
  | "new"
  | "reviewing"
  | "contacted"
  | "in-progress"
  | "completed"
  | "archived";

export const ORDER_STATUSES: OrderStatus[] = [
  "new",
  "reviewing",
  "contacted",
  "in-progress",
  "completed",
  "archived",
];

export type Order = {
  id: string;
  createdAt: number;
  visitor: string;
  status: OrderStatus;
  /* --- contact ------------------------------------------------------------ */
  name: string;
  /** Kept for backwards compatibility: email when present, else phone. */
  contact: string;
  email: string;
  phone: string;
  business: string;
  /* --- what they want ----------------------------------------------------- */
  websiteType: string;
  templateId: string;
  templateName: string;
  themeId: string;
  themeName: string;
  features: string[];
  /** Answers to the type-specific follow-up questions. */
  conditional: Record<string, string>;
  wants: string;
  avoids: string;
  references: string;
  /* --- project details ---------------------------------------------------- */
  goal: string;
  audience: string;
  pagesNeeded: string;
  hasLogo: string;
  hasContent: string;
  needsHosting: string;
  needsUpdates: string;
  budget: string;
  timeline: string;
  /* --- studio side -------------------------------------------------------- */
  notes: string;
};

export type OrderInput = Omit<Order, "id" | "createdAt" | "visitor" | "status" | "notes">;

/* -------------------------------------------------------------------------- */
/*  Local persistence                                                         */
/* -------------------------------------------------------------------------- */

let orders: Order[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function uid(): string {
  return `o_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function safeParse(raw: string | null): Order[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]).map(hydrate) : [];
  } catch {
    return [];
  }
}

/** Fills in fields added after an order was first stored. */
function hydrate(raw: Partial<Order>): Order {
  return {
    id: String(raw.id ?? uid()),
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
    visitor: String(raw.visitor ?? "unknown"),
    status: (ORDER_STATUSES as string[]).includes(String(raw.status))
      ? (raw.status as OrderStatus)
      : "new",
    name: String(raw.name ?? ""),
    contact: String(raw.contact ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    business: String(raw.business ?? ""),
    websiteType: String(raw.websiteType ?? ""),
    templateId: String(raw.templateId ?? ""),
    templateName: String(raw.templateName ?? ""),
    themeId: String(raw.themeId ?? ""),
    themeName: String(raw.themeName ?? ""),
    features: Array.isArray(raw.features) ? raw.features.map(String) : [],
    conditional:
      raw.conditional && typeof raw.conditional === "object"
        ? Object.fromEntries(Object.entries(raw.conditional).map(([k, v]) => [k, String(v)]))
        : {},
    wants: String(raw.wants ?? ""),
    avoids: String(raw.avoids ?? ""),
    references: String(raw.references ?? ""),
    goal: String(raw.goal ?? ""),
    audience: String(raw.audience ?? ""),
    pagesNeeded: String(raw.pagesNeeded ?? ""),
    hasLogo: String(raw.hasLogo ?? ""),
    hasContent: String(raw.hasContent ?? ""),
    needsHosting: String(raw.needsHosting ?? ""),
    needsUpdates: String(raw.needsUpdates ?? ""),
    budget: String(raw.budget ?? ""),
    timeline: String(raw.timeline ?? ""),
    notes: String(raw.notes ?? ""),
  };
}

function load(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  orders = safeParse(window.localStorage.getItem(STORAGE_KEY));
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    /* quota / private mode — best effort */
  }
}

function commit(next: Order[]): void {
  orders = next.slice(0, MAX_ORDERS);
  persist();
  listeners.forEach((fn) => fn());
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

async function pushRemote(payload: Record<string, unknown>): Promise<void> {
  if (!dataApiUrl) return;
  try {
    await fetch(dataApiUrl, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    /* offline or not deployed — the local copy already holds the order */
  }
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

export function listOrders(): Order[] {
  load();
  return orders;
}

/** Save a new commission request. Returns the stored order. */
export function submitOrder(input: OrderInput): Order {
  load();
  const order: Order = {
    ...input,
    id: uid(),
    createdAt: Date.now(),
    visitor: getVisitorId(),
    status: "new",
    notes: "",
  };
  commit([order, ...orders]);
  void pushRemote({ orders: [order] });
  return order;
}

export function setOrderStatus(id: string, status: OrderStatus): void {
  load();
  const next = orders.map((o) => (o.id === id ? { ...o, status } : o));
  commit(next);
  const updated = next.find((o) => o.id === id);
  if (updated) void pushRemote({ orders: [updated] });
}

export function setOrderNotes(id: string, notes: string): void {
  load();
  const next = orders.map((o) => (o.id === id ? { ...o, notes } : o));
  commit(next);
  const updated = next.find((o) => o.id === id);
  if (updated) void pushRemote({ orders: [updated] });
}

export function removeOrder(id: string): void {
  load();
  commit(orders.filter((o) => o.id !== id));
  void pushRemote({ deleteOrder: id });
}

export function clearOrders(): void {
  load();
  commit([]);
}

/* -------------------------------------------------------------------------- */
/*  React bindings                                                            */
/* -------------------------------------------------------------------------- */

function subscribe(fn: () => void): () => void {
  load();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot(): Order[] {
  load();
  return orders;
}

/** Orders recorded in this browser. */
export function useOrders(): Order[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => []);
}

export type RemoteOrdersState =
  | { status: "disabled" }
  | { status: "loading" }
  | { status: "ready"; orders: Order[] }
  | { status: "unauthorised" }
  | { status: "error" };

function toMillis(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Orders from every visitor. The endpoint returns an `authorized` flag; when
 * it is false the dashboard shows the local copy instead of an empty list.
 */
export function useRemoteOrders(): RemoteOrdersState {
  const [state, setState] = useState<RemoteOrdersState>(() =>
    dataApiUrl ? { status: "loading" } : { status: "disabled" },
  );

  useEffect(() => {
    if (!dataApiUrl) return;
    let cancelled = false;
    let timer = 0;

    const fetchOrders = async () => {
      try {
        const res = await fetch(dataApiUrl, {
          headers: { accept: "application/json", ...authHeaders() },
        });
        if (!res.ok) throw new Error(String(res.status));
        const raw = (await res.json()) as {
          authorized?: boolean;
          orders?: Array<Record<string, unknown>>;
        };
        if (cancelled) return;
        if (!raw.authorized) {
          setState({ status: "unauthorised" });
          return;
        }
        const list = (raw.orders ?? []).map((o) =>
          hydrate({
            ...(o as unknown as Partial<Order>),
            createdAt: toMillis(o.createdAt),
            pagesNeeded: (o.pagesNeeded as string) ?? "",
          }),
        );
        setState({ status: "ready", orders: list });
      } catch {
        if (!cancelled) setState({ status: "error" });
      } finally {
        if (!cancelled) timer = window.setTimeout(fetchOrders, 20_000);
      }
    };

    void fetchOrders();
    window.addEventListener(AUTH_CHANGED_EVENT, fetchOrders);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener(AUTH_CHANGED_EVENT, fetchOrders);
    };
  }, []);

  return state;
}

/* -------------------------------------------------------------------------- */
/*  Export                                                                    */
/* -------------------------------------------------------------------------- */

const CSV_HEADER = [
  "createdAt",
  "status",
  "name",
  "email",
  "phone",
  "business",
  "websiteType",
  "template",
  "theme",
  "features",
  "pages",
  "budget",
  "timeline",
  "goal",
  "audience",
  "wants",
  "avoids",
  "references",
  "logo",
  "content",
  "hosting",
  "updates",
  "notes",
];

export function ordersToCsv(list: Order[]): string {
  const rows = [CSV_HEADER.join(",")];
  list.forEach((o) => {
    rows.push(
      [
        new Date(o.createdAt).toISOString(),
        o.status,
        o.name,
        o.email,
        o.phone,
        o.business,
        o.websiteType,
        o.templateName,
        o.themeName,
        o.features.join(" / "),
        o.pagesNeeded,
        o.budget,
        o.timeline,
        o.goal,
        o.audience,
        o.wants,
        o.avoids,
        o.references,
        o.hasLogo,
        o.hasContent,
        o.needsHosting,
        o.needsUpdates,
        o.notes,
      ]
        .map(csvCell)
        .join(","),
    );
  });
  return rows.join("\n");
}

function csvCell(value: string): string {
  const text = value ?? "";
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
