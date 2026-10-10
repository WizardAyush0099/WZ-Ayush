/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Clerk publishable key (public by design, starts with `pk_`). */
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
  /** Overrides the asset base — GitHub Pages builds set this to "./". */
  readonly VITE_BASE?: string;
  /**
   * WhatsApp number for enquiries, digits only (country code + number).
   * Overrides `contact.whatsapp` in src/data/content.ts.
   */
  readonly VITE_WHATSAPP_NUMBER?: string;
  /**
   * Extra admin emails (comma separated), merged with `adminAllowlist`.
   * Not a secret — it is the client-side gate; the server checks its own list.
   */
  readonly VITE_ADMIN_EMAILS?: string;
  /** Explicit analytics/site-data endpoint. Defaults to /api/analytics in prod. */
  readonly VITE_ANALYTICS_URL?: string;
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
