/**
 * ============================================================================
 *  SITE CONTENT — single source of truth
 * ============================================================================
 *  Everything editable lives here: identity, contact, nav, projects, gallery
 *  and the builder questionnaire. The six website templates are in
 *  `src/data/templates.ts` because each one points at a full HTML site.
 *
 *  Asset paths are prefixed with `import.meta.env.BASE_URL`, so the same build
 *  works at the domain root (Vercel), under a sub-path (GitHub Pages project
 *  site: /WZ-Ayush/) and inside the preview.
 *
 *  Admin-editable overrides (artwork paths, cinematic scroll media, project
 *  cards, and the section-wise image slots) live in src/lib/siteData.ts and
 *  layer on top of the defaults below and in src/data/imageSlots.ts.
 * ============================================================================
 */

const base = import.meta.env.BASE_URL;

/* ==========================================================================
 *  OWNER + STUDIO IDENTITY
 * ========================================================================== */

export const meta = {
  studio: "AYUSH",
  owner: "Ayush Danthta",
  role: "Designer & Developer",
  location: "India · Remote",
  year: new Date().getFullYear(),
} as const;

/**
 * Contact details — the real, verified values.
 *
 * `whatsapp` is digits only (country code + number) because that is the shape
 * https://wa.me/<number> requires. Setting `VITE_WHATSAPP_NUMBER` in the
 * environment overrides it without touching source.
 */
export const contact = {
  email: "ayushdanthta@gmail.com",
  whatsapp: "918353011030",
  whatsappDisplay: "+91 83530 11030",
  github: "https://github.com/WizardAyush0099",
  vercel: "https://wzayush.vercel.app/",
  githubPages: "https://wizardayush0099.github.io/WZ-Ayush/",
} as const;

/** Canonical contact target for generic "get in touch" links. */
export const contactHref = `mailto:${contact.email}`;

/* ==========================================================================
 *  ASSETS
 * ========================================================================== */

export type AssetKey = "heroShadow" | "background" | "portrait" | "cta";

/** Default artwork paths. The dashboard can override each one. */
export const assetDefaults: Record<AssetKey, string> = {
  heroShadow: `${base}assets/hero-shadow.svg`,
  background: `${base}assets/background.svg`,
  portrait: `${base}assets/portrait.svg`,
  cta: `${base}assets/cta.svg`,
};

export const assetLabels: Record<AssetKey, string> = {
  heroShadow: "Hero silhouette",
  background: "Atmospheric backdrop",
  portrait: "About portrait",
  cta: "Final CTA backdrop",
};

/* ==========================================================================
 *  CINEMATIC SCROLL MEDIA
 * ==========================================================================
 *  The hero's centrepiece can be a rendered image sequence, a looping video,
 *  or the procedural WebGL scene (the default fallback). A ZIP is NOT playable
 *  in a browser — see docs/ASSET_WORKFLOW.md for the two supported formats.
 */

export type ScrollMediaMode = "scene" | "video" | "sequence";

export type MediaConfig = {
  mode: ScrollMediaMode;
  /** Public path/URL to an .mp4 or .webm (mode: "video"). */
  videoSrc: string;
  /** Public folder holding 000.webp, 001.webp … (mode: "sequence"). */
  frameDir: string;
  /** How many frames exist in `frameDir`. */
  frameCount: number;
  /** Frame file extension, without the dot. */
  frameExt: "webp" | "avif" | "jpg" | "png";
  /** Standalone poster shown before the media loads, and if it fails. */
  poster: string;
  /** Scroll distance the scrub is spread across, e.g. "180vh". */
  scrollLength: string;
  /** Free-text reminder of where the source render came from. */
  sourceNote: string;
};

/**
 * The hero's default centrepiece is the cinematic render supplied in
 * `scene1.zip` + `scene2.zip`: 413 sequential frames merged into one run and
 * extracted to `public/assets/hero-sequence/` as `000.jpg` … `420.jpg` — both
 * archives' own `ezgif-frame-NNN.jpg` order, scene 1 then scene 2, renumbered
 * to the zero-based index the shared sequence loader (and the dashboard
 * preview) address frames by.
 *
 * The two archives are two separate takes rather than one continuous camera
 * move: measured frame-to-frame, their junction was ~43x a normal step — a
 * hard jump. Eight cross-dissolve frames (`209` … `216`) were rendered at the
 * seam to carry one into the other. Every original frame is untouched — same
 * 1920x1080, byte-identical files, nothing resized or re-encoded.
 */
export const heroSequenceDir = `${base}assets/hero-sequence`;
export const heroSequenceFrames = 421;

export const mediaDefaults: MediaConfig = {
  mode: "sequence",
  videoSrc: "",
  frameDir: heroSequenceDir,
  frameCount: heroSequenceFrames,
  frameExt: "jpg",
  // The opening frame doubles as the poster, so the stage is never blank
  // while the rest of the run loads.
  poster: `${heroSequenceDir}/000.jpg`,
  // Roughly 4.8 screens of travel across the run. Widened from 360vh so the
  // camera move reads slowly — each scroll tick advances the film by less, so
  // the sequence plays out over a longer, calmer stretch of scrolling while
  // still covering every frame before the pin releases.
  scrollLength: "480vh",
  sourceNote: "scene1.zip + scene2.zip — 421-frame merged render",
};

/*
 * The Archive's own 240-frame run used to live here — 240 stills of a sharingan
 * render that shipped as an archive at the repository root — and the six grid
 * tiles each played a passage of it. Both are gone: at tile size the render read
 * as a dark smudge, and the archive was never anything but clutter, so it has
 * been deleted from the repository. The tiles start empty and wait for the
 * owner's own pictures (imageSlotDefaults → the `archive` section). A sharingan
 * survives only as the small vector mark in the theme control and in the
 * Archive's statement — see `SharinganMark`.
 */

export const mediaLabels: Record<ScrollMediaMode, string> = {
  scene: "Procedural 3D scene (works with zero setup)",
  video: "Looping video — MP4 or WebM",
  sequence: "Image sequence scrubbed by scroll",
};

/* ==========================================================================
 *  NAVIGATION
 * ========================================================================== */

/** `id` scrolls to a section on the homepage; `route` opens another page. */
export type NavItem = { label: string; id?: string; route?: string };

export const nav: NavItem[] = [
  { label: "Home", id: "home" },
  { label: "Studio", id: "story" },
  // The six templates, as the pinned shelf — now the first thing past Studio.
  { label: "Templates", id: "templates" },
  // The Archive itself: the sequence frame and the stills.
  { label: "Archive", id: "gallery" },
  // The deployments, in their own section below the Archive.
  { label: "Projects", id: "projects" },
  { label: "Contact", id: "contact" },
];

export const routes = {
  home: "/",
  admin: "/admin",
  builder: "/builder",
} as const;

/* ==========================================================================
 *  HERO
 * ========================================================================== */

export const hero = {
  title: "AYUSH",
  accent: "WZ",
  tagline: "Designing digital experiences that feel impossible to ignore.",
  traits: "Designer • Developer • Motion",
  scrollHint: "Scroll to explore",
  lede:
    "I design and build modern websites and digital experiences — cinematic, fast, and made for real businesses. See the work, or start a project and tell me what you need.",
  primaryCta: "Start a Project",
  secondaryCta: "Explore My Work",
} as const;

/* ==========================================================================
 *  APPROACH
 * ========================================================================== */

export const story = {
  eyebrow: "01 — Approach",
  title: "How I Work",
  accent: "WZ",
  body: [
    "I build focused digital products with an emphasis on motion, clarity and craft — interfaces that feel considered rather than decorated.",
    "Every project starts with the problem, not the pixels. What follows is iteration, restraint, and a lot of small details that add up.",
  ],
  stats: [
    { value: "04", label: "Live Products" },
    { value: "06", label: "Ready Templates" },
    { value: "3D", label: "Real-time Web" },
  ],
  /**
   * No picture by default, deliberately: this band sits directly under the
   * hero, and a second dark render there read as two openings in a row. The
   * frame beside the copy is Studio slot 01 in #/admin → Images — give it a
   * path (or a scroll film) and it renders at the size and crop you set; while
   * it is empty, the copy takes the full width (see `StorySection`).
   */
  image: "",
};

/* ==========================================================================
 *  STATEMENT — the kinetic band
 *  Rendered by src/components/sections/StatementBand: the line is split into
 *  words and revealed word by word as the band crosses the screen (the scroll
 *  position is the playhead, so scrolling back up rewinds it), with the ticker
 *  running underneath. Short, declarative and true — nothing about clients,
 *  awards or numbers that are not already on this page.
 * ========================================================================== */

export const statement = {
  eyebrow: "02 — Statement",
  line:
    "Motion is not decoration. It is how a website tells you, in the first two seconds, that it was made by someone who cares.",
  attribution: "Ayush Danthta — WZ Studio",
  note: "No template shop, no effects rented: every band on this page is motion written for it.",
  /** The ticker under the line. Short entries only — it never stops moving. */
  ticker: [
    "Cinematic scroll",
    "Hand-built motion",
    "React & TypeScript",
    "Real-time 3D",
    "Sub-second loads",
    "Design systems",
    "WhatsApp-first",
    "Content you own",
    "Built to be remembered",
  ],
} as const;

/* ==========================================================================
 *  LIVE PROJECTS — the verified deployments
 *  Rendered once, inside The Archive (src/components/sections/GallerySection).
 * ========================================================================== */

export type Project = {
  /** Stable id — the admin dashboard edits projects by this key. */
  id: string;
  index: string;
  title: string;
  accent: string;
  category: string;
  description: string;
  image: string;
  highlights: string[];
  stack: string[];
  /** Verified public URL. These are real deployments — do not invent others. */
  href?: string;
  /** Shown as "Live" only for URLs that are actually deployed. */
  live: boolean;
  /** Parent project, used to show the Study Hub hierarchy. */
  parent?: string;
  /**
   * Other live pages belonging to this project. They render as quick links
   * on the project's Archive card — "Visit" opens the project itself, these
   * open its sibling pages.
   */
  pages?: { label: string; href: string }[];
  /** Whether the project appears in The Archive on the homepage. */
  showInArchive: boolean;
};

/**
 * The four live pages, with the exact URLs verified for this project.
 * Study Hub is the parent; the other three are its flagship pages. The
 * Archive shows the three the owner asked for — the E-books Store lives on
 * Study Hub's card as one of its pages, so nothing is listed twice.
 */
export const projects: Project[] = [
  {
    id: "study-hub",
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
    stack: ["React", "TypeScript", "Vite"],
    href: "https://study-hub-kappa.vercel.app/",
    live: true,
    // The project's sibling pages — kept as quick links on its card so the
    // E-books Store stays reachable without being a card of its own.
    pages: [
      { label: "Guitar Theory Lab", href: "https://study-hub-kappa.vercel.app/index.guitar-theory" },
      { label: "FitLife Blueprint", href: "https://study-hub-kappa.vercel.app/index.health" },
      { label: "E-books Store", href: "https://study-hub-kappa.vercel.app/index.e-books" },
    ],
    showInArchive: true,
  },
  {
    id: "guitar-theory",
    index: "02",
    title: "Guitar Theory Lab",
    accent: "Craft",
    category: "Study Hub · Flagship Page",
    description:
      "An interactive fretboard that makes music theory visible — scales, intervals and chords light up in place so the pattern is understood, not memorised.",
    image: `${base}assets/featured/03-guitar-lab.svg`,
    highlights: [
      "Live fretboard that highlights scales and intervals",
      "Chord and mode explorer with instant audio feedback",
      "Theory explained visually, in the order you play it",
    ],
    stack: ["React", "Web Audio", "SVG"],
    href: "https://study-hub-kappa.vercel.app/index.guitar-theory",
    live: true,
    parent: "Study Hub",
    showInArchive: true,
  },
  {
    id: "fitlife",
    index: "03",
    title: "FitLife Blueprint",
    accent: "Discipline",
    category: "Study Hub · Flagship Page",
    description:
      "A training and nutrition blueprint page that turns vague fitness intentions into a concrete, trackable plan — macros, phases and progress in one screen.",
    image: `${base}assets/featured/02-fitlife.svg`,
    highlights: [
      "Structured training phases with progress tracking",
      "Nutrition targets that adapt to your goal",
      "Motion-led onboarding that explains itself",
    ],
    stack: ["React", "GSAP", "Charts"],
    href: "https://study-hub-kappa.vercel.app/index.health",
    live: true,
    parent: "Study Hub",
    showInArchive: true,
  },
  {
    id: "ebook-store",
    index: "04",
    title: "E-books Store",
    accent: "Commerce",
    category: "Study Hub · Flagship Page",
    description:
      "A dark, editorial storefront for digital books — cinematic covers, instant previews and a checkout flow that gets out of the way.",
    image: `${base}assets/featured/04-ebook-store.svg`,
    highlights: [
      "Editorial storefront that puts the writing first",
      "Sample reader with instant page previews",
      "Frictionless purchase and library delivery",
    ],
    stack: ["React", "Commerce", "Storage"],
    href: "https://study-hub-kappa.vercel.app/index.e-books",
    live: true,
    parent: "Study Hub",
    // Reachable from Study Hub's card — the Archive lists it only once, as a
    // page of the parent rather than a fourth card.
    showInArchive: false,
  },
];

export const archiveSection = {
  eyebrow: "Gallery",
  title: "The Archive",
  lede:
    "The frames — the work, and the pieces I keep coming back to. Open any one of them full-screen.",
  /** Copy beside the mark. Short and in the display face: see the section. */
  sequenceLabel: "In motion",
  sequenceTitle: "The work, in motion.",
  sequenceBody:
    "The mark turns the way you scroll — down and it winds one way, back up and it unwinds. The frames below are the work itself.",
  framesLabel: "Archive frames",
  stillsLabel: "More stills",
  framesNote: "Select any still to open it full-screen.",
} as const;

/* ==========================================================================
 *  LIVE PROJECTS — the verified deployments
 *  Rendered once, in their own section (src/components/sections/LiveProjects),
 *  directly below The Archive.
 * ========================================================================== */

export const liveProjectsSection = {
  eyebrow: "Live on the web",
  title: "Live Projects",
  lede:
    "The sites I've built and actually shipped — live on the web right now. Open any of them and use it, rather than looking at a screenshot of it.",
  projectsLabel: "Live projects",
  visitLabel: "Visit live site",
  note: "Live on the web",
} as const;

/* ==========================================================================
 *  ARCHIVE — gallery stills
 * ========================================================================== */

/**
 * The three stills supplied in the repo's `Archive Images` folder, optimised to
 * WebP and shipped in `public/assets/archive/`. They fill the three bigger
 * frames under the sequence frame.
 */
export type ArchiveImage = {
  src: string;
  alt: string;
  caption: string;
  /** Small category line under the caption. */
  kind: string;
};

export const archiveImages: ArchiveImage[] = [
  {
    src: `${base}assets/archive/3d-website.webp`,
    alt: "A three-dimensional website interface",
    caption: "3D Website",
    kind: "Web · Motion",
  },
  {
    src: `${base}assets/archive/business.webp`,
    alt: "A business website layout",
    caption: "Business Site",
    kind: "Web · Corporate",
  },
  {
    src: `${base}assets/archive/food.webp`,
    alt: "A food and drink website layout",
    caption: "Food & Drink",
    kind: "Web · Hospitality",
  },
];

/*
 * The six `assets/gallery/*.svg` + `assets/horizontal/*.svg` placeholder
 * vectors that used to fill the Archive's grid are gone from the code, and so
 * is the scroll film that briefly replaced them. Those six frames are now
 * empty image slots, defined in `imageSlotDefaults` (src/data/imageSlots.ts)
 * and filled from #/admin → Images.
 */

/* ==========================================================================
 *  CAPABILITY + ABOUT
 * ========================================================================== */

export const capabilities = {
  eyebrow: "04 — Capability",
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
} as const;

export const about = {
  eyebrow: "05 — About",
  title: "Behind the Work",
  accent: "AD",
  body: [
    "I'm Ayush — I design and build websites and digital experiences where atmosphere carries the story. Every scroll and transition is deliberate: restraint over spectacle.",
    "That ranges from product work like Study Hub to single-purpose sites for restaurants, hotels and studios. If it needs to look expensive and load fast, that's the brief I like.",
  ],
  facts: [
    { label: "Focus", value: "Web Products" },
    { label: "Stack", value: "React · TypeScript" },
    { label: "Based", value: "India · Remote" },
  ],
} as const;

/* ==========================================================================
 *  THE BRIEF BAND — the pointer from the page to the commission flow
 * ==========================================================================
 *  The six templates live on the homepage as the pinned shelf. This band is
 *  the bridge to /#/builder, where a choice becomes a brief — so "how do I get
 *  one?" has an answer on the page people actually land on.
 * ========================================================================== */

export const themesCta = {
  eyebrow: "The Brief",
  title: "Six Starting Points, One Brief",
  body:
    "Every template on this page is a complete site you can open full size — pick the closest, then tell me what to build from it. Nothing here is charged, and the brief takes a few minutes.",
  action: "Start Building",
} as const;

/* ==========================================================================
 *  COMMISSIONS — the brief, on the homepage and in the builder
 * ========================================================================== */

export const order = {
  eyebrow: "06 — Commissions",
  title: "Order Your Website",
  lede:
    "Tell me what you want — and just as importantly what you don't. The more specific you are, the closer the first draft lands. Nothing is charged here; this starts the conversation.",
  steps: [
    {
      key: "01",
      title: "Pick a template",
      body: "Pick the closest of the six in the templates section, or in step 3 of the brief below. It repaints this page in its palette first, so you can see it before you commit.",
    },
    {
      key: "02",
      title: "Send the brief",
      body: "Eight short steps: the pages you need, the features, your budget and timeline — and the things you want to avoid.",
    },
    {
      key: "03",
      title: "Talk it through",
      body: "I reply within one working day, on WhatsApp or email, whichever you prefer.",
    },
  ],
} as const;

/* ==========================================================================
 *  CONTACT / FINAL CTA
 * ========================================================================== */

export const cta = {
  eyebrow: "07 — Contact",
  title: "Let's Build It",
  accent: "AD",
  body:
    "Have a project in mind? Tell me what you need — or message me directly and we can start today. I reply within one working day.",
  primaryAction: "Start a Project",
  secondaryAction: "Chat on WhatsApp",
} as const;

export const footer = {
  tagline: "Designer & developer — India",
  social: [
    { label: "GitHub", href: contact.github },
    { label: "Vercel", href: contact.vercel },
  ],
};

/* ==========================================================================
 *  BUILDER — the commission request flow (route: /#/builder)
 * ========================================================================== */

export const builder = {
  eyebrow: "Start a Project",
  title: "Build My Website",
  lede:
    "Eight short steps, and I'll know exactly what you want. Nothing is charged here — this starts the conversation, and you can send the finished brief straight to WhatsApp.",
  steps: [
    { key: "01", title: "About you", hint: "Who you are and how to reach you." },
    { key: "02", title: "Website type", hint: "What kind of site this is." },
    { key: "03", title: "Template", hint: "The closest starting point." },
    { key: "04", title: "Theme", hint: "Light, dark, or one of the palettes." },
    { key: "05", title: "Features", hint: "Everything the site must do." },
    { key: "06", title: "Custom requirements", hint: "What you want — and what you don't." },
    { key: "07", title: "References", hint: "Sites you like, for direction." },
    { key: "08", title: "Project details", hint: "Goals, audience, content, timeline." },
  ],
  websiteTypes: [
    "Portfolio",
    "Business website",
    "Landing page",
    "E-commerce",
    "Blog / Magazine",
    "Education",
    "Personal brand",
    "Restaurant / Café",
    "Fitness",
    "Agency",
    "SaaS",
    "Event",
    "Hotel / Resort",
    "Salon / Spa",
    "Photography",
    "Music",
    "Gaming",
    "Other",
  ],
  /**
   * Conditional follow-ups. These only appear when the visitor picks the
   * matching website type, so the form never asks an irrelevant question.
   */
  conditional: {
    "E-commerce": [
      { key: "products", label: "How many products?" },
      { key: "payments", label: "Which payment method? (UPI, cards, Razorpay…)" },
      { key: "shipping", label: "Do you need shipping and delivery tracking?" },
      { key: "accounts", label: "Should customers have accounts?" },
    ],
    "Restaurant / Café": [
      { key: "menu", label: "Do you need a full menu with prices?" },
      { key: "reservations", label: "Table reservations online?" },
      { key: "hours", label: "Opening hours and location to show?" },
      { key: "delivery", label: "Swiggy / Zomato / delivery links?" },
    ],
    "Hotel / Resort": [
      { key: "rooms", label: "How many room types?" },
      { key: "booking", label: "Booking enquiry or live availability?" },
      { key: "amenities", label: "Amenities and facilities to list?" },
      { key: "location", label: "Should I add a map and directions?" },
    ],
    Portfolio: [
      { key: "projects", label: "How many projects do you want to show?" },
      { key: "bio", label: "Do you have a written bio?" },
      { key: "socials", label: "Which social links should be included?" },
    ],
    "Landing page": [
      { key: "goal", label: "What is the one action a visitor should take?" },
      { key: "campaign", label: "Is this for a campaign or a product launch?" },
      { key: "ads", label: "Will you drive paid traffic to it?" },
    ],
    SaaS: [
      { key: "plans", label: "How many pricing plans?" },
      { key: "accounts", label: "Do users need to sign up?" },
      { key: "docs", label: "Do you need documentation pages?" },
    ],
    "Salon / Spa": [
      { key: "services", label: "How many services and price points?" },
      { key: "booking", label: "Appointment booking online?" },
      { key: "staff", label: "Should stylists have their own profiles?" },
    ],
    Fitness: [
      { key: "plans", label: "Membership plans and pricing?" },
      { key: "classes", label: "Class timetable to display?" },
      { key: "trainers", label: "Trainer profiles?" },
    ],
    Event: [
      { key: "agenda", label: "Full agenda or a single day?" },
      { key: "tickets", label: "Do you need ticketing?" },
      { key: "speakers", label: "How many speakers?" },
    ],
    "Blog / Magazine": [
      { key: "cadence", label: "How often will you publish?" },
      { key: "authors", label: "Multiple authors or just you?" },
      { key: "newsletter", label: "Newsletter signup needed?" },
    ],
    Photography: [
      { key: "albums", label: "How many albums or collections?" },
      { key: "prints", label: "Do you sell prints?" },
      { key: "booking", label: "Do you take bookings through the site?" },
    ],
    Music: [
      { key: "releases", label: "How many releases to show?" },
      { key: "tour", label: "Do you need tour dates?" },
      { key: "mailing", label: "Mailing list signup?" },
    ],
    Gaming: [
      { key: "roster", label: "Roster and player profiles?" },
      { key: "tournaments", label: "Tournament results or fixtures?" },
      { key: "stream", label: "Live stream embed?" },
    ],
    Agency: [
      { key: "caseStudies", label: "How many case studies?" },
      { key: "team", label: "Team profiles needed?" },
      { key: "services", label: "Which services should be listed?" },
    ],
    "Business website": [
      { key: "services", label: "What services does the business offer?" },
      { key: "team", label: "Should the team be listed?" },
      { key: "map", label: "Do you need a map and directions?" },
    ],
    "Personal brand": [
      { key: "offerings", label: "What do you sell or offer?" },
      { key: "testimonials", label: "Do you have client testimonials?" },
      { key: "booking", label: "Should visitors be able to book you?" },
    ],
    Education: [
      { key: "courses", label: "How many courses or batches?" },
      { key: "fees", label: "Should fees be shown publicly?" },
      { key: "admissions", label: "Online admission enquiry?" },
    ],
  } as Record<string, { key: string; label: string }[]>,
  features: [
    "Contact form",
    "WhatsApp button",
    "Blog",
    "Gallery",
    "Animations",
    "3D elements",
    "Video",
    "Testimonials",
    "Pricing",
    "FAQ",
    "Login / signup",
    "Admin dashboard",
    "CMS",
    "E-commerce",
    "Payments",
    "Search",
    "Newsletter",
    "Google Maps",
    "Social media integration",
    "Custom animations",
    "Other",
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
  details: [
    { key: "goal", label: "What is the website for?", placeholder: "e.g. get more table bookings" },
    { key: "audience", label: "Who is the target audience?", placeholder: "e.g. families in Pune, 25–45" },
    { key: "pagesNeeded", label: "Which pages do you need?", placeholder: "e.g. Home, Menu, Gallery, Contact" },
  ],
  yesNo: [
    { key: "hasLogo", label: "Do you already have a logo?" },
    { key: "hasContent", label: "Do you have the text and photos ready?" },
    { key: "needsHosting", label: "Do you need hosting and domain help?" },
    { key: "needsUpdates", label: "Do you need ongoing updates after launch?" },
  ],
  footnote:
    "Your details are used only to reply to this enquiry. No spam, no mailing list.",
} as const;

/* ==========================================================================
 *  ADMIN
 * ========================================================================== */

/**
 * Emails allowed into the admin dashboard.
 *
 * These are not secrets — the real gate is the Clerk session plus this
 * allow-list check, and the shared backend refuses to return client data to
 * anyone without a valid Clerk session token from an allowed address. Set
 * `VITE_ADMIN_EMAILS` in the environment to add more without editing source.
 */
export const adminAllowlist: string[] = ["ayushdanthta@gmail.com"];

/** Shown on the admin gate when the allow-list is still empty. */
export const adminSetupHint =
  "Add your sign-in email to adminAllowlist in src/data/content.ts (or set publicMetadata.role = \"admin\" in Clerk) to unlock this dashboard.";
