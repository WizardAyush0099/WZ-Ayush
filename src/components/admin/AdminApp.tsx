import { useEffect, useMemo, useState } from "react";
import { UserButton, useUser } from "@clerk/clerk-react";
import {
  clearTelemetry,
  summarise,
  toCsv,
  useRemoteSnapshot,
  useTelemetry,
} from "../../lib/telemetry";
import { displayNameOf } from "../../lib/auth";
import { getApiIdentity, useAuthRevision } from "../../lib/apiAuth";
import { linkTo } from "../../lib/router";
import { isRemoteSiteDataEnabled } from "../../lib/siteData";
import GrowthPanel from "./GrowthPanel";
import LoginsPanel from "./LoginsPanel";
import ImageManager from "./ImageManager";
import OrdersPanel from "./OrdersPanel";
import ProjectsPanel from "./ProjectsPanel";
import MediaPanel from "./MediaPanel";

type Tab = "orders" | "projects" | "media" | "overview" | "logins" | "images";

const TABS: Array<{ id: Tab; label: string; hint: string }> = [
  { id: "orders", label: "Orders", hint: "Client briefs from the builder, with notes and status" },
  { id: "projects", label: "Projects", hint: "The work shown on the homepage" },
  { id: "media", label: "Artwork", hint: "Image paths and the cinematic scroll media" },
  { id: "overview", label: "Growth", hint: "Traffic, reach and engagement" },
  { id: "logins", label: "Logins", hint: "Sessions and authenticated accounts" },
  { id: "images", label: "Uploads", hint: "Quick images added from this device" },
];

export default function AdminApp() {
  const [tab, setTab] = useState<Tab>("orders");
  const localSnapshot = useTelemetry();
  const remote = useRemoteSnapshot();
  // Prefer the shared store; fall back to this browser until it is reachable.
  const shared = remote.status === "ready";
  const snapshot = shared ? remote.snapshot : localSnapshot;
  const summary = useMemo(() => summarise(snapshot), [snapshot]);
  const { user } = useUser();
  // Re-render once the session token lands, so the diagnostics show real values.
  useAuthRevision();
  const identity = getApiIdentity();

  useEffect(() => {
    const previous = document.title;
    document.title = "Dashboard — Ayush";
    return () => {
      document.title = previous;
    };
  }, []);

  const exportCsv = () => {
    const blob = new Blob([toCsv(snapshot)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ayush-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sharedLabel = shared
    ? "Shared · all visitors"
    : remote.status === "unauthorised"
      ? "Not authorised on the server"
      : remote.status === "disabled"
        ? "Local only · no backend"
        : "Live · this browser";

  return (
    <div className="min-h-[100svh] bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-bone/10 bg-ink-950/85 backdrop-blur-md">
        <div className="shell flex h-[72px] items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <a
              href={linkTo("/")}
              className="font-body text-[11px] uppercase tracking-wide2 text-bone-dim transition-colors hover:text-bone"
            >
              ← Site
            </a>
            <span className="hidden h-4 w-px bg-bone/15 sm:block" />
            <span className="display hidden text-sm tracking-[0.28em] text-bone sm:block">
              DASHBOARD
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-2 font-body text-[10px] uppercase tracking-wide2 text-bone-dim md:flex">
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    shared ? "animate-ping bg-emerald-400" : "bg-blood-500"
                  }`}
                />
                <span
                  className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                    shared ? "bg-emerald-400" : "bg-blood-500"
                  }`}
                />
              </span>
              {sharedLabel}
            </span>
            <a
              href={linkTo("/builder")}
              className="hidden border border-bone/15 px-3 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/35 hover:text-bone sm:inline-block"
            >
              View builder
            </a>
            <span className="hidden max-w-[160px] truncate font-body text-[11px] text-bone-muted lg:inline">
              {displayNameOf(user)}
            </span>
            <UserButton afterSignOutUrl={import.meta.env.BASE_URL} />
          </div>
        </div>
      </header>

      <main className="shell py-10 md:py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Studio</p>
            <h1 className="display mt-3 text-4xl text-bone sm:text-5xl">Command Centre</h1>
            <p className="mt-3 max-w-[62ch] font-body text-sm leading-relaxed text-bone-muted">
              Client briefs, the projects on the homepage, and the artwork this site renders — all
              editable here. Content changes reach every visitor once they are published to the
              shared backend.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportCsv}
              className="border border-bone/15 px-4 py-2.5 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/30 hover:text-bone"
            >
              Export analytics CSV
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Delete the sessions and events stored in this browser? Shared analytics is not affected. This cannot be undone.",
                  )
                ) {
                  clearTelemetry();
                }
              }}
              className="border border-blood-800/60 px-4 py-2.5 font-body text-[11px] uppercase tracking-wide2 text-blood-400/80 transition-colors hover:border-blood-600 hover:text-blood-300"
            >
              Reset local data
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-10 flex flex-wrap gap-1 border-b border-bone/10">
          {TABS.map((t) => {
            const activeTab = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative px-4 py-3 font-body text-[11px] font-medium uppercase tracking-wide2 transition-colors duration-300 ${
                  activeTab ? "text-bone" : "text-bone-dim hover:text-bone-muted"
                }`}
                aria-current={activeTab ? "page" : undefined}
              >
                {t.label}
                <span
                  className={`absolute inset-x-3 -bottom-px h-px bg-blood-500 transition-transform duration-500 ease-silk ${
                    activeTab ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <p className="mt-4 font-body text-xs uppercase tracking-wide2 text-bone-dim">
          {TABS.find((t) => t.id === tab)?.hint}
        </p>

        <div className="mt-8">
          {tab === "orders" && <OrdersPanel />}
          {tab === "projects" && <ProjectsPanel />}
          {tab === "media" && <MediaPanel />}
          {tab === "overview" && <GrowthPanel snapshot={snapshot} summary={summary} />}
          {tab === "logins" && <LoginsPanel snapshot={snapshot} summary={summary} />}
          {tab === "images" && <ImageManager />}
        </div>

        {/* Backend authorization diagnostics */}
        <section className="mt-14 border border-bone/10 bg-ink-900 p-5">
          <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            Backend access
          </h2>
          <dl className="mt-4 grid gap-4 font-body text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-bone-dim">Shared endpoint</dt>
              <dd className="mt-1 text-bone-muted">
                {isRemoteSiteDataEnabled ? "/api/analytics" : "not configured in this build"}
              </dd>
            </div>
            <div>
              <dt className="text-bone-dim">Your Clerk user id</dt>
              <dd className="mt-1 break-all font-mono text-[11px] text-bone">
                {identity.userId ?? "signed out"}
              </dd>
            </div>
            <div>
              <dt className="text-bone-dim">Your email</dt>
              <dd className="mt-1 break-all text-bone-muted">{identity.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-bone-dim">Server verdict</dt>
              <dd className="mt-1 text-bone-muted">
                {shared ? "authorised" : remote.status === "unauthorised" ? "refused" : remote.status}
              </dd>
            </div>
          </dl>
          <p className="mt-4 max-w-[80ch] font-body text-[11px] leading-relaxed text-bone-dim">
            Client data is only returned to a verified admin. On the server set{" "}
            <code className="text-bone-muted">ADMIN_USER_IDS</code> to the Clerk user id above
            (recommended — Clerk's session token always carries it) or{" "}
            <code className="text-bone-muted">ADMIN_EMAILS</code> to your address, plus{" "}
            <code className="text-bone-muted">CLERK_ISSUER</code> so the token signature can be
            verified. Until then every privileged route fails closed.
          </p>
        </section>
      </main>

      <footer className="mt-16 border-t border-bone/10 py-10">
        <div className="shell flex flex-col items-center justify-between gap-4 font-body text-[10px] uppercase tracking-wide2 text-bone-dim sm:flex-row">
          <span>Ayush — Studio Dashboard</span>
          <span>{shared ? "Shared data · all visitors" : "Data is stored in this browser only"}</span>
        </div>
      </footer>
    </div>
  );
}
