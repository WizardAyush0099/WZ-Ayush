import { useEffect, useState, useSyncExternalStore } from "react";
import { dataApiUrl, getVisitorId } from "./telemetry";

/**
 * ============================================================================
 *  ORDER STORE — website commissions requested from the portfolio
 * ============================================================================
 *  A visitor picks a template + theme, writes what they want and don't want,
 *  and sends it. The order is kept locally (so it works with zero setup) and
 *  posted to the shared backend when one is configured — the same
 *  `/api/analytics` function that already serves the growth dashboard, which
 *  also exposes a `wz_orders` table. The admin dashboard reads remote-first,
 *  falling back to this browser.
 * ============================================================================
 */

const STORAGE_KEY = "wz.orders.v1";
const MAX_ORDERS = 400;
const CHANGE_EVENT = "wz:orders-changed";

export type OrderStatus = "new" | "contacted" | "won" | "archived";

export type Order = {
  id: string;
  createdAt: number;
  name: string;
  /** Email or phone — however the visitor wants to be reached. */
  contact: string;
  business: string;
  templateId: string;
  templateName: string;
  themeId: string;
  themeName: string;
  /** Requested pages / features. */
  pages: string[];
  budget: string;
  timeline: string;
  /** What the visitor wants included. */
  wants: string;
  /** What the visitor explicitly does not want. */
  avoids: string;
  /** Links to sites they like. */
  references: string;
  visitor: string;
  status: OrderStatus;
};

export type OrderInput = Omit<Order, "id" | "createdAt" | "visitor" | "status">;

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
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
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

async function pushRemote(payload: { orders: Order[] }): Promise<void> {
  if (!dataApiUrl) return;
  try {
    await fetch(dataApiUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
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

export function removeOrder(id: string): void {
  load();
  commit(orders.filter((o) => o.id !== id));
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
  | { status: "error" };

function toMillis(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/** Orders from every visitor, when the shared backend is configured. */
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
        const res = await fetch(dataApiUrl, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { orders?: Array<Record<string, unknown>> };
        if (cancelled) return;
        const list = (data.orders ?? []).map(
          (o) => ({ ...o, createdAt: toMillis(o.createdAt) }) as unknown as Order,
        );
        setState({ status: "ready", orders: list });
      } catch {
        if (!cancelled) setState({ status: "error" });
      } finally {
        if (!cancelled) timer = window.setTimeout(fetchOrders, 20000);
      }
    };

    void fetchOrders();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return state;
}

/* -------------------------------------------------------------------------- */
/*  Export                                                                    */
/* -------------------------------------------------------------------------- */

export function ordersToCsv(list: Order[]): string {
  const rows = [
    "createdAt,name,contact,business,template,theme,pages,budget,timeline,wants,avoids,references,status",
  ];
  list.forEach((o) => {
    rows.push(
      [
        new Date(o.createdAt).toISOString(),
        o.name,
        o.contact,
        o.business,
        o.templateName,
        o.themeName,
        o.pages.join(" / "),
        o.budget,
        o.timeline,
        o.wants,
        o.avoids,
        o.references,
        o.status,
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
