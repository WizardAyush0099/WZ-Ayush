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

import type { ThemeId } from "../lib/theme";

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
  { id: "work", label: "Work" },
  { id: "templates", label: "Templates" },
  { id: "order", label: "Order" },
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
    "I design and engineer dark, motion-led websites — and I build them for businesses too. Pick a template below, send a brief, and I'll take it from there.",
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
  eyebrow: "05 — About",
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
  eyebrow: "06 — Contact",
  title: "Let's Work Together",
  accent: "WZ",
  body: "Have a project in mind? Pick a template, send the brief, and I'll reply within one working day.",
  action: "Start Your Order",
};

/**
 * Contact details.
 * `email` is intentionally empty — set it and the CTA + footer will use a
 * mailto link automatically; until then they point at GitHub.
 */
export const contact = {
  email: "",
  github: "https://github.com/WizardAyush0099",
  /**
   * WhatsApp number for commission enquiries — country code + number, digits
   * only (no +, spaces or dashes). Replace the placeholder below with your
   * real number. You can also set VITE_WHATSAPP_NUMBER in the environment,
   * which takes priority and keeps the number out of the source.
   */
  whatsapp: "919999999999",
};

export const footer = {
  tagline: "Portfolio",
  columns: [
    { title: "Explore", links: ["Home", "Work", "Templates", "Order"] },
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
 *  TEMPLATES  —  starter designs visitors can preview and order
 * ========================================================================== */

/**
 * The miniature layout each template preview renders. `TemplatePreview`
 * switches on this value, so adding a template is a data change plus (at
 * most) one new preview branch.
 */
export type TemplateKind = "hotel" | "restaurant" | "salon" | "store" | "gym" | "studio";

export type SiteTemplate = {
  id: string;
  /** Business-style name shown inside the preview. */
  name: string;
  domain: string;
  kind: TemplateKind;
  category: string;
  blurb: string;
  /** Palette applied live when this template is picked. */
  theme: ThemeId;
  /** Standout things the build includes. */
  features: string[];
  startingAt: string;
};

export const templatesSection = {
  eyebrow: "03 — Templates",
  title: "Start From a Template",
  lede:
    "Pick the closest starting point and the whole site repaints in that palette so you can feel it, not imagine it. Every template is a real, responsive build — not a screenshot.",
  note: "Tap a palette below to preview any theme on this very site.",
};

export const templates: SiteTemplate[] = [
  {
    id: "hotel",
    name: "Azure Bay",
    domain: "azurebay.com",
    kind: "hotel",
    category: "Hotel · Resort",
    blurb:
      "Room showcase, availability enquiry, amenities and a booking call — built to convert lookers into reservations.",
    theme: "amber",
    features: ["Rooms & suites", "Availability form", "Amenities", "Location map"],
    startingAt: "₹18,000",
  },
  {
    id: "restaurant",
    name: "Saveur",
    domain: "saveur.in",
    kind: "restaurant",
    category: "Restaurant · Café",
    blurb:
      "Menu, gallery and reservations with a table booking flow and delivery links — the details diners actually look for.",
    theme: "crimson",
    features: ["Digital menu", "Table booking", "Gallery", "Delivery links"],
    startingAt: "₹15,000",
  },
  {
    id: "salon",
    name: "Lumière",
    domain: "lumierestudio.com",
    kind: "salon",
    category: "Salon · Spa",
    blurb:
      "Service menu with pricing, an appointment request form and a stylist showcase that sells the experience.",
    theme: "plum",
    features: ["Service & price list", "Appointment form", "Stylist profiles", "Instagram feed"],
    startingAt: "₹14,000",
  },
  {
    id: "store",
    name: "North & Co",
    domain: "northandco.shop",
    kind: "store",
    category: "Online Store",
    blurb:
      "Product catalogue, cart and checkout with payments wired in — from browsing to a paid order without leaving the site.",
    theme: "ocean",
    features: ["Product catalogue", "Cart & checkout", "Payments", "Order updates"],
    startingAt: "₹25,000",
  },
  {
    id: "gym",
    name: "Iron & Ember",
    domain: "ironember.fit",
    kind: "gym",
    category: "Gym · Fitness",
    blurb:
      "Membership plans, class timetable and trainer profiles with a trial-signup form that fills your books.",
    theme: "graphite",
    features: ["Membership plans", "Class timetable", "Trainer profiles", "Free-trial form"],
    startingAt: "₹16,000",
  },
  {
    id: "studio",
    name: "Atelier",
    domain: "atelier.work",
    kind: "studio",
    category: "Portfolio · Agency",
    blurb:
      "Case studies, an about that builds trust and an enquiry path for clients — the shape this very site is built on.",
    theme: "verdant",
    features: ["Case studies", "About & team", "Client enquiry", "Blog / Journal"],
    startingAt: "₹20,000",
  },
];

export function templateById(id: string): SiteTemplate | undefined {
  return templates.find((t) => t.id === id);
}

/* ==========================================================================
 *  ORDER  —  the commission request form
 * ========================================================================== */

export const order = {
  eyebrow: "04 — Commissions",
  title: "Order Your Website",
  lede:
    "Tell me what you want — and just as importantly what you don't. The more specific you are, the closer the first draft lands. Nothing is charged here; this starts the conversation.",
  steps: [
    { key: "01", title: "Pick a template", body: "Choose the closest starting point above, or describe your own in the notes." },
    { key: "02", title: "Send the brief", body: "Fill the form with your pages, budget, timeline and the things you want to avoid." },
    { key: "03", title: "Talk it through", body: "I reply within one working day — on WhatsApp or email, whichever you prefer." },
  ],
  /** Multi-select chips in the form. */
  pageOptions: [
    "Home",
    "About",
    "Services / Menu",
    "Gallery",
    "Booking / Enquiry",
    "Blog",
    "Shop + Payments",
    "Contact & Map",
  ],
  budgets: [
    "Under ₹10,000",
    "₹10,000 – ₹25,000",
    "₹25,000 – ₹50,000",
    "₹50,000 – ₹1,00,000",
    "₹1,00,000+",
    "Not sure yet",
  ],
  timelines: ["ASAP (1–2 weeks)", "This month", "1–2 months", "Flexible"],
  footnote:
    "Your details are used only to reply to this enquiry. No spam, no mailing list.",
};

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
