import { useEffect, useRef, type ReactNode } from "react";
import {
  ClerkProvider,
  SignIn,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import {
  CLERK_KEY_ENV,
  accountRefOf,
  clerkPublishableKey,
  displayNameOf,
  isAdminUser,
  isAuthConfigured,
} from "../../lib/auth";
import { adminSetupHint } from "../../data/content";
import { linkTo } from "../../lib/router";
import { recordSignIn, recordSignOut } from "../../lib/telemetry";
import { ApiAuthBridge } from "../../lib/apiAuth";

/* -------------------------------------------------------------------------- */
/*  Appearance — Clerk styled to match the site's dark cinematic language     */
/* -------------------------------------------------------------------------- */

const appearance = {
  variables: {
    colorPrimary: "#d61f26",
    colorBackground: "#0a0709",
    colorText: "#ece7e1",
    colorTextSecondary: "#a9a29b",
    colorInputBackground: "rgba(236,231,225,0.05)",
    colorInputText: "#ece7e1",
    colorDanger: "#f24b4b",
    colorSuccess: "#4bb37a",
    borderRadius: "2px",
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: "0.95rem",
  },
  elements: {
    rootBox: "w-full",
    card: "bg-ink-900 border border-bone/10 shadow-none",
    headerTitle: "font-display uppercase tracking-wide2 text-bone",
    headerSubtitle: "text-bone-dim",
    socialButtonsBlockButton: "border border-bone/15 bg-transparent hover:bg-bone/5",
    formButtonPrimary:
      "bg-blood-600 hover:bg-blood-500 text-bone normal-case tracking-normal",
    footerActionLink: "text-blood-400 hover:text-blood-300",
    formFieldInput: "bg-bone/5 border-bone/15 text-bone",
    dividerLine: "bg-bone/10",
    dividerText: "text-bone-dim",
    identityPreview: "bg-bone/5 border-bone/10",
    userButtonPopoverCard: "bg-ink-900 border border-bone/10",
    userPreviewSecondaryIdentifier: "text-bone-dim",
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Provider                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Wraps the app in Clerk — but only when a key exists. Without the key the
 * site still renders fully; auth surfaces explain what to configure instead
 * of throwing inside a provider that cannot be constructed.
 */
export function AuthLayer({ children }: { children: ReactNode }) {
  if (!isAuthConfigured) return <>{children}</>;

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      appearance={appearance}
      afterSignOutUrl={import.meta.env.BASE_URL}
    >
      <SessionTracker />
      {/* Mirrors the Clerk session token for authenticated API calls. */}
      <ApiAuthBridge />
      {children}
    </ClerkProvider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Session tracking — growth + logins                                        */
/* -------------------------------------------------------------------------- */

/** Attributes the current session to the signed-in Clerk user. */
function SessionTracker() {
  const { isLoaded, isSignedIn, user } = useUser();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    const id = isSignedIn && user ? user.id : null;

    if (id && previous.current !== id && user) {
      recordSignIn(accountRefOf(user));
    } else if (!id && previous.current) {
      recordSignOut();
    }
    previous.current = id;
  }, [isLoaded, isSignedIn, user]);

  return null;
}

/* -------------------------------------------------------------------------- */
/*  Controls                                                                  */
/* -------------------------------------------------------------------------- */

const CLERK_ENABLED = isAuthConfigured;

/**
 * Sign in / sign up when logged out, account menu when logged in.
 * Rendered in the navbar (desktop and inside the mobile menu).
 */
export default function AuthControls() {
  if (!CLERK_ENABLED) return <AuthSetupNotice compact />;
  return <ClerkControls />;
}

function ClerkControls() {
  const { isLoaded, user } = useUser();
  const admin = isAdminUser(user);

  if (!isLoaded) {
    return <span className="block h-9 w-24 animate-pulse bg-bone/5" aria-hidden="true" />;
  }

  return (
    <>
      <SignedOut>
        <div className="flex items-center gap-3">
          <SignInButton mode="modal">
            <button
              type="button"
              data-cursor="hover"
              className="font-body text-[11px] font-medium uppercase tracking-wide2 text-bone-muted transition-colors duration-300 hover:text-bone"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button
              type="button"
              data-cursor="hover"
              className="border border-blood-600/70 bg-blood-600/10 px-4 py-2 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone transition-colors duration-300 hover:border-blood-500 hover:bg-blood-600/20"
            >
              Sign up
            </button>
          </SignUpButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex items-center gap-4">
          {admin && (
            <a
              href={linkTo("/admin")}
              data-cursor="hover"
              className="hidden font-body text-[11px] font-medium uppercase tracking-wide2 text-blood-400 transition-colors duration-300 hover:text-blood-300 md:inline"
            >
              Dashboard
            </a>
          )}
          <span className="hidden max-w-[120px] truncate font-body text-[11px] text-bone-dim lg:inline">
            {displayNameOf(user)}
          </span>
          <UserButton afterSignOutUrl={import.meta.env.BASE_URL} appearance={appearance} />
        </div>
      </SignedIn>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Not-configured hints                                                      */
/* -------------------------------------------------------------------------- */

export function AuthSetupNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <a
        href="#/admin"
        data-cursor="hover"
        title={`Set ${CLERK_KEY_ENV} to enable sign in`}
        className="hidden border border-bone/15 px-4 py-2 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone-dim transition-colors hover:border-bone/30 hover:text-bone sm:inline-block"
      >
        Sign in
      </a>
    );
  }

  return (
    <div className="mx-auto max-w-[520px] border border-bone/10 bg-ink-900 p-8">
      <p className="font-body text-[11px] uppercase tracking-cinematic text-blood-500/80">Auth not configured</p>
      <h2 className="display mt-4 text-2xl text-bone">Add your Clerk publishable key</h2>
      <p className="mt-4 font-body text-sm leading-relaxed text-bone-muted">
        Authentication is wired up and waiting for credentials. Add this environment variable
        and the sign-in, sign-up and dashboard controls appear immediately:
      </p>
      <code className="mt-5 block border border-bone/10 bg-ink-950 px-4 py-3 font-mono text-xs text-bone">
        {CLERK_KEY_ENV}=pk_test_…
      </code>
      <p className="mt-4 font-body text-xs leading-relaxed text-bone-dim">
        Settings → Environment → add the key → save. It is a public value (it starts with
        <span className="text-bone-muted"> pk_</span>), so it is safe to paste. Never add the
        <span className="text-bone-muted"> secret key</span> to client code.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Admin gate                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Renders `children` only for a signed-in admin. Signed-out visitors get the
 * real Clerk sign-in form; signed-in non-admins get a clear explanation.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  if (!CLERK_ENABLED) {
    return (
      <div className="shell py-28">
        <AuthSetupNotice />
      </div>
    );
  }
  return <ClerkAdminGate>{children}</ClerkAdminGate>;
}

function ClerkAdminGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-[70svh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border border-bone/15 border-t-blood-500" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="shell flex min-h-[85svh] flex-col items-center justify-center gap-8 py-24">
        <div className="text-center">
          <p className="font-body text-[11px] uppercase tracking-cinematic text-blood-500/80">Restricted</p>
          <h1 className="display mt-4 text-4xl text-bone sm:text-5xl">Dashboard</h1>
          <p className="mt-4 max-w-[42ch] font-body text-sm text-bone-muted">
            Sign in to view growth, logins and image management.
          </p>
        </div>
        <SignIn routing="virtual" appearance={appearance} />
      </div>
    );
  }

  if (!isAdminUser(user)) {
    return (
      <div className="shell flex min-h-[85svh] items-center justify-center py-24">
        <div className="max-w-[560px] border border-bone/10 bg-ink-900 p-8 text-center">
          <p className="font-body text-[11px] uppercase tracking-cinematic text-blood-500/80">Not authorised</p>
          <h1 className="display mt-4 text-3xl text-bone">No dashboard access</h1>
          <p className="mt-4 font-body text-sm leading-relaxed text-bone-muted">
            You are signed in as{" "}
            <span className="text-bone">{displayNameOf(user)}</span>, but this account is not on
            the admin list.
          </p>
          <p className="mt-4 font-body text-xs leading-relaxed text-bone-dim">{adminSetupHint}</p>
          <div className="mt-7 flex items-center justify-center gap-4">
            <UserButton afterSignOutUrl={import.meta.env.BASE_URL} appearance={appearance} />
            <a
              href={linkTo("/")}
              className="border border-bone/15 px-5 py-2.5 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/30 hover:text-bone"
            >
              Back to site
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
