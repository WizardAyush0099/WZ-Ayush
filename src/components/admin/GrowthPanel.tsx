import { useMemo, useState } from "react";
import {
  dailySeries,
  formatDuration,
  relativeTime,
  type Snapshot,
  type Summary,
} from "../../lib/telemetry";

type Metric = "sessions" | "visitors" | "pageviews";

const METRIC_LABEL: Record<Metric, string> = {
  sessions: "Sessions",
  visitors: "Visitors",
  pageviews: "Pageviews",
};

function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden border p-5 transition-colors duration-500 ${
        accent ? "border-blood-800/60 bg-blood-950/20" : "border-bone/10 bg-ink-900"
      }`}
    >
      <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">{label}</span>
      <p className={`display mt-3 text-3xl leading-none ${accent ? "text-blood-300" : "text-bone"}`}>
        {value}
      </p>
      {hint && <p className="mt-2 font-body text-[11px] text-bone-dim">{hint}</p>}
      <span className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-blood-600/10 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100" />
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="w-[92px] shrink-0 truncate font-body text-[11px] text-bone-muted">{label}</span>
      <span className="h-[6px] flex-1 overflow-hidden bg-bone/5">
        <span
          className="block h-full bg-gradient-to-r from-blood-700 to-blood-400 transition-[width] duration-700 ease-silk"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="w-12 shrink-0 text-right font-body text-[11px] text-bone-dim">
        {value}
        {suffix}
      </span>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
  empty: string;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0);
  return (
    <div className="border border-bone/10 bg-ink-900 p-5">
      <p className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">{title}</p>
      <div className="mt-5 flex flex-col gap-3">
        {rows.length === 0 && <p className="font-body text-xs text-bone-dim">{empty}</p>}
        {rows.map((r) => (
          <Bar key={r.label} label={r.label} value={r.value} max={max} />
        ))}
      </div>
    </div>
  );
}

function countBy<T>(items: T[], key: (item: T) => string): Array<{ label: string; value: number }> {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const k = key(item) || "Unknown";
    map.set(k, (map.get(k) ?? 0) + 1);
  });
  return Array.from(map, ([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

export default function GrowthPanel({
  snapshot,
  summary,
}: {
  snapshot: Snapshot;
  summary: Summary;
}) {
  const [metric, setMetric] = useState<Metric>("sessions");
  const [range, setRange] = useState<7 | 14 | 30>(14);

  const series = useMemo(() => dailySeries(snapshot, range), [snapshot, range]);
  const max = series.reduce((m, p) => Math.max(m, p[metric]), 0);
  const recent = snapshot.events.slice(0, 10);

  const deltaText =
    summary.delta === 0
      ? "no change"
      : `${summary.delta > 0 ? "+" : ""}${summary.delta.toFixed(0)}% vs previous week`;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Unique visitors" value={String(summary.visitors)} hint="Distinct devices" />
        <StatCard label="Sessions" value={String(summary.sessions)} hint={deltaText} accent />
        <StatCard label="Pageviews" value={String(summary.pageviews)} hint="Sections reached" />
        <StatCard label="Sign-ins" value={String(summary.signIns)} hint="Authentication events" />
        <StatCard label="Accounts" value={String(summary.accounts)} hint="Known users" />
        <StatCard
          label="Avg. session"
          value={formatDuration(summary.avgSessionMs)}
          hint="Time on site"
        />
      </div>

      <div className="border border-bone/10 bg-ink-900 p-5 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
              Growth — last {range} days
            </p>
            <p className="display mt-2 text-2xl text-bone">
              {summary.last7} <span className="text-sm text-bone-dim">sessions this week</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["sessions", "visitors", "pageviews"] as Metric[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                className={`border px-3 py-2 font-body text-[10px] uppercase tracking-wide2 transition-colors ${
                  metric === m
                    ? "border-blood-500/70 bg-blood-950/40 text-bone"
                    : "border-bone/10 text-bone-dim hover:text-bone-muted"
                }`}
              >
                {METRIC_LABEL[m]}
              </button>
            ))}
            <span className="mx-1 hidden h-4 w-px bg-bone/15 sm:block" />
            {([7, 14, 30] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`border px-3 py-2 font-body text-[10px] uppercase tracking-wide2 transition-colors ${
                  range === r
                    ? "border-bone/30 text-bone"
                    : "border-bone/10 text-bone-dim hover:text-bone-muted"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>

        {/* Bars scale from the real maximum, so the shape is honest. */}
        <div className="mt-8 flex h-[220px] items-end gap-1.5 sm:gap-2.5">
          {series.map((point) => {
            const value = point[metric];
            const pct = max > 0 ? (value / max) * 100 : 0;
            return (
              <div key={point.key} className="group flex h-full flex-1 flex-col justify-end">
                <span className="mb-2 text-center font-body text-[10px] text-bone-dim opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {value}
                </span>
                <span
                  className="w-full bg-gradient-to-t from-blood-800/70 to-blood-500 transition-[height] duration-700 ease-silk group-hover:from-blood-700 group-hover:to-blood-300"
                  style={{ height: `${Math.max(pct, value > 0 ? 4 : 1.5)}%` }}
                  title={`${point.dateLabel} — ${value} ${METRIC_LABEL[metric].toLowerCase()}`}
                />
                <span className="mt-3 truncate text-center font-body text-[9px] uppercase tracking-wide2 text-bone-dim">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
        {summary.sessions === 0 && (
          <p className="mt-6 font-body text-xs text-bone-dim">
            No sessions recorded yet — browse the site and the chart starts filling in.
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Breakdown
          title="Devices"
          rows={countBy(snapshot.sessions, (s) => s.device)}
          empty="No devices yet"
        />
        <Breakdown
          title="Browsers"
          rows={countBy(snapshot.sessions, (s) => s.browser)}
          empty="No browsers yet"
        />
        <Breakdown
          title="Regions"
          rows={countBy(snapshot.sessions, (s) => s.region)}
          empty="No regions yet"
        />
        <Breakdown
          title="Referrers"
          rows={countBy(snapshot.sessions, (s) =>
            s.referrer.includes("//") ? s.referrer.split("/")[2] : s.referrer,
          )}
          empty="No referrers yet"
        />
      </div>

      <div className="border border-bone/10 bg-ink-900 p-5 md:p-7">
        <p className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
          Recent activity
        </p>
        <ul className="mt-5 flex flex-col divide-y divide-bone/5">
          {recent.length === 0 && (
            <li className="py-4 font-body text-xs text-bone-dim">Nothing recorded yet.</li>
          )}
          {recent.map((event) => (
            <li key={event.id} className="flex items-center justify-between gap-4 py-3">
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    event.kind === "signin"
                      ? "bg-blood-400"
                      : event.kind === "image"
                        ? "bg-emerald-400/80"
                        : "bg-bone/30"
                  }`}
                />
                <span className="truncate font-body text-xs text-bone-muted">{event.label}</span>
              </span>
              <span className="shrink-0 font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                {relativeTime(event.at)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="font-body text-[11px] leading-relaxed text-bone-dim">
        Totals: {snapshot.sessions.length} sessions · {snapshot.events.length} events recorded in
        this browser. {summary.prev7} sessions in the previous week.
      </p>
    </div>
  );
}
