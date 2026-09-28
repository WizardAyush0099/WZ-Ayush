/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Clerk publishable key (public by design, starts with `pk_`). */
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
  /** Overrides the asset base — GitHub Pages builds set this to "./". */
  readonly VITE_BASE?: string;
  readonly BASE_URL: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
