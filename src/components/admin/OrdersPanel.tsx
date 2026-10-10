import { useMemo, useState } from "react";
import { formatDateTime, relativeTime } from "../../lib/telemetry";
import {
  clearOrders,
  ordersToCsv,
  removeOrder,
  setOrderNotes,
  setOrderStatus,
  useOrders,
  useRemoteOrders,
  ORDER_STATUSES,
  type Order,
  type OrderStatus,
} from "../../lib/orders";
import { buildWhatsAppUrl } from "../../lib/whatsapp";

const STATUS_STYLES: Record<OrderStatus, string> = {
  new: "border-blood-500/60 text-blood-300",
  reviewing: "border-amber-400/50 text-amber-200",
  contacted: "border-sky-400/50 text-sky-200",
  "in-progress": "border-violet-400/50 text-violet-200",
  completed: "border-emerald-400/50 text-emerald-200",
  archived: "border-bone/20 text-bone-dim",
};

function ReplyLink({ order }: { order: Order }) {
  if (order.email) {
    const subject = `Re: your website brief — ${order.websiteType || order.templateName}`;
    const body = `Hi ${order.name},\n\nThanks for the brief. A few quick questions…`;
    return (
      <a
        href={`mailto:${order.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
        className="border border-bone/15 px-3 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/35 hover:text-bone"
      >
        Reply by email
      </a>
    );
  }
  return (
    <a
      href={buildWhatsAppUrl(
        `Hi ${order.name}, thanks for the website brief — I've had a look and I have a few questions.`,
      )}
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
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const counts = useMemo(() => {
    const base: Record<OrderStatus, number> = {
      new: 0,
      reviewing: 0,
      contacted: 0,
      "in-progress": 0,
      completed: 0,
      archived: 0,
    };
    orders.forEach((o) => {
      base[o.status] = (base[o.status] ?? 0) + 1;
    });
    return base;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      return [
        o.name,
        o.email,
        o.phone,
        o.business,
        o.websiteType,
        o.templateName,
        o.themeName,
        o.budget,
        o.wants,
        o.avoids,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [orders, filter, query]);

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
    <div className="flex flex-col gap-7">
      {/* Status tiles double as filters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(filter === status ? "all" : status)}
            aria-pressed={filter === status}
            className={`border p-4 text-left transition-colors duration-300 ${
              filter === status
                ? "border-blood-500/60 bg-ink-900"
                : "border-bone/10 bg-ink-900 hover:border-bone/30"
            }`}
          >
            <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
              {status}
            </span>
            <p className="display mt-2 text-2xl leading-none text-bone">{counts[status] ?? 0}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[60ch] font-body text-xs text-bone-dim">
          {shared
            ? "Briefs from every visitor, newest first."
            : remote.status === "unauthorised"
              ? "Signed in, but the backend did not accept this account as an admin — showing this browser's briefs. Add your Clerk user id to ADMIN_USER_IDS (see the Media tab) to read everyone's."
              : "Showing briefs saved in this browser only. Connect the shared backend to collect briefs from all visitors."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="order-search">
            Search briefs
          </label>
          <input
            id="order-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, type…"
            className="w-[220px] border border-bone/15 bg-ink-950 px-3 py-2 font-body text-xs text-bone placeholder:text-bone-dim focus:border-blood-500/70 focus:outline-none"
          />
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
        <div className="border border-bone/10 bg-ink-900 p-10 text-center">
          <p className="font-body text-sm text-bone-muted">
            {orders.length === 0
              ? "No briefs yet."
              : `No briefs match ${query ? `“${query}”` : `the “${filter}” status`}.`}
          </p>
          <p className="mx-auto mt-3 max-w-[54ch] font-body text-xs leading-relaxed text-bone-dim">
            When someone completes the brief on <code className="text-bone-muted">#/builder</code>,
            everything they chose — template, palette, features, budget, what they want and what
            they don't — lands here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map((order) => {
            const open = openId === order.id;
            const notes = noteDraft[order.id] ?? order.notes;
            return (
              <li key={order.id} className="border border-bone/10 bg-ink-900">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-bone/10 px-5 py-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-xl text-bone">{order.name || "Unnamed"}</h3>
                    <p className="mt-1 flex flex-wrap gap-x-3 font-body text-xs text-bone-muted">
                      {order.email ? <span>{order.email}</span> : null}
                      {order.phone ? <span>{order.phone}</span> : null}
                      {order.business ? <span className="text-bone-dim">· {order.business}</span> : null}
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
                </div>

                <div className="grid gap-px bg-bone/5 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Type", order.websiteType || "—"],
                    ["Template", order.templateName || "—"],
                    ["Palette", order.themeName || "—"],
                    ["Budget", order.budget || "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-ink-900 p-4">
                      <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                        {label}
                      </span>
                      <p className="mt-1.5 font-body text-sm text-bone">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-5 px-5 py-5 md:grid-cols-2">
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

                {open ? (
                  <div className="grid gap-5 border-t border-bone/10 px-5 py-5 md:grid-cols-2">
                    <div>
                      <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                        Features ({order.features.length})
                      </span>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {order.features.length ? (
                          order.features.map((f) => (
                            <span
                              key={f}
                              className="border border-bone/10 px-2 py-1 font-body text-[9px] uppercase tracking-wide2 text-bone-muted"
                            >
                              {f}
                            </span>
                          ))
                        ) : (
                          <span className="font-body text-xs text-bone-dim">Not specified</span>
                        )}
                      </div>

                      {order.pagesNeeded ? (
                        <p className="mt-4 font-body text-xs text-bone-muted">
                          <span className="text-bone-dim">Pages: </span>
                          {order.pagesNeeded}
                        </p>
                      ) : null}
                      {order.timeline ? (
                        <p className="mt-2 font-body text-xs text-bone-muted">
                          <span className="text-bone-dim">Timeline: </span>
                          {order.timeline}
                        </p>
                      ) : null}
                      {order.goal ? (
                        <p className="mt-2 font-body text-xs text-bone-muted">
                          <span className="text-bone-dim">Goal: </span>
                          {order.goal}
                        </p>
                      ) : null}
                      {order.audience ? (
                        <p className="mt-2 font-body text-xs text-bone-muted">
                          <span className="text-bone-dim">Audience: </span>
                          {order.audience}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      {Object.keys(order.conditional).length ? (
                        <>
                          <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                            {order.websiteType || "Project"} answers
                          </span>
                          <dl className="mt-2 flex flex-col gap-2">
                            {Object.entries(order.conditional).map(([key, value]) => (
                              <div key={key} className="flex gap-3 font-body text-xs">
                                <dt className="shrink-0 text-bone-dim">{key}</dt>
                                <dd className="text-bone-muted">{value || "—"}</dd>
                              </div>
                            ))}
                          </dl>
                        </>
                      ) : null}

                      <dl className="mt-4 grid grid-cols-2 gap-2 font-body text-xs">
                        {[
                          ["Logo", order.hasLogo],
                          ["Content", order.hasContent],
                          ["Hosting help", order.needsHosting],
                          ["Ongoing updates", order.needsUpdates],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <dt className="text-bone-dim">{label}</dt>
                            <dd className="text-bone-muted">{value || "—"}</dd>
                          </div>
                        ))}
                      </dl>

                      {order.references ? (
                        <div className="mt-4">
                          <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                            References
                          </span>
                          <p className="mt-2 whitespace-pre-wrap font-body text-xs text-bone-muted">
                            {order.references}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="md:col-span-2">
                      <label
                        className="mb-2 block font-body text-[10px] uppercase tracking-wide2 text-bone-dim"
                        htmlFor={`notes-${order.id}`}
                      >
                        Studio notes
                      </label>
                      <textarea
                        id={`notes-${order.id}`}
                        rows={3}
                        value={notes}
                        onChange={(e) => setNoteDraft({ ...noteDraft, [order.id]: e.target.value })}
                        placeholder="Quoted ₹35,000. Waiting on logo files…"
                        className="w-full resize-y border border-bone/15 bg-ink-950 px-3 py-2.5 font-body text-xs text-bone placeholder:text-bone-dim focus:border-blood-500/70 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setOrderNotes(order.id, notes);
                          setNoteDraft((prev) => {
                            const next = { ...prev };
                            delete next[order.id];
                            return next;
                          });
                        }}
                        className="mt-2 border border-bone/15 px-3 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/35 hover:text-bone"
                      >
                        Save note
                      </button>
                    </div>
                  </div>
                ) : null}

                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-bone/10 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : order.id)}
                      aria-expanded={open}
                      className="border border-bone/15 px-3 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/35 hover:text-bone"
                    >
                      {open ? "Hide details" : "Full details"}
                    </button>
                    <ReplyLink order={order} />
                    {order.contact ? (
                      <button
                        type="button"
                        onClick={() => void navigator.clipboard?.writeText(order.contact)}
                        className="border border-bone/15 px-3 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-dim transition-colors hover:border-bone/35 hover:text-bone"
                      >
                        Copy contact
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                      Status
                      <select
                        value={order.status}
                        onChange={(e) => setOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="border border-bone/15 bg-ink-950 px-2 py-1.5 font-body text-[10px] uppercase tracking-wide2 text-bone focus:border-blood-500/70 focus:outline-none"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete the brief from ${order.name || "this visitor"}?`)) {
                          removeOrder(order.id);
                        }
                      }}
                      className="border border-transparent px-3 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-dim transition-colors hover:border-blood-700/60 hover:text-blood-300"
                    >
                      Delete
                    </button>
                  </div>
                </footer>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
