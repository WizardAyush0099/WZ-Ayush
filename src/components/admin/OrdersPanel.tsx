import { useMemo, useState } from "react";
import { formatDateTime, relativeTime } from "../../lib/telemetry";
import {
  clearOrders,
  ordersToCsv,
  removeOrder,
  setOrderStatus,
  useOrders,
  useRemoteOrders,
  type Order,
  type OrderStatus,
} from "../../lib/orders";
import { buildWhatsAppUrl } from "../../lib/whatsapp";

const STATUSES: OrderStatus[] = ["new", "contacted", "won", "archived"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  new: "border-blood-500/60 text-blood-300",
  contacted: "border-amber-400/50 text-amber-200",
  won: "border-emerald-400/50 text-emerald-200",
  archived: "border-bone/20 text-bone-dim",
};

function ReplyLink({ order }: { order: Order }) {
  const isEmail = order.contact.includes("@");
  if (isEmail) {
    const subject = `Re: your website brief — ${order.templateName}`;
    const body = `Hi ${order.name},\n\nThanks for the brief. A few quick questions…`;
    return (
      <a
        href={`mailto:${order.contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
        className="border border-bone/15 px-3 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/35 hover:text-bone"
      >
        Reply by email
      </a>
    );
  }
  const message = `Hi ${order.name}, thanks for the website brief — I've had a look and I have a few questions.`;
  return (
    <a
      href={buildWhatsAppUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      className="border border-bone/15 px-3 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/35 hover:text-bone"
    >
      Reply on WhatsApp
    </a>
  );
}

export default function OrdersPanel() {
  const local = useOrders();
  const remote = useRemoteOrders();
  const shared = remote.status === "ready";
  const orders = shared ? remote.orders : local;
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");

  const counts = useMemo(() => {
    const base: Record<OrderStatus, number> = { new: 0, contacted: 0, won: 0, archived: 0 };
    orders.forEach((o) => {
      base[o.status] = (base[o.status] ?? 0) + 1;
    });
    return base;
  }, [orders]);

  const visible = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const exportCsv = () => {
    const blob = new Blob([ordersToCsv(orders)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ayush-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(filter === status ? "all" : status)}
            aria-pressed={filter === status}
            className={`border p-5 text-left transition-colors duration-300 ${
              filter === status ? "border-blood-500/60 bg-ink-900" : "border-bone/10 bg-ink-900 hover:border-bone/30"
            }`}
          >
            <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">{status}</span>
            <p className="display mt-3 text-3xl leading-none text-bone">{counts[status] ?? 0}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-xs text-bone-dim">
          {shared
            ? "Showing briefs from every visitor, newest first."
            : "Showing briefs saved in this browser only. Connect the shared backend to collect briefs from all visitors."}
        </p>
        <div className="flex items-center gap-3">
          {filter !== "all" ? (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="border border-bone/15 px-3 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/35 hover:text-bone"
            >
              Clear filter
            </button>
          ) : null}
          <button
            type="button"
            onClick={exportCsv}
            className="border border-bone/15 px-3 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/35 hover:text-bone"
          >
            Export CSV
          </button>
          {!shared ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Delete every brief stored in this browser? This cannot be undone.")) {
                  clearOrders();
                }
              }}
              className="border border-blood-800/60 px-3 py-2 font-body text-[10px] uppercase tracking-wide2 text-blood-400/80 transition-colors hover:border-blood-600 hover:text-blood-300"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="border border-bone/10 bg-ink-900 p-8 text-center">
          <p className="font-body text-sm text-bone-muted">
            No briefs {filter === "all" ? "yet" : `with the “${filter}” status`}.
          </p>
          <p className="mt-2 font-body text-xs text-bone-dim">
            When someone fills the order form on the site, their brief lands here with everything
            they asked for — and what they asked to avoid.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-5">
          {visible.map((order) => (
            <li key={order.id} className="border border-bone/10 bg-ink-900">
              <header className="flex flex-wrap items-start justify-between gap-4 border-b border-bone/10 px-5 py-4">
                <div className="min-w-0">
                  <h3 className="font-display text-xl text-bone">{order.name}</h3>
                  <p className="mt-1 font-body text-xs text-bone-muted">
                    {order.contact}
                    {order.business ? <span className="text-bone-dim"> · {order.business}</span> : null}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`border px-2.5 py-1 font-body text-[9px] uppercase tracking-wide2 ${STATUS_STYLES[order.status]}`}
                  >
                    {order.status}
                  </span>
                  <span className="font-body text-[10px] text-bone-dim">
                    {relativeTime(order.createdAt)} · {formatDateTime(order.createdAt)}
                  </span>
                </div>
              </header>

              <div className="grid gap-px bg-bone/5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Template", order.templateName],
                  ["Palette", order.themeName],
                  ["Budget", order.budget || "—"],
                  ["Timeline", order.timeline || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-ink-900 p-4">
                    <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                      {label}
                    </span>
                    <p className="mt-1.5 font-body text-sm text-bone">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-5 px-5 py-5 md:grid-cols-3">
                <div>
                  <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                    Pages & features
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {order.pages.length ? (
                      order.pages.map((page) => (
                        <span
                          key={page}
                          className="border border-bone/10 px-2 py-1 font-body text-[9px] uppercase tracking-wide2 text-bone-muted"
                        >
                          {page}
                        </span>
                      ))
                    ) : (
                      <span className="font-body text-xs text-bone-dim">Not specified</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-body text-[10px] uppercase tracking-wide2 text-emerald-300/80">
                    Wants
                  </span>
                  <p className="mt-2 whitespace-pre-wrap font-body text-xs leading-relaxed text-bone-muted">
                    {order.wants || "—"}
                  </p>
                </div>
                <div>
                  <span className="font-body text-[10px] uppercase tracking-wide2 text-blood-300/80">
                    Doesn't want
                  </span>
                  <p className="mt-2 whitespace-pre-wrap font-body text-xs leading-relaxed text-bone-muted">
                    {order.avoids || "—"}
                  </p>
                </div>
              </div>

              {order.references ? (
                <div className="border-t border-bone/10 px-5 py-4">
                  <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                    References
                  </span>
                  <p className="mt-2 whitespace-pre-wrap font-body text-xs text-bone-muted">
                    {order.references}
                  </p>
                </div>
              ) : null}

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-bone/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <ReplyLink order={order} />
                  {!shared ? (
                    <label className="flex items-center gap-2 font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                      Status
                      <select
                        value={order.status}
                        onChange={(e) => setOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="border border-bone/15 bg-ink-950 px-2 py-1.5 font-body text-[10px] uppercase tracking-wide2 text-bone"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
                {!shared ? (
                  <button
                    type="button"
                    onClick={() => removeOrder(order.id)}
                    className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim transition-colors hover:text-blood-300"
                  >
                    Delete brief
                  </button>
                ) : null}
              </footer>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
