/**
 * ============================================================================
 *  SITE CONTENT — single source of truth
 * ============================================================================
 *  Everything editable lives here: copy, nav, projects, gallery and asset
 *  paths. Change the values below and the whole site follows — no component
 *  edits required.
 *
 *  Asset paths are prefixed with `import.meta.env.BASE_URL` so the same build
 *  works at the domain root (Vercel) and under a sub-path (GitHub Pages).
 * ============================================================================
 */

const base = import.meta.env.BASE_URL;

export const assets = {
  /** Large blurred silhouette behind the 3D hero stage. */
  heroShadow: `${base}assets/hero-shadow.svg`,
  /** Wide atmospheric backdrop. */
  background: `${base}assets/background.svg`,
  /** About section portrait. */
  portrait: `${base}assets/portrait.svg`,
  /** Final CTA backdrop. */
  cta: `${base}assets/cta.svg`,
} as const;

export type NavItem = { id: string; label: string };

export const nav: NavItem[] = [
  { id: "home", label: "Home" },
  { id: "story", label: "Approach" },
  { id: "work", label: "Work" },
  { id: "gallery", label: "Archive" },
  { id: "contact", label: "Contact" },
];

export const hero = {
  /** Primary wordmark — swap for your name or studio name. */
  title: "AYUSH",
  /** Short mono mark shown beside the wordmark. */
  accent: "WZ",
  tagline: "The Art of Building",
  traits: "Developer • Designer • Builder",
  scrollHint: "Scroll to explore",
  lede:
    "I design and engineer dark, motion-led web products — interfaces with real depth, built to be felt before they are understood.",
};

/** How I work — the section right after the hero. */
export const story = {
  eyebrow: "01 — Approach",
  title: "How I Work",
  accent: "WZ",
  body: [
    "I build focused digital products with an emphasis on motion, clarity and craft — interfaces that feel considered rather than decorated.",
    "Every project starts with the problem, not the pixels. What follows is iteration, restraint, and a lot of small details that add up.",
  ],
  stats: [
    { value: "04", label: "Shipped Products" },
    { value: "3D", label: "Real-time Web" },
    { value: "2026", label: "Latest Build" },
  ],
  image: `${base}assets/gallery/03.svg`,
};

export type Project = {
  index: string;
  title: string;
  accent: string;
  category: string;
  description: string;
  image: string;
  /** Bullet list of what the build actually does. */
  highlights: string[];
  /** Stack chips rendered on the row. */
  stack: string[];
  /** When set, clicking the row opens this link instead of the image viewer. */
  href?: string;
};

/**
 * Featured work — Study Hub and its three flagship pages.
 *
 * Each entry renders as one large row (number, title, category, description).
 * Add `href` to make the row open a live site/repo instead of the image viewer.
 */
export const projects: Project[] = [
  {
    index: "01",
    title: "Study Hub",
    accent: "Focus",
    category: "Product · Platform",
    description:
      "The core product: a study workspace that folds notes, resources and revision into one calm surface — built to cut every gram of friction out of focused learning.",
    image: `${base}assets/featured/01-study-hub.svg`,
    highlights: [
      "Unified workspace for notes, resources and revision",
      "Reactive dashboards that stay in sync as you work",
      "Built for long sessions — low noise, high clarity",
    ],
    stack: ["React", "TypeScript", "Convex"],
  },
  {
    index: "02",
    title: "FitLife Blueprint",
    accent: "Discipline",
    category: "Flagship Page",
    description:
      "A training and nutrition blueprint page that turns vague fitness intentions into a concrete, trackable plan — macros, phases and progress in one screen.",
    image: `${base}assets/featured/02-fitlife.svg`,
    highlights: [
      "Structured training phases with progress tracking",
      "Nutrition targets that adapt to your goal",
      "Motion-led onboarding that explains itself",
    ],
    stack: ["React", "GSAP", "Charts"],
  },
  {
    index: "03",
    title: "Guitar Theory Lab",
    accent: "Craft",
    category: "Flagship Page",
    description:
      "An interactive fretboard that makes music theory visible — scales, intervals and chords light up in place so the pattern is understood, not memorised.",
    image: `${base}assets/featured/03-guitar-lab.svg`,
    highlights: [
      "Live fretboard that highlights scales and intervals",
      "Chord and mode explorer with instant audio feedback",
      "Theory explained visually, in the order you play it",
    ],
    stack: ["React", "Web Audio", "SVG"],
  },
  {
    index: "04",
    title: "E-book Store",
    accent: "Commerce",
    category: "Flagship Page",
    description:
      "A dark, editorial storefront for digital books — cinematic covers, instant previews and a checkout flow that gets out of the way.",
    image: `${base}assets/featured/04-ebook-store.svg`,
    highlights: [
      "Editorial storefront that puts the writing first",
      "Sample reader with instant page previews",
      "Frictionless purchase and library delivery",
    ],
    stack: ["React", "Commerce", "Storage"],
  },
];

export type GalleryFrame = {
  src: string;
  alt: string;
  caption: string;
  /** Layout hints for the asymmetric gallery. */
  span: "tall" | "wide" | "square";
  rotate: number;
};

export const gallery: GalleryFrame[] = [
  { src: `${base}assets/gallery/01.svg`, alt: "Crimson moon rising over a ridge", caption: "Moonrise", span: "tall", rotate: -1.4 },
  { src: `${base}assets/horizontal/02.svg`, alt: "Crows scattering through smoke", caption: "Murmuration", span: "wide", rotate: 1.1 },
  { src: `${base}assets/gallery/03.svg`, alt: "A dead forest in low red light", caption: "Deadwood", span: "square", rotate: -0.8 },
  { src: `${base}assets/gallery/04.svg`, alt: "Embers drifting upward in darkness", caption: "Embers", span: "wide", rotate: 1.6 },
  { src: `${base}assets/gallery/05.svg`, alt: "Rain falling through a dark frame", caption: "Rainfall", span: "tall", rotate: 0.9 },
  { src: `${base}assets/gallery/06.svg`, alt: "A lone figure on a cliff edge", caption: "Vantage", span: "square", rotate: -1.2 },
];

export type HorizontalFrame = {
  src: string;
  alt: string;
  index: string;
  title: string;
  /** Relative visual weight — used for varied sizes in the horizontal reel. */
  scale: "sm" | "md" | "lg";
};

export const horizontal: HorizontalFrame[] = [
  { src: `${base}assets/horizontal/01.svg`, alt: "Concentric rings glowing in the dark", index: "I", title: "Perception", scale: "lg" },
  { src: `${base}assets/horizontal/02.svg`, alt: "Crows drifting through red mist", index: "II", title: "Flight", scale: "md" },
  { src: `${base}assets/horizontal/03.svg`, alt: "A torii gate at night", index: "III", title: "Gate", scale: "sm" },
  { src: `${base}assets/horizontal/04.svg`, alt: "A cloaked figure lit from behind", index: "IV", title: "Cloak", scale: "lg" },
  { src: `${base}assets/horizontal/05.svg`, alt: "Shapes dissolving into shadow", index: "V", title: "Feather", scale: "md" },
];

/** Capability grid — placed after the reel for rhythm. */
export const capabilities = {
  eyebrow: "02 — Capability",
  title: "What I Bring",
  body: "Three things I care about more than anything else on a build.",
  items: [
    {
      key: "01",
      title: "Interface Engineering",
      body: "React and TypeScript front-ends that stay fast under real content, real networks and real users.",
    },
    {
      key: "02",
      title: "Motion & 3D",
      body: "GSAP timelines and WebGL scenes — depth, parallax and physics that serve the story instead of showing off.",
    },
    {
      key: "03",
      title: "Product Thinking",
      body: "I scope to the problem, ship the smallest version that proves it, then refine what the data rewards.",
    },
  ],
};

export const about = {
  eyebrow: "03 — About",
  title: "Behind the Work",
  accent: "AY",
  body: [
    "I design and build dark, motion-led web experiences where atmosphere carries the story. Every scroll and transition is deliberate — restraint over spectacle.",
    "This portfolio is itself a build: a WebGL hero, a pinned horizontal reel and this account system, engineered to stay smooth even on a mid-range phone.",
  ],
  facts: [
    { label: "Focus", value: "Web Products" },
    { label: "Stack", value: "React · TypeScript" },
    { label: "Based", value: "Remote" },
  ],
};

export const cta = {
  eyebrow: "04 — Contact",
  title: "Let's Work Together",
  accent: "WZ",
  body: "Have a project, a role or an idea worth building? I'd like to hear about it.",
  action: "Get in Touch",
};

/**
 * Contact details.
 * `email` is intentionally empty — set it and the CTA + footer will use a
 * mailto link automatically; until then they point at GitHub.
 */
export const contact = {
  email: "",
  github: "https://github.com/WizardAyush0099",
};

export const footer = {
  tagline: "Portfolio",
  columns: [
    { title: "Explore", links: ["Home", "Approach", "Work", "Archive"] },
    { title: "Connect", links: ["Contact", "GitHub"] },
  ],
  social: [{ label: "GitHub", href: contact.github }],
  email: contact.email,
};

export const meta = {
  studio: "AYUSH",
  location: "Remote",
  year: new Date().getFullYear(),
};

/** Canonical contact target — mailto when an address exists, else GitHub. */
export const contactHref = contact.email
  ? `mailto:${contact.email}`
  : contact.github;

/* ==========================================================================
 *  ACCOUNT LAYER
 * ========================================================================== */

/**
 * Emails allowed into the admin dashboard.
 *
 * The dashboard additionally accepts any signed-in user whose Clerk
 * `publicMetadata.role` is "admin" — set that in the Clerk dashboard if you
 * would rather not hardcode addresses here. These are not secrets: the real
 * gate is the Clerk session plus this allow-list check.
 *
 * IMPORTANT: add your own sign-in email below, otherwise nobody can open the
 * dashboard.
 */
export const adminAllowlist: string[] = [];

/** Shown on the admin gate when the allow-list is still empty. */
export const adminSetupHint =
  "Add your sign-in email to adminAllowlist in src/data/content.ts (or set publicMetadata.role = \"admin\" in Clerk) to unlock this dashboard.";

export const routes = {
  /** Hash route for the dashboard — works on any static host. */
  admin: "/admin",
} as const;
