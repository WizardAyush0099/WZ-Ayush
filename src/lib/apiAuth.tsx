import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";

/**
 * ============================================================================
 *  API AUTH — a real, short-lived credential for backend calls
 * ============================================================================
 *  Both the served data and the client need to prove who they are to the
 *  shared backend. Clerk already issues a signed, short-lived session JWT for
 *  every signed-in user; this module mirrors it into a module-level holder so
 *  non-React code (the site-data and order stores) can attach it to requests.
 *
 *  Nothing secret is stored here: the token is fetched from Clerk on demand,
 *  expires in about a minute, and the backend verifies its signature against
 *  Clerk's public JWKS before trusting it. A signed-out visitor simply sends
 *  no token, and the backend denies every privileged route.
 * ============================================================================
 */

let token: string | null = null;
let email: string | null = null;
let userId: string | null = null;

export const AUTH_CHANGED_EVENT = "wz:auth-changed";

export function getApiToken(): string | null {
  return token;
}

/** Headers to spread into any authenticated fetch. */
export function authHeaders(): Record<string, string> {
  return token ? { authorization: `Bearer ${token}` } : {};
}

/** Who the backend will see, for the dashboard's diagnostics panel. */
export function getApiIdentity(): { email: string | null; userId: string | null } {
  return { email, userId };
}

function apply(next: { token: string | null; email: string | null; userId: string | null }): void {
  const changed =
    next.token !== token || next.email !== email || next.userId !== userId;
  token = next.token;
  email = next.email;
  userId = next.userId;
  if (changed && typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

/**
 * Keeps the module-level token fresh while a user is signed in. Mounted inside
 * the Clerk provider by `AuthLayer`. Renders nothing.
 */
export function ApiAuthBridge() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      apply({ token: null, email: null, userId: null });
      return;
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        const next = await getToken();
        if (cancelled) return;
        apply({
          token: next ?? null,
          email: user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null,
          userId: user?.id ?? null,
        });
      } catch {
        if (!cancelled) apply({ token: null, email: null, userId: null });
      }
    };

    void refresh();
    // Clerk session tokens are short-lived; refresh well before expiry.
    const timer = window.setInterval(refresh, 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isLoaded, isSignedIn, getToken, user]);

  // Clear the credential promptly on sign-out.
  useEffect(() => {
    if (isLoaded && !isSignedIn) apply({ token: null, email: null, userId: null });
  }, [isLoaded, isSignedIn]);

  return null;
}

/** Increments whenever the caller's identity or token changes. */
export function useAuthRevision(): number {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const onChange = () => setRevision((r) => r + 1);
    window.addEventListener(AUTH_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onChange);
  }, []);
  return revision;
}
