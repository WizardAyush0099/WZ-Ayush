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
  /** Main hero figure — transparent cut-out, bottom-centred. */
  heroFigure: `${base}assets/hero-figure.svg`,
  /** Large blurred silhouette behind the figure. */
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
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "gallery", label: "Gallery" },
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
  // Edit these three to whatever facts you want to lead with.
  stats: [
    { value: "01", label: "Featured Project" },
    { value: "React", label: "Primary Stack" },
    { value: "2026", label: "Portfolio" },
  ],
  image: `${base}assets/featured/02.svg`,
};

export type Project = {
  index: string;
  title: string;
  accent: string;
  category: string;
  description: string;
  image: string;
  /** When set, clicking the row opens this link instead of the image viewer. */
  href?: string;
};

/**
 * Featured work. Each array entry renders as one large row (number, title,
 * category, description). Add `href` to make the row open a live site/repo
 * instead of the image viewer.
 *
 * The entries after Study Hub are derived from the projects in the GitHub
 * account — rewrite these descriptions so they say what the work actually does.
 */
export const projects: Project[] = [
  {
    index: "01",
    title: "Study Hub",
    accent: "Focus",
    category: "Web App",
    description:
      "A study workspace that brings notes, resources and revision into one place — built to cut the friction out of focused learning.",
    image: `${base}assets/featured/02.svg`,
  },
  {
    index: "02",
    title: "Wizard XO",
    accent: "Play",
    category: "Web Game",
    description: "A browser tic-tac-toe build with a fast, clean round loop and instant rematches.",
    image: `${base}assets/featured/01.svg`,
    href: "https://github.com/WizardAyush0099/Wizard-XO-",
  },
  {
    index: "03",
    title: "Truth or Dare",
    accent: "Social",
    category: "Web Game",
    description: "A party game for groups — open it, pass the device round and play.",
    image: `${base}assets/featured/03.svg`,
    href: "https://github.com/WizardAyush0099/Truth-or-Dare-Game",
  },
  {
    index: "04",
    title: "Anime Watcher",
    accent: "Discover",
    category: "Web App",
    description: "A discovery app for finding and keeping track of what to watch next.",
    image: `${base}assets/featured/04.svg`,
    href: "https://github.com/WizardAyush0099/Anime-Watcher",
  },
  {
    index: "05",
    title: "Wizard Web",
    accent: "Archive",
    category: "Web Project",
    description: "An earlier web build, kept as part of the archive.",
    image: `${base}assets/horizontal/04.svg`,
    href: "https://github.com/WizardAyush0099/Wizard-Web",
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

export const about = {
  eyebrow: "02 — About",
  title: "Behind the Work",
  accent: "AY",
  body: [
    "I design and build dark, motion-led web experiences where atmosphere carries the story. Every scroll and transition is deliberate — restraint over spectacle.",
    "This portfolio is itself a build: a cinematic, interaction-heavy site engineered to stay smooth even on a mid-range phone.",
  ],
  facts: [
    { label: "Focus", value: "Web Applications" },
    { label: "Stack", value: "React · TypeScript" },
    { label: "Based", value: "Remote" },
  ],
};

export const cta = {
  eyebrow: "03 — Contact",
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
    { title: "Explore", links: ["Home", "About", "Work", "Gallery"] },
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
