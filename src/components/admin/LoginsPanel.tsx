import { useMemo } from "react";
import {
  formatDateTime,
  formatDuration,
  relativeTime,
  type Snapshot,
  type Summary,
} from "../../lib/telemetry";

type AccountRow = {
  id: string;
  name: string;
  email: string;
  signIns: number;
  first: number;
  last: number;
};

export default function LoginsPanel({
  snapshot,
  summary,
}: {
  snapshot: Snapshot;
  summary: Summary;
}) {
  const { accounts, authEvents } = useMemo(() => {
    const map = new Map<string, AccountRow>();
    const events = snapshot.events.filter((e) => e.kind === "signin" || e.kind === "signout");

    snapshot.events
      .filter((e) => e.kind === "signin" && e.account)
      .forEach((e) => {
        const account = e.account!;
        const existing = map.get(account.id);
        if (existing) {
          existing.signIns += 1;
          existing.first = Math.min(existing.first, e.at);
          existing.last = Math.max(existing.last, e.at);
        } else {
          map.set(account.id, {
            id: account.id,
            name: account.name || account.email,
            email: account.email,
            signIns: 1,
            first: e.at,
            last: e.at,
          });
        }
      });

    return {
      accounts: Array.from(map.values()).sort((a, b) => b.last - a.last),
      authEvents: events.slice(0, 40),
    };
  }, [snapshot]);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Sign-in events", value: summary.signIns },
          { label: "Known accounts", value: summary.accounts },
          {
            label: "Authenticated sessions",
            value: snapshot.sessions.filter((s) => s.account).length,
          },
          {
            label: "Sign-outs",
            value: snapshot.events.filter((e) => e.kind === "signout").length,
          },
        ].map((stat) => (
          <div key={stat.label} className="border border-bone/10 bg-ink-900 p-5">
            <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
              {stat.label}
            </span>
            <p className="display mt-3 text-3xl leading-none text-bone">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Accounts */}
      <section className="border border-bone/10 bg-ink-900">
        <header className="flex items-center justify-between border-b border-bone/10 px-5 py-4">
          <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            Accounts
          </h2>
          <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            {accounts.length} total
          </span>
        </header>

        {accounts.length === 0 ? (
          <p className="px-5 py-8 font-body text-xs text-bone-dim">
            No sign-ins yet. Once someone signs in through Clerk they appear here with their email,
            sign-in count and last seen time.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="text-left font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                  <th className="px-5 py-3 font-normal">User</th>
                  <th className="px-5 py-3 font-normal">Email</th>
                  <th className="px-5 py-3 font-normal">Sign-ins</th>
                  <th className="px-5 py-3 font-normal">First seen</th>
                  <th className="px-5 py-3 font-normal">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className="border-t border-bone/5">
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-blood-700/50 bg-blood-950/40 font-body text-[10px] uppercase text-blood-300">
                          {(a.name || a.email || "?").slice(0, 1)}
                        </span>
                        <span className="font-body text-xs text-bone">{a.name || "—"}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 font-body text-xs text-bone-muted">{a.email || "—"}</td>
                    <td className="px-5 py-4 font-body text-xs text-bone-muted">{a.signIns}</td>
                    <td className="px-5 py-4 font-body text-xs text-bone-dim">
                      {formatDateTime(a.first)}
                    </td>
                    <td className="px-5 py-4 font-body text-xs text-bone-dim">
                      {relativeTime(a.last)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Auth event log */}
      <section className="border border-bone/10 bg-ink-900">
        <header className="border-b border-bone/10 px-5 py-4">
          <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            Authentication log
          </h2>
        </header>
        {authEvents.length === 0 ? (
          <p className="px-5 py-8 font-body text-xs text-bone-dim">
            No authentication events recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-bone/5">
            {authEvents.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      e.kind === "signin" ? "bg-emerald-400/80" : "bg-bone/25"
                    }`}
                  />
                  <span className="truncate font-body text-xs text-bone-muted">{e.label}</span>
                  <span className="shrink-0 border border-bone/10 px-2 py-0.5 font-body text-[9px] uppercase tracking-wide2 text-bone-dim">
                    {e.kind}
                  </span>
                </span>
                <span className="shrink-0 font-body text-[10px] text-bone-dim">
                  {formatDateTime(e.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sessions */}
      <section className="border border-bone/10 bg-ink-900">
        <header className="flex items-center justify-between border-b border-bone/10 px-5 py-4">
          <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">Sessions</h2>
          <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            newest first
          </span>
        </header>
        {snapshot.sessions.length === 0 ? (
          <p className="px-5 py-8 font-body text-xs text-bone-dim">No sessions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr className="text-left font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                  <th className="px-5 py-3 font-normal">Started</th>
                  <th className="px-5 py-3 font-normal">User</th>
                  <th className="px-5 py-3 font-normal">Device</th>
                  <th className="px-5 py-3 font-normal">Browser / OS</th>
                  <th className="px-5 py-3 font-normal">Region</th>
                  <th className="px-5 py-3 font-normal">Referrer</th>
                  <th className="px-5 py-3 font-normal">Duration</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.sessions.slice(0, 60).map((s) => (
                  <tr key={s.id} className="border-t border-bone/5">
                    <td className="px-5 py-3 font-body text-xs text-bone-muted">
                      {formatDateTime(s.startedAt)}
                    </td>
                    <td className="px-5 py-3 font-body text-xs text-bone">
                      {s.account ? s.account.name || s.account.email : <span className="text-bone-dim">Guest</span>}
                    </td>
                    <td className="px-5 py-3 font-body text-xs capitalize text-bone-muted">
                      {s.device}
                    </td>
                    <td className="px-5 py-3 font-body text-xs text-bone-muted">
                      {s.browser} · {s.os}
                    </td>
                    <td className="px-5 py-3 font-body text-xs text-bone-dim">{s.region}</td>
                    <td className="max-w-[180px] truncate px-5 py-3 font-body text-xs text-bone-dim">
                      {s.referrer}
                    </td>
                    <td className="px-5 py-3 font-body text-xs text-bone-dim">
                      {formatDuration(Math.max(0, s.lastSeenAt - s.startedAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
