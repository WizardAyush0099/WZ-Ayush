"""
============================================================================
 ANALYTICS + STUDIO API — shared data behind the public site and dashboard
============================================================================
 One serverless endpoint (invoked at /api/analytics) that does three jobs:

   1. Stores anonymous, cookie-free traffic data so the dashboard can show
      growth and sign-ins from *every* visitor, not one browser.
   2. Receives website briefs submitted from the builder.
   3. Holds the owner-editable site document — artwork paths, the cinematic
      scroll media config, and the project cards shown on the homepage.

 Routes
 ------
   GET  /api/analytics
        Public : { ok, authorized:false, config, projects }
        Admin  : { ok, authorized:true, config, projects, sessions, events, orders }

   POST /api/analytics
        Public : { sessions, events, orders }          (visitor traffic + briefs)
        Admin  : { config, projects, deleteOrder }     (site content changes)

 AUTHORIZATION (server-side, not cosmetic)
 -----------------------------------------
   Privileged reads and writes require a Clerk session JWT in the
   `Authorization: Bearer <token>` header. The token's RS256 signature is
   verified against Clerk's published JWKS, exp/nbf/iss are checked, and the
   caller must match one of:

       ADMIN_EMAILS    — comma separated emails (needs an `email` claim)
       ADMIN_USER_IDS  — comma separated Clerk user ids (`sub` claim)

   Clerk's default session token always includes `sub`, so ADMIN_USER_IDS is
   the dependable switch. When neither is set every privileged route fails
   closed with 403 and a machine-readable reason, and the dashboard tells you
   exactly which value to add.

 ENVIRONMENT
 -----------
   DATABASE_URL     Postgres connection string (required for any storage)
   CLERK_ISSUER     e.g. https://your-app.clerk.accounts.dev
   CLERK_JWKS_URL   optional explicit override for the key set
   ADMIN_EMAILS / ADMIN_USER_IDS
============================================================================
"""

from __future__ import annotations

import base64
import json
import os
import time
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler

try:  # psycopg is only present once requirements.txt has been installed
    import psycopg
except Exception:  # pragma: no cover - import guard for local dev
    psycopg = None  # type: ignore[assignment]

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()

MAX_SESSIONS = 800
MAX_EVENTS = 3000
MAX_ORDERS = 400

UNIT = "\u001f"  # separator for list-valued text columns

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

create table if not exists wz_orders (
  id             text primary key,
  created_at     timestamptz not null,
  name           text,
  contact        text,
  email          text,
  phone          text,
  business       text,
  website_type   text,
  template_id    text,
  template_name  text,
  theme_id       text,
  theme_name     text,
  features       text,
  pages          text,
  budget         text,
  timeline       text,
  wants          text,
  avoids         text,
  references     text,
  goal           text,
  audience       text,
  has_logo       text,
  has_content    text,
  needs_hosting  text,
  needs_updates  text,
  conditional    text,
  visitor        text,
  status         text default 'new',
  notes          text default '',
  updated_at     timestamptz default now()
);

/* The editable site document: one row per key ("config", "projects"). */
create table if not exists wz_site (
  key        text primary key,
  doc        jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists wz_events_at_idx on wz_events (at desc);
create index if not exists wz_sessions_started_idx on wz_sessions (started_at desc);
create index if not exists wz_orders_created_idx on wz_orders (created_at desc);

/* Deployments created before these columns existed are upgraded in place. */
alter table wz_orders add column if not exists email text;
alter table wz_orders add column if not exists phone text;
alter table wz_orders add column if not exists website_type text;
alter table wz_orders add column if not exists features text;
alter table wz_orders add column if not exists goal text;
alter table wz_orders add column if not exists audience text;
alter table wz_orders add column if not exists has_logo text;
alter table wz_orders add column if not exists has_content text;
alter table wz_orders add column if not exists needs_hosting text;
alter table wz_orders add column if not exists needs_updates text;
alter table wz_orders add column if not exists conditional text;
alter table wz_orders add column if not exists notes text default '';
alter table wz_orders add column if not exists updated_at timestamptz default now();
"""


# ---------------------------------------------------------------------------
#  Connections
# ---------------------------------------------------------------------------


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


def _text(value, limit: int = 4000) -> str:
    """Coerce anything to a trimmed string, capped so one field cannot bloat."""
    if value is None:
        return ""
    return str(value)[:limit]


def _join(values) -> str:
    if not isinstance(values, list):
        return _text(values)
    return UNIT.join(_text(v, 300) for v in values if _text(v, 300))


def _split(value) -> list[str]:
    return [p for p in _text(value, 8000).split(UNIT) if p]


# ---------------------------------------------------------------------------
#  Clerk session-token verification (RS256 against the published JWKS)
# ---------------------------------------------------------------------------

_jwks_cache: dict = {"at": 0.0, "keys": []}


def _issuer() -> str:
    return os.environ.get("CLERK_ISSUER", "").strip().rstrip("/")


def _jwks_url() -> str:
    explicit = os.environ.get("CLERK_JWKS_URL", "").strip()
    if explicit:
        return explicit
    issuer = _issuer()
    return f"{issuer}/.well-known/jwks.json" if issuer else ""


def _b64url(data: str) -> bytes:
    padded = data + "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(padded)


def _fetch_jwks() -> list:
    """Public keys from Clerk, cached for an hour. Never raises."""
    url = _jwks_url()
    if not url:
        return []
    now = time.time()
    if _jwks_cache["keys"] and now - float(_jwks_cache["at"]) < 3600:
        return _jwks_cache["keys"]
    try:
        with urllib.request.urlopen(url, timeout=8) as response:  # noqa: S310
            document = json.loads(response.read().decode("utf-8"))
        keys = document.get("keys") or []
        _jwks_cache["at"] = now
        _jwks_cache["keys"] = keys
        return keys
    except Exception:  # noqa: BLE001 - network failure must not 500 the API
        return _jwks_cache["keys"]


def _verify_bearer(token: str):
    """Verify a Clerk JWT. Returns (claims, error) — claims is None on failure."""
    # Structural checks come first so the reported reason is always accurate,
    # even on a host where the crypto dependency has not been installed yet.
    parts = token.split(".")
    if len(parts) != 3:
        return None, "malformed-token"

    try:
        header = json.loads(_b64url(parts[0]))
        payload = json.loads(_b64url(parts[1]))
    except Exception:  # noqa: BLE001
        return None, "malformed-token"

    if header.get("alg") != "RS256":
        return None, "unsupported-algorithm"

    try:
        from cryptography.exceptions import InvalidSignature
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import padding, rsa
    except Exception:  # pragma: no cover - cryptography missing
        return None, "verifier-unavailable"

    key_doc = next(
        (k for k in _fetch_jwks() if k.get("kid") == header.get("kid")), None
    )
    if key_doc is None:
        return None, "signing-key-unavailable"
    if key_doc.get("kty") != "RSA" or not key_doc.get("n") or not key_doc.get("e"):
        return None, "unsupported-key"

    try:
        public_key = rsa.RSAPublicNumbers(
            int.from_bytes(_b64url(key_doc["e"]), "big"),
            int.from_bytes(_b64url(key_doc["n"]), "big"),
        ).public_key()
        public_key.verify(
            _b64url(parts[2]),
            f"{parts[0]}.{parts[1]}".encode("utf-8"),
            padding.PKCS1v15(),
            hashes.SHA256(),
        )
    except InvalidSignature:
        return None, "bad-signature"
    except Exception:  # noqa: BLE001
        return None, "verification-failed"

    now = time.time()
    exp = payload.get("exp")
    if isinstance(exp, (int, float)) and now > float(exp) + 30:
        return None, "token-expired"
    nbf = payload.get("nbf")
    if isinstance(nbf, (int, float)) and now + 60 < float(nbf):
        return None, "token-not-yet-valid"
    issuer = _issuer()
    if issuer and payload.get("iss") and str(payload["iss"]).rstrip("/") != issuer:
        return None, "wrong-issuer"

    return payload, None


def _admin_emails() -> set:
    return {
        e.strip().lower()
        for e in os.environ.get("ADMIN_EMAILS", "").split(",")
        if e.strip()
    }


def _admin_ids() -> set:
    return {
        i.strip() for i in os.environ.get("ADMIN_USER_IDS", "").split(",") if i.strip()
    }


def _authorize(authorization_header: str | None) -> dict:
    """
    Resolve the caller's privileges. Never raises.

    Returns dict with: authorized (bool), reason (str), and — for a valid but
    not-allowed caller — their own `sub`/`email`, so the dashboard can show
    exactly which value to add to the environment.
    """
    emails, ids = _admin_emails(), _admin_ids()
    configured = bool(emails or ids)

    header = authorization_header or ""
    token = header[7:].strip() if header.lower().startswith("bearer ") else ""

    if not token:
        return {"authorized": False, "reason": "no-token", "configured": configured}
    if not configured:
        # Fail closed: an unconfigured deployment exposes nothing.
        return {
            "authorized": False,
            "reason": "no-admin-configured",
            "configured": False,
        }

    claims, error = _verify_bearer(token)
    if claims is None:
        return {
            "authorized": False,
            "reason": error or "invalid-token",
            "configured": True,
        }

    subject = str(claims.get("sub") or "")
    email = str(claims.get("email") or claims.get("email_address") or "").lower()

    if subject and subject in ids:
        return {"authorized": True, "reason": "admin-id", "configured": True}
    if email and email in emails:
        return {"authorized": True, "reason": "admin-email", "configured": True}

    return {
        "authorized": False,
        "reason": "not-allowed",
        "configured": True,
        # The caller's own identity, so setup is diagnosable from the UI.
        "subject": subject,
        "email": email,
    }


# ---------------------------------------------------------------------------
#  Handler
# ---------------------------------------------------------------------------


class handler(BaseHTTPRequestHandler):
    """Vercel/Freebuff-style Python function entry point."""

    # ---------------------------------------------------------------- helpers
    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header(
            "Access-Control-Allow-Headers", "content-type, authorization"
        )
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

    @staticmethod
    def _read_site(conn) -> dict:
        """The public site document: { config, projects }."""
        with conn.cursor() as cur:
            cur.execute("select key, doc from wz_site")
            rows = cur.fetchall()
        document = {"config": None, "projects": []}
        for key, doc in rows:
            if key == "config":
                document["config"] = doc
            elif key == "projects" and isinstance(doc, list):
                document["projects"] = doc
        return document

    # ------------------------------------------------------------------ verbs
    def do_OPTIONS(self) -> None:  # noqa: N802 (stdlib naming)
        self._send(204, {"ok": True})

    def do_GET(self) -> None:  # noqa: N802
        conn = _connect()
        if conn is None:
            self._send(503, {"ok": False, "error": "analytics backend not configured"})
            return
        auth = _authorize(self.headers.get("Authorization"))
        try:
            self._ensure_schema(conn)
            site = self._read_site(conn)

            if not auth["authorized"]:
                # Public payload: the site's own content, nothing personal.
                self._send(
                    200,
                    {
                        "ok": True,
                        "authorized": False,
                        "auth": auth,
                        "config": site["config"],
                        "projects": site["projects"],
                    },
                )
                return

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

                cur.execute(
                    """
                    select id, created_at, name, contact, email, phone, business,
                           website_type, template_id, template_name, theme_id,
                           theme_name, features, pages, budget, timeline, wants,
                           avoids, references, goal, audience, has_logo,
                           has_content, needs_hosting, needs_updates, conditional,
                           visitor, status, notes
                    from wz_orders
                    order by created_at desc
                    limit %s
                    """,
                    (MAX_ORDERS,),
                )
                order_rows = cur.fetchall()

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

            orders = [
                {
                    "id": r[0],
                    "createdAt": _iso(r[1]),
                    "name": r[2] or "",
                    "contact": r[3] or "",
                    "email": r[4] or "",
                    "phone": r[5] or "",
                    "business": r[6] or "",
                    "websiteType": r[7] or "",
                    "templateId": r[8] or "",
                    "templateName": r[9] or "",
                    "themeId": r[10] or "",
                    "themeName": r[11] or "",
                    "features": _split(r[12]),
                    "pagesNeeded": _text(r[13]),
                    "budget": r[14] or "",
                    "timeline": r[15] or "",
                    "wants": r[16] or "",
                    "avoids": r[17] or "",
                    "references": r[18] or "",
                    "goal": r[19] or "",
                    "audience": r[20] or "",
                    "hasLogo": r[21] or "",
                    "hasContent": r[22] or "",
                    "needsHosting": r[23] or "",
                    "needsUpdates": r[24] or "",
                    "conditional": _json_or_empty(r[25]),
                    "visitor": r[26] or "",
                    "status": r[27] or "new",
                    "notes": r[28] or "",
                }
                for r in order_rows
            ]

            self._send(
                200,
                {
                    "ok": True,
                    "authorized": True,
                    "auth": auth,
                    "config": site["config"],
                    "projects": site["projects"],
                    "sessions": sessions,
                    "events": events,
                    "orders": orders,
                },
            )
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
        auth = _authorize(self.headers.get("Authorization"))

        sessions = payload.get("sessions") or []
        events = payload.get("events") or []
        orders = payload.get("orders") or []
        if not isinstance(sessions, list):
            sessions = []
        if not isinstance(events, list):
            events = []
        if not isinstance(orders, list):
            orders = []

        # Content changes are privileged — they reshape the public site.
        wants_content = any(
            key in payload for key in ("config", "projects", "deleteOrder")
        )
        if wants_content and not auth["authorized"]:
            self._send(
                403,
                {
                    "ok": False,
                    "authorized": False,
                    "auth": auth,
                    "error": "site content can only be changed by an authorised admin",
                },
            )
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

                for o in orders[:50]:
                    if not isinstance(o, dict) or not o.get("id"):
                        continue
                    cur.execute(
                        """
                        insert into wz_orders
                          (id, created_at, name, contact, email, phone, business,
                           website_type, template_id, template_name, theme_id,
                           theme_name, features, pages, budget, timeline, wants,
                           avoids, references, goal, audience, has_logo,
                           has_content, needs_hosting, needs_updates, conditional,
                           visitor, status, notes, updated_at)
                        values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now())
                        on conflict (id) do update set
                          status = excluded.status,
                          notes = excluded.notes,
                          features = excluded.features,
                          pages = excluded.pages,
                          budget = excluded.budget,
                          timeline = excluded.timeline,
                          wants = excluded.wants,
                          avoids = excluded.avoids,
                          references = excluded.references,
                          conditional = excluded.conditional,
                          updated_at = now()
                        """,
                        (
                            str(o["id"]),
                            _parse_ts(o.get("createdAt")),
                            _text(o.get("name"), 200),
                            _text(o.get("contact"), 200),
                            _text(o.get("email"), 200),
                            _text(o.get("phone"), 60),
                            _text(o.get("business"), 200),
                            _text(o.get("websiteType"), 80),
                            _text(o.get("templateId"), 80),
                            _text(o.get("templateName"), 120),
                            _text(o.get("themeId"), 60),
                            _text(o.get("themeName"), 60),
                            _join(o.get("features")),
                            _text(o.get("pagesNeeded") or o.get("pages"), 1200),
                            _text(o.get("budget"), 80),
                            _text(o.get("timeline"), 80),
                            _text(o.get("wants"), 4000),
                            _text(o.get("avoids"), 4000),
                            _text(o.get("references"), 2000),
                            _text(o.get("goal"), 600),
                            _text(o.get("audience"), 600),
                            _text(o.get("hasLogo"), 40),
                            _text(o.get("hasContent"), 40),
                            _text(o.get("needsHosting"), 40),
                            _text(o.get("needsUpdates"), 40),
                            json.dumps(o.get("conditional") or {}),
                            _text(o.get("visitor"), 80),
                            _text(o.get("status") or "new", 40),
                            _text(o.get("notes"), 4000),
                        ),
                    )
                    written += 1

                if isinstance(payload.get("config"), dict):
                    cur.execute(
                        """
                        insert into wz_site (key, doc, updated_at)
                        values ('config', %s::jsonb, now())
                        on conflict (key) do update set
                          doc = excluded.doc, updated_at = now()
                        """,
                        (json.dumps(payload["config"]),),
                    )
                    written += 1

                if isinstance(payload.get("projects"), list):
                    cur.execute(
                        """
                        insert into wz_site (key, doc, updated_at)
                        values ('projects', %s::jsonb, now())
                        on conflict (key) do update set
                          doc = excluded.doc, updated_at = now()
                        """,
                        (json.dumps(payload["projects"]),),
                    )
                    written += 1

                deleted = payload.get("deleteOrder")
                if isinstance(deleted, str) and deleted:
                    cur.execute("delete from wz_orders where id = %s", (deleted,))
                    written += 1

            self._send(200, {"ok": True, "authorized": True, "written": written})
        except Exception as exc:  # noqa: BLE001
            self._send(500, {"ok": False, "error": str(exc)[:200]})
        finally:
            conn.close()


def _json_or_empty(value) -> dict:
    """`conditional` answers arrive as a JSON string in a text column."""
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value.strip():
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except ValueError:
            return {}
    return {}
