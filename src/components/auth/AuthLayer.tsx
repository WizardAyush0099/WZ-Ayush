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
  studioNeedsFirstAccount,
  studioSignOut,
} from "../../lib/auth";
import { adminSetupHint } from "../../data/content";
import { useStudioSession, type SessionUser } from "../../lib/studioAuth";
import { StudioSignInPanel } from "./StudioSignInPanel";
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
 * Wraps the app in Clerk when a key is present, and in nothing otherwise —
 * the local studio provider runs without a provider and without Clerk.
 */
export function AuthLayer({ children }: { children: ReactNode }) {
  // Without a Clerk key the local studio provider is the whole auth story, so
  // the tracker that records its sign-ins mounts here instead.
  if (!isAuthConfigured) {
    return (
      <>
        <StudioSessionTracker />
        {children}
      </>
    );
  }

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

/**
 * Like SessionTracker but for the local studio provider when Clerk is absent,
 * so the dashboard's logins panel sees this path too. Renders nothing.
 */
function StudioSessionTracker() {
  const session = useStudioSession();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const id = session ? session.id : null;
    if (id && previous.current !== id && session) {
      recordSignIn({ id: session.id, name: session.name || session.email, email: session.email });
    } else if (!id && previous.current) {
      recordSignOut();
    }
    previous.current = id;
  }, [session]);

  return null;
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
  if (CLERK_ENABLED) return <ClerkControls />;
  return <StudioAuthControls />;
}

/**
 * The local studio path: an account menu once a session exists, and the
 * dashboard's sign-in entry point before that.
 */
function StudioAuthControls() {
  const session = useStudioSession();
  if (!session) return <AuthSetupNotice compact />;
  return <StudioControls session={session} />;
}

function StudioControls({ session }: { session: SessionUser }) {
  return (
    <div className="flex items-center gap-4">
      {session.isAdmin && (
        <a
          href={linkTo("/admin")}
          data-cursor="hover"
          className="hidden font-body text-[11px] font-medium uppercase tracking-wide2 text-blood-400 transition-colors duration-300 hover:text-blood-300 md:inline"
        >
          Dashboard
        </a>
      )}
      <span className="hidden max-w-[120px] truncate font-body text-[11px] text-bone-dim lg:inline">
        {session.name || session.email}
      </span>
      <button
        type="button"
        data-cursor="hover"
        onClick={studioSignOut}
        className="border border-bone/15 px-4 py-2 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone-muted transition-colors duration-300 hover:border-bone/30 hover:text-bone"
      >
        Sign out
      </button>
    </div>
  );
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
/*  The hamburger's account block                                             */
/* -------------------------------------------------------------------------- */

/**
 * What the account row of the mobile menu shows.
 *
 * The header's `AuthControls` is built for a single row of a desktop bar, and
 * every piece of it is width-driven: the signed-out button was `hidden` below
 * 640px and the signed-in name only appeared from `lg` up, so on the device
 * that actually opens the hamburger the account area was either invisible or
 * a lone "Sign out". This block is the phone's own version — avatar, name,
 * email, dashboard and the way back out, stacked so it fits a narrow column.
 *
 * Both providers are covered: the studio account (no Clerk key — the default
 * here) and Clerk when a publishable key is present. `onNavigate` closes the
 * menu before the route changes, exactly as the menu's own links do.
 */
export function MobileAccountBlock({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="pointer-events-auto mt-6">
      <span className="eyebrow">Account</span>
      <div className="mt-4">
        {CLERK_ENABLED ? <ClerkMenuAccount onNavigate={onNavigate} /> : <StudioMenuAccount onNavigate={onNavigate} />}
      </div>
    </div>
  );
}

/** A round initial, so there is something to look at even without a picture. */
function Avatar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full border border-bone/20 object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-blood-600/60 bg-blood-600/20 font-display text-base uppercase text-bone"
    >
      {(name.trim()[0] || "A").toUpperCase()}
    </span>
  );
}

function StudioMenuAccount({ onNavigate }: { onNavigate?: () => void }) {
  const session = useStudioSession();

  if (!session) {
    return (
      <div className="flex flex-col gap-3">
        <p className="max-w-[40ch] font-body text-[11px] leading-relaxed text-bone-dim">
          Studio access is a local account kept in this browser. The first account created
          is the owner's.
        </p>
        <a
          href={linkTo("/admin")}
          onClick={onNavigate}
          data-cursor="hover"
          className="inline-flex items-center justify-between gap-3 border border-blood-600/70 bg-blood-600/15 px-5 py-3 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone transition-colors duration-300 hover:border-blood-500 hover:bg-blood-600/25"
        >
          Sign in
          <span aria-hidden="true">→</span>
        </a>
      </div>
    );
  }

  const label = session.name || session.email;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar name={label} />
        <div className="min-w-0">
          <p className="truncate font-body text-sm text-bone">{label}</p>
          <p className="truncate font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            {session.email}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {session.isAdmin && (
          <a
            href={linkTo("/admin")}
            onClick={onNavigate}
            data-cursor="hover"
            className="border border-blood-600/70 bg-blood-600/15 px-4 py-2.5 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone transition-colors duration-300 hover:border-blood-500"
          >
            Open dashboard
          </a>
        )}
        <button
          type="button"
          data-cursor="hover"
          onClick={() => {
            studioSignOut();
            onNavigate?.();
          }}
          className="border border-bone/15 px-4 py-2.5 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone-muted transition-colors duration-300 hover:border-bone/30 hover:text-bone"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function ClerkMenuAccount({ onNavigate }: { onNavigate?: () => void }) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <span className="block h-10 w-40 animate-pulse bg-bone/5" aria-hidden="true" />;
  }

  if (!isSignedIn || !user) {
    return (
      <div className="flex flex-wrap gap-3">
        <SignInButton mode="modal">
          <button
            type="button"
            data-cursor="hover"
            className="border border-bone/15 px-5 py-3 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone-muted transition-colors duration-300 hover:border-bone/30 hover:text-bone"
          >
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button
            type="button"
            data-cursor="hover"
            className="border border-blood-600/70 bg-blood-600/15 px-5 py-3 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone transition-colors duration-300 hover:border-blood-500"
          >
            Sign up
          </button>
        </SignUpButton>
      </div>
    );
  }

  const name = displayNameOf(user);
  const email = user.primaryEmailAddress?.emailAddress ?? "";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar name={name} imageUrl={user.imageUrl} />
        <div className="min-w-0">
          <p className="truncate font-body text-sm text-bone">{name}</p>
          {email ? (
            <p className="truncate font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
              {email}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {isAdminUser(user) && (
          <a
            href={linkTo("/admin")}
            onClick={onNavigate}
            data-cursor="hover"
            className="border border-blood-600/70 bg-blood-600/15 px-4 py-2.5 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone transition-colors duration-300 hover:border-blood-500"
          >
            Open dashboard
          </a>
        )}
        <UserButton afterSignOutUrl={import.meta.env.BASE_URL} appearance={appearance} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Not-configured hints                                                      */
/* -------------------------------------------------------------------------- */

export function AuthSetupNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <a
        href={linkTo("/admin")}
        data-cursor="hover"
        title="Sign in to the studio dashboard"
        className="inline-block border border-bone/15 px-4 py-2 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone-dim transition-colors hover:border-bone/30 hover:text-bone"
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
        Settings → Environment → add the key → save, then redeploy so the value is baked into
        the build. It is a public value (it starts with
        <span className="text-bone-muted"> pk_</span>), so it is safe to paste. Never add the
        <span className="text-bone-muted"> secret key</span> to client code.
      </p>
      <p className="mt-3 font-body text-xs leading-relaxed text-bone-dim">
        Clerk labels the same value <span className="text-bone-muted">Publishable key</span>; the
        names <span className="text-bone-muted">CLERK_PUBLISHABLE_KEY</span> and
        <span className="text-bone-muted"> NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span> are read
        automatically too.
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
  if (!CLERK_ENABLED) return <StudioAdminGate>{children}</StudioAdminGate>;
  return <ClerkAdminGate>{children}</ClerkAdminGate>;
}

/**
 * Dashboard gate on the local studio path: the sign-in panel until a session
 * exists, then the same allow-list check the Clerk path uses. The shared
 * backend still authorises every privileged request on its own — this is the
 * on-screen half of the gate.
 */
function StudioAdminGate({ children }: { children: ReactNode }) {
  const session = useStudioSession();
  const firstAccount = studioNeedsFirstAccount();

  if (!session) {
    return (
      <div className="shell flex min-h-[85svh] flex-col items-center justify-center gap-8 py-24">
        <div className="text-center">
          <p className="font-body text-[11px] uppercase tracking-cinematic text-blood-500/80">Restricted</p>
          <h1 className="display mt-4 text-4xl text-bone sm:text-5xl">Dashboard</h1>
          <p className="mt-4 max-w-[46ch] font-body text-sm text-bone-muted">
            {firstAccount
              ? "No account exists in this browser yet. Create the owner account to open the dashboard."
              : "Sign in to view growth, logins and image management."}
          </p>
        </div>
        <StudioSignInPanel />
      </div>
    );
  }

  if (!session.isAdmin) {
    return (
      <div className="shell flex min-h-[85svh] items-center justify-center py-24">
        <div className="max-w-[560px] border border-bone/10 bg-ink-900 p-8 text-center">
          <p className="font-body text-[11px] uppercase tracking-cinematic text-blood-500/80">Not authorised</p>
          <h1 className="display mt-4 text-3xl text-bone">No dashboard access</h1>
          <p className="mt-4 font-body text-sm leading-relaxed text-bone-muted">
            You are signed in as <span className="text-bone">{session.name || session.email}</span>, but
            this account is not on the admin list.
          </p>
          <p className="mt-4 font-body text-xs leading-relaxed text-bone-dim">{adminSetupHint}</p>
          <div className="mt-7 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={studioSignOut}
              className="border border-bone/15 px-5 py-2.5 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/30 hover:text-bone"
            >
              Sign out
            </button>
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
