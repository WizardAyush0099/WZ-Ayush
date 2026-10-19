import { useState, type FormEvent } from "react";
import { studioAuth } from "../../lib/studioAuth";

/**
 * ============================================================================
 *  STUDIO SIGN-IN PANEL — the first-party form
 * ============================================================================
 *  Used wherever sign-in is needed while Clerk is not configured. It has two
 *  modes: create the owner account (pre-selected when no account exists in this
 *  browser yet) and sign in to one that does. Both go through `studioAuth`,
 *  which salts and hashes the password locally — nothing is sent anywhere.
 * ============================================================================
 */

export function StudioSignInPanel({ onDone }: { onDone?: () => void }) {
  const [mode, setMode] = useState<"signin" | "register">(() =>
    studioAuth.needsFirstAccount() ? "register" : "signin",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registering = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (registering) {
        await studioAuth.registerAccount({ name, email, password });
      } else {
        await studioAuth.signIn({ email, password });
      }
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(registering ? "signin" : "register");
    setError(null);
    setPassword("");
  }

  return (
    <div className="mx-auto w-full max-w-sm border border-bone/10 bg-ink-900 p-6">
      <div className="flex items-center justify-between gap-4 border-b border-bone/10 pb-4">
        <span className="font-body text-[10px] uppercase tracking-cinematic text-blood-500/80">
          Studio access
        </span>
        <button
          type="button"
          onClick={switchMode}
          className="font-body text-[11px] uppercase tracking-wide2 text-bone-dim underline decoration-bone/20 underline-offset-4 transition-colors hover:text-bone"
        >
          {registering ? "Sign in" : "Create account"}
        </button>
      </div>

      <h2 className="display mt-5 text-2xl text-bone">
        {registering ? "Create the owner account" : "Welcome back"}
      </h2>
      <p className="mt-2 font-body text-xs leading-relaxed text-bone-dim">
        {registering
          ? "The dashboard belongs to one address: ayushdanthta@gmail.com. Create the account with it — any other address is refused at this step, and it is the only address that can open the dashboard. The account lives in this browser."
          : "Sign in with the account you created in this browser."}
      </p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        {registering && (
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">Name</span>
            <input
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="border border-bone/15 bg-bone/5 px-3 py-2.5 font-body text-sm text-bone outline-none transition-colors focus:border-blood-500/70"
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">Email</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="border border-bone/15 bg-bone/5 px-3 py-2.5 font-body text-sm text-bone outline-none transition-colors focus:border-blood-500/70"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">Password</span>
          <input
            type="password"
            autoComplete={registering ? "new-password" : "current-password"}
            required
            minLength={registering ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={registering ? "At least 8 characters" : "Your password"}
            className="border border-bone/15 bg-bone/5 px-3 py-2.5 font-body text-sm text-bone outline-none transition-colors focus:border-blood-500/70"
          />
        </label>

        {error && (
          <p role="alert" className="border border-blood-800/60 bg-blood-950/30 px-3 py-2 font-body text-[11px] leading-relaxed text-blood-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 border border-blood-600/70 bg-blood-600/15 px-5 py-3 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone transition-colors hover:border-blood-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Working…" : registering ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-5 font-body text-[10px] leading-relaxed uppercase tracking-wide2 text-bone-dim">
        {studioAuth.studioFooterHint()}
      </p>
    </div>
  );
}
