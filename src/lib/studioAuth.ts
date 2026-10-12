import { useSyncExternalStore } from "react";
import { adminAllowlist } from "../data/content";

/**
 * ============================================================================
 *  STUDIO SIGN-IN — first-party accounts for when Clerk is not configured
 * ============================================================================
 *  When a Clerk publishable key is absent the site still needs a working sign-in
 *  path so an owner can reach the dashboard. This file provides it on its own,
 *  without any external service:
 *
 *    accounts   kept in localStorage, each salted and hashed with the Web
 *               Crypto API (PBKDF2-SHA256, 200k rounds) — plaintext passwords
 *               never leave this browser and never appear in source
 *    sessions   a random token the browser keeps for 30 days, then expires
 *    admin      the same email allow-list the rest of the site already uses
 *
 *  A local account can only ever run in this browser, so the dashboard says so
 *  and points at Clerk as the way to get cross-device accounts. Every store
 *  change notifies subscribers, so React re-renders on sign-in and sign-out.
 * ============================================================================
 */

const STORAGE_KEY = "wz.studio.v1";
const ITERATIONS = 200_000;
const KEY_BITS = 256;
const SALT_BYTES = 16;
const SESSION_DAYS = 30;

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type StudioAccount = {
  id: string;
  name: string;
  email: string;
  salt: string;
  hash: string;
  iterations: number;
  createdAt: number;
};

/** The signed-in studio user, shaped like the identity the rest of the site uses. */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  provider: "studio";
};

type StudioSession = { userId: string; token: string; expiresAt: number };

type StudioDoc = { accounts: StudioAccount[]; session: StudioSession | null };

const EMPTY: StudioDoc = { accounts: [], session: null };

/* -------------------------------------------------------------------------- */
/*  Encoding + primitives                                                     */
/* -------------------------------------------------------------------------- */

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuffer(text: string): ArrayBuffer {
  const binary = atob(text);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) view[i] = binary.charCodeAt(i);
  return buffer;
}

function randomBuffer(bytes: number): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes);
  crypto.getRandomValues(new Uint8Array(buffer));
  return buffer;
}

function newId(): string {
  return `ss_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function expiryFromNow(days: number): number {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

/**
 * PBKDF2-SHA256 over the raw password with a per-account salt. The salt travels
 * as an ArrayBuffer so the same bytes can be handed to Web Crypto again when
 * verifying later.
 */
async function derive(password: string, salt: ArrayBuffer): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("This browser cannot hash passwords (Web Crypto unavailable).");
  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2", hash: "SHA-256" },
    false,
    ["deriveBits"],
  );
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    KEY_BITS,
  );
  return bytesToBase64(new Uint8Array(bits));
}

/* -------------------------------------------------------------------------- */
/*  Store                                                                     */
/* -------------------------------------------------------------------------- */

let doc: StudioDoc = EMPTY;
let current: SessionUser | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function persist(next: StudioDoc): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode — the session still works for this visit */
  }
}

/** Admin check using the same allow-list the rest of the site uses. */
export function isAdminEmail(email: string): boolean {
  if (!email) return false;
  const fromEnv = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const allowed = [...adminAllowlist, ...fromEnv].map((entry) => entry.toLowerCase());
  return allowed.includes(email.trim().toLowerCase());
}

function toUser(account: StudioAccount): SessionUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    isAdmin: isAdminEmail(account.email),
    provider: "studio",
  };
}

/** Recompute the cached session from the stored document. */
function sync(): void {
  const active = doc.session;
  if (!active || active.expiresAt <= Date.now()) {
    current = null;
    return;
  }
  const account = doc.accounts.find((entry) => entry.id === active.userId);
  current = account ? toUser(account) : null;
}

/** Load the stored document. Safe to call more than once. */
export function readDoc(): void {
  if (typeof window === "undefined") {
    loaded = true;
    return;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<StudioDoc> | null) : null;
    if (parsed && Array.isArray(parsed.accounts)) {
      doc = { accounts: parsed.accounts, session: parsed.session ?? null };
    }
  } catch {
    doc = EMPTY;
  }
  loaded = true;
  sync();
}

function ensureLoaded(): void {
  if (!loaded) readDoc();
}

function commit(next: StudioDoc): void {
  doc = next;
  sync();
  persist(next);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  ensureLoaded();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/** The current session, or null when signed out or expired. */
export function getSession(): SessionUser | null {
  ensureLoaded();
  const active = doc.session;
  if (active && active.expiresAt <= Date.now()) {
    // Persist quietly: this runs while React is reading the snapshot, so it
    // must not notify subscribers mid-render.
    doc = { ...doc, session: null };
    current = null;
    persist(doc);
  }
  return current;
}

/** True once a valid session exists. */
export function isSignedIn(): boolean {
  return getSession() !== null;
}

/** True when no account exists yet — the first one created is the owner's. */
export function needsFirstAccount(): boolean {
  ensureLoaded();
  return doc.accounts.length === 0;
}

/** Create an account and sign it in. Throws with a readable message. */
export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SessionUser> {
  ensureLoaded();
  const name = input.name.trim();
  const email = input.email.trim();
  if (!name) throw new Error("Enter your name.");
  if (email.length < 3 || !email.includes("@")) throw new Error("Enter a valid email address.");
  if (input.password.length < 8) throw new Error("Use at least 8 characters for the password.");
  if (doc.accounts.some((entry) => entry.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with that email already exists in this browser.");
  }

  const salt = randomBuffer(SALT_BYTES);
  const account: StudioAccount = {
    id: newId(),
    name,
    email,
    salt: bytesToBase64(new Uint8Array(salt)),
    hash: await derive(input.password, salt),
    iterations: ITERATIONS,
    createdAt: Date.now(),
  };

  commit({
    accounts: [...doc.accounts, account],
    session: { userId: account.id, token: newId(), expiresAt: expiryFromNow(SESSION_DAYS) },
  });
  return toUser(account);
}

/** Sign in with an existing account. Throws with a readable message. */
export async function signIn(input: { email: string; password: string }): Promise<SessionUser> {
  ensureLoaded();
  const email = input.email.trim().toLowerCase();
  const account = doc.accounts.find((entry) => entry.email.toLowerCase() === email);
  if (!account) throw new Error("No account found for that email.");
  const hash = await derive(input.password, base64ToBuffer(account.salt));
  if (hash !== account.hash) throw new Error("That password is not correct.");

  commit({
    ...doc,
    session: { userId: account.id, token: newId(), expiresAt: expiryFromNow(SESSION_DAYS) },
  });
  return toUser(account);
}

/** Sign out and drop the token. */
export function signOut(): void {
  ensureLoaded();
  commit({ ...doc, session: null });
}

/** The dashboard hint shown while the local studio path is in use. */
export function studioFooterHint(): string {
  return "Sign-in here uses a local account stored in this browser. Add a Clerk publishable key to move the site onto managed, cross-device accounts.";
}

/** React binding — re-renders on every sign-in, sign-out and account change. */
export function useStudioSession(): SessionUser | null {
  return useSyncExternalStore(subscribe, getSession, getSession);
}

/**
 * The same API as one object, for callers that prefer `studioAuth.signIn(…)`
 * and for feature-detecting any of it (`studioAuth.readDoc`).
 */
export const studioAuth = {
  readDoc,
  getSession,
  isSignedIn,
  needsFirstAccount,
  registerAccount,
  signIn,
  signOut,
  isAdminEmail,
  studioFooterHint,
  useStudioSession,
};
