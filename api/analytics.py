"""
============================================================================
 ANALYTICS API — shared, cross-visitor growth + login tracking
============================================================================
 A tiny serverless endpoint (Freebuff hosting installs `requirements.txt`
 itself) that stores every visitor's sessions and events in Postgres, so the
 admin dashboard can show *all* traffic instead of one browser's localStorage.

 Routes (both served by this one file):

     POST /api/analytics   { "sessions": [...], "events": [...] }
     GET  /api/analytics   -> { "sessions": [...], "events": [...] }

 The GET response deliberately mirrors the client `Snapshot` shape, so the
 dashboard's existing derivations (daily series, summaries, breakdowns) work
 against it with no changes.

 Requires one env var: DATABASE_URL (a Postgres connection string).
 Without it the endpoint answers 503 and the client falls back to local-only
 tracking, so the site never breaks.
============================================================================
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler

try:  # psycopg is only present when requirements.txt has been installed
    import psycopg
except Exception:  # pragma: no cover - import guard for local dev
    psycopg = None  # type: ignore[assignment]

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()

MAX_SESSIONS = 800
MAX_EVENTS = 3000

SCHEMA = """
create table if not exists wz_sessions (
  id            text primary key,
  visitor       text not null,
  started_at    timestamptz not null,
  last_seen_at  timestamptz not null,
  device        text,
  browser       text,
  os            text,
  region        text,
  referrer      text,
  account_id    text,
  account_name  text,
  account_email text
);

create table if not exists wz_events (
  id            text primary key,
  kind          text not null,
  at            timestamptz not null,
  visitor       text,
  label         text,
  account_id    text,
  account_name  text,
  account_email text
);

create index if not exists wz_events_at_idx on wz_events (at desc);
create index if not exists wz_sessions_started_idx on wz_sessions (started_at desc);
"""


def _connect():
    """Open a short-lived connection, or None when the DB is not configured."""
    if not DATABASE_URL or psycopg is None:
        return None
    return psycopg.connect(DATABASE_URL, connect_timeout=8, autocommit=True)


def _parse_ts(value):
    """Accept an ISO string or epoch millis; return an aware datetime."""
    if value is None:
        return datetime.now(timezone.utc)
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value) / 1000.0, tz=timezone.utc)
    text = str(value).replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return datetime.now(timezone.utc)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _iso(value):
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).isoformat()
    return value


class handler(BaseHTTPRequestHandler):
    """Vercel/Freebuff-style Python function entry point."""

    # ---------------------------------------------------------------- helpers
    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except (TypeError, ValueError):
            length = 0
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw.decode("utf-8"))
            return data if isinstance(data, dict) else {}
        except (ValueError, UnicodeDecodeError):
            return {}

    @staticmethod
    def _ensure_schema(conn) -> None:
        with conn.cursor() as cur:
            cur.execute(SCHEMA)

    # ------------------------------------------------------------------ verbs
    def do_OPTIONS(self) -> None:  # noqa: N802 (stdlib naming)
        self._send(204, {"ok": True})

    def do_GET(self) -> None:  # noqa: N802
        conn = _connect()
        if conn is None:
            self._send(503, {"ok": False, "error": "analytics backend not configured"})
            return
        try:
            self._ensure_schema(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    select id, visitor, started_at, last_seen_at, device, browser,
                           os, region, referrer, account_id, account_name, account_email
                    from wz_sessions
                    order by started_at desc
                    limit %s
                    """,
                    (MAX_SESSIONS,),
                )
                session_rows = cur.fetchall()

                cur.execute(
                    """
                    select id, kind, at, visitor, label, account_id, account_name, account_email
                    from wz_events
                    order by at desc
                    limit %s
                    """,
                    (MAX_EVENTS,),
                )
                event_rows = cur.fetchall()

            sessions = [
                {
                    "id": r[0],
                    "visitor": r[1],
                    "startedAt": _iso(r[2]),
                    "lastSeenAt": _iso(r[3]),
                    "device": r[4] or "desktop",
                    "browser": r[5] or "Other",
                    "os": r[6] or "Other",
                    "region": r[7] or "Unknown",
                    "referrer": r[8] or "Direct",
                    "account": (
                        {"id": r[9], "name": r[10] or "", "email": r[11] or ""}
                        if r[9]
                        else None
                    ),
                }
                for r in session_rows
            ]

            events = [
                {
                    "id": r[0],
                    "kind": r[1],
                    "at": _iso(r[2]),
                    "visitor": r[3],
                    "label": r[4] or "",
                    "account": (
                        {"id": r[5], "name": r[6] or "", "email": r[7] or ""}
                        if r[5]
                        else None
                    ),
                }
                for r in event_rows
            ]

            self._send(200, {"ok": True, "sessions": sessions, "events": events})
        except Exception as exc:  # noqa: BLE001 - never leak a stack trace
            self._send(500, {"ok": False, "error": str(exc)[:200]})
        finally:
            conn.close()

    def do_POST(self) -> None:  # noqa: N802
        conn = _connect()
        if conn is None:
            self._send(503, {"ok": False, "error": "analytics backend not configured"})
            return
        payload = self._read_json()
        sessions = payload.get("sessions") or []
        events = payload.get("events") or []
        if not isinstance(sessions, list) or not isinstance(events, list):
            self._send(400, {"ok": False, "error": "sessions and events must be arrays"})
            return
        try:
            self._ensure_schema(conn)
            written = 0
            with conn.cursor() as cur:
                for s in sessions[:50]:
                    if not isinstance(s, dict) or not s.get("id"):
                        continue
                    account = s.get("account") or {}
                    cur.execute(
                        """
                        insert into wz_sessions
                          (id, visitor, started_at, last_seen_at, device, browser, os,
                           region, referrer, account_id, account_name, account_email)
                        values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        on conflict (id) do update set
                          last_seen_at = excluded.last_seen_at,
                          account_id = excluded.account_id,
                          account_name = excluded.account_name,
                          account_email = excluded.account_email
                        """,
                        (
                            str(s["id"]),
                            str(s.get("visitor") or "unknown"),
                            _parse_ts(s.get("startedAt")),
                            _parse_ts(s.get("lastSeenAt") or s.get("startedAt")),
                            s.get("device"),
                            s.get("browser"),
                            s.get("os"),
                            s.get("region"),
                            s.get("referrer"),
                            account.get("id"),
                            account.get("name"),
                            account.get("email"),
                        ),
                    )
                    written += 1

                for e in events[:200]:
                    if not isinstance(e, dict) or not e.get("id"):
                        continue
                    account = e.get("account") or {}
                    cur.execute(
                        """
                        insert into wz_events
                          (id, kind, at, visitor, label, account_id, account_name, account_email)
                        values (%s,%s,%s,%s,%s,%s,%s,%s)
                        on conflict (id) do nothing
                        """,
                        (
                            str(e["id"]),
                            str(e.get("kind") or "note"),
                            _parse_ts(e.get("at")),
                            str(e.get("visitor") or "unknown"),
                            e.get("label"),
                            account.get("id"),
                            account.get("name"),
                            account.get("email"),
                        ),
                    )
                    written += 1

            self._send(200, {"ok": True, "written": written})
        except Exception as exc:  # noqa: BLE001
            self._send(500, {"ok": False, "error": str(exc)[:200]})
        finally:
            conn.close()

    def log_message(self, *_args) -> None:  # keep serverless logs quiet
        return
