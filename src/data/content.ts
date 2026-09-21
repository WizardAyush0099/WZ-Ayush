/**
 * ============================================================================
 *  SITE CONTENT — single source of truth
 * ============================================================================
 *  Everything editable lives here: copy, nav, projects, gallery and the
 *  asset paths. To swap artwork, see public/assets/README.md and update the
 *  `assets` map below — no component changes required.
 * ============================================================================
 */

export const assets = {
  /** Main hero figure — transparent cut-out, bottom-centred. */
  itachiMain: "/assets/itachi-main.svg",
  /** Large blurred silhouette behind the figure. */
  itachiShadow: "/assets/itachi-shadow.svg",
  /** Wide atmospheric backdrop. */
  background: "/assets/background.svg",
  /** About section portrait. */
  portrait: "/assets/portrait.svg",
  /** Final CTA backdrop. */
  cta: "/assets/cta.svg",
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
  title: "ITACHI",
  kanji: "うちは",
  tagline: "The Art of Silence",
  traits: "Discipline • Sacrifice • Shadow",
  scrollHint: "Scroll to explore",
};

export const story = {
  eyebrow: "Chapter I",
  title: "Beyond the Shadow",
  kanji: "静けさ",
  body: [
    "Some stories are not spoken — they are endured. A life measured not in victories, but in the quiet weight of every choice made in the dark.",
    "This is a study of restraint: of power held back, of kindness disguised as distance, and of a legacy written in silence rather than glory.",
  ],
  stats: [
    { value: "12", label: "Years of Shadow" },
    { value: "∞", label: "Unspoken Words" },
    { value: "01", label: "Path Chosen" },
  ],
  image: "/assets/featured/02.svg",
};

export type Project = {
  index: string;
  title: string;
  kanji: string;
  category: string;
  description: string;
  image: string;
};

export const projects: Project[] = [
  {
    index: "01",
    title: "The Shinobi",
    kanji: "忍",
    category: "Character Study",
    description:
      "A blade honed in silence. Movement stripped to its essence — the discipline beneath the myth.",
    image: "/assets/featured/01.svg",
  },
  {
    index: "02",
    title: "The Uchiha",
    kanji: "写輪眼",
    category: "Visual Identity",
    description:
      "The eye that remembers everything. Legacy as inheritance, and inheritance as a weight carried alone.",
    image: "/assets/featured/02.svg",
  },
  {
    index: "03",
    title: "The Akatsuki",
    kanji: "暁",
    category: "World Building",
    description:
      "Red clouds on black cloth. A brotherhood of exiles bound by a purpose no one is allowed to name.",
    image: "/assets/featured/03.svg",
  },
  {
    index: "04",
    title: "The Legacy",
    kanji: "遺志",
    category: "Narrative",
    description:
      "What remains when the mask falls. Truth passed on to the one person willing to see it clearly.",
    image: "/assets/featured/04.svg",
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
  { src: "/assets/gallery/01.svg", alt: "Crimson moon rising over a ridge", caption: "Moonrise", span: "tall", rotate: -1.4 },
  { src: "/assets/horizontal/02.svg", alt: "Crows scattering through smoke", caption: "Murmuration", span: "wide", rotate: 1.1 },
  { src: "/assets/gallery/03.svg", alt: "A dead forest in low red light", caption: "Deadwood", span: "square", rotate: -0.8 },
  { src: "/assets/gallery/04.svg", alt: "Embers drifting upward in darkness", caption: "Embers", span: "wide", rotate: 1.6 },
  { src: "/assets/gallery/05.svg", alt: "Rain falling through a dark frame", caption: "Rainfall", span: "tall", rotate: 0.9 },
  { src: "/assets/gallery/06.svg", alt: "A lone figure on a cliff edge", caption: "Vantage", span: "square", rotate: -1.2 },
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
  { src: "/assets/horizontal/01.svg", alt: "Sharingan rings glowing in the dark", index: "I", title: "Perception", scale: "lg" },
  { src: "/assets/horizontal/02.svg", alt: "Crows drifting through red mist", index: "II", title: "Flight", scale: "md" },
  { src: "/assets/horizontal/03.svg", alt: "A torii gate at night", index: "III", title: "Gate", scale: "sm" },
  { src: "/assets/horizontal/04.svg", alt: "A cloaked figure lit from behind", index: "IV", title: "Cloak", scale: "lg" },
  { src: "/assets/horizontal/05.svg", alt: "Feathers dissolving into shadow", index: "V", title: "Feather", scale: "md" },
];

export const about = {
  eyebrow: "Chapter II",
  title: "The Mind Behind the Shadow",
  kanji: "影",
  body: [
    "I build dark, motion-led experiences where atmosphere carries the story. Every scroll, every transition is deliberate — restraint over spectacle.",
    "This piece is a tribute: an interactive film sequence disguised as a website, engineered to stay smooth even on a mid-range phone.",
  ],
  facts: [
    { label: "Craft", value: "Motion & Interaction" },
    { label: "Stack", value: "React · GSAP · WebGL" },
    { label: "Focus", value: "Cinematic Narrative" },
  ],
};

export const cta = {
  eyebrow: "Chapter III",
  title: "Enter the Shadow",
  kanji: "闇",
  body: "The work speaks for itself — step inside and let it unfold.",
  action: "Start a Project",
};

export const footer = {
  tagline: "The Art of Silence",
  columns: [
    { title: "Explore", links: ["Home", "About", "Work", "Gallery"] },
    { title: "Connect", links: ["Contact", "Newsletter", "Press"] },
  ],
  social: [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "X", href: "https://x.com" },
    { label: "Behance", href: "https://behance.net" },
    { label: "GitHub", href: "https://github.com" },
  ],
  email: "shadow@itachi.studio",
};

export const meta = {
  studio: "SHADOW STUDIO",
  location: "Konoha · Remote",
  year: new Date().getFullYear(),
};
