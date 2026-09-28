import { adminAllowlist } from "../data/content";

/**
 * ============================================================================
 *  AUTH CONFIG
 * ============================================================================
 *  Clerk is loaded from the publishable key the user sets in the environment.
 *  When that key is absent the whole site still renders — auth controls
 *  explain what is missing instead of crashing the app. The publishable key
 *  is a public value by design (`pk_...`); the secret key is never needed by
 *  this client-only build and must never be exposed here.
 * ============================================================================
 */

const raw = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "").trim();

/** Publishable key currently in use, or "" when auth is not configured yet. */
export const clerkPublishableKey = raw;

/** True once a plausible Clerk publishable key is present. */
export const isAuthConfigured = raw.startsWith("pk_");

/** Env var name shown to the user when the key is missing. */
export const CLERK_KEY_ENV = "VITE_CLERK_PUBLISHABLE_KEY";

/**
 * Emails from `VITE_ADMIN_EMAILS` (comma separated), merged with the allow-list
 * in `src/data/content.ts`. This lets the dashboard be unlocked from the
 * environment without touching source: set `VITE_ADMIN_EMAILS=you@example.com`
 * in Settings → Environment (it is not a secret).
 */
const rawEnvAdmins: string = import.meta.env.VITE_ADMIN_EMAILS ?? "";
const envAdmins: string[] = rawEnvAdmins
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Every email permitted into the dashboard, de-duplicated. */
const allowlist = Array.from(
  new Set(
    [...adminAllowlist, ...envAdmins]
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  ),
);

type MaybeUser = {
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: Array<{ emailAddress?: string | null }>;
  publicMetadata?: Record<string, unknown> | null;
  username?: string | null;
  fullName?: string | null;
};

function emailOf(user: MaybeUser): string {
  const primary = user.primaryEmailAddress?.emailAddress;
  if (primary) return primary.toLowerCase().trim();
  const first = user.emailAddresses?.[0]?.emailAddress;
  return first ? first.toLowerCase().trim() : "";
}

/**
 * Who may open the dashboard.
 *
 * Either an email in `adminAllowlist` (src/data/content.ts) or a Clerk user
 * whose `publicMetadata.role === "admin"`.
 */
export function isAdminUser(user: MaybeUser | null | undefined): boolean {
  if (!user) return false;
  if (user.publicMetadata?.role === "admin") return true;
  const email = emailOf(user);
  if (!email) return false;
  return allowlist.includes(email);
}

/** True when the allow-list has not been set up yet — used for guidance copy. */
export const needsAdminSetup = allowlist.length === 0;

export function displayNameOf(user: MaybeUser | null | undefined): string {
  if (!user) return "Guest";
  return user.fullName || user.username || emailOf(user) || "Signed in";
}

export function accountRefOf(user: MaybeUser & { id: string }) {
  return {
    id: user.id,
    name: displayNameOf(user),
    email: emailOf(user),
  };
}
