/**
 * ============================================================================
 *  TEMPLATE LIBRARY — twenty genuinely different website designs
 * ============================================================================
 *  Each template is a *design*, not a palette swap. Three things make them
 *  distinct, and all three are data:
 *
 *    design   — the art direction: typeface, casing, corner radius, border
 *               weight, hard-offset shadows, background texture, and the
 *               template's own colour identity (independent of the site theme)
 *    sections — the actual page composition: which blocks appear, in what
 *               order, with what copy. A real-estate hero with a search panel
 *               and a neo-brutalist code card are different *layouts*.
 *    theme    — the site palette applied when a visitor selects this concept,
 *               so the live-scroll preview still demonstrates the theme system.
 *
 *  `TemplatePreview` renders these at a fixed 1100px design width and scales
 *  the result down, so a card reads like a screenshot of a real website
 *  rather than a diagram.
 * ============================================================================
 */

import type { ThemeId } from "../lib/theme";

/* ==========================================================================
 *  DESIGN TOKENS
 * ========================================================================== */

export type TemplateDesign = {
  /** Heading typeface. `serif` = Cinzel, `sans` = Inter, `mono` = system mono. */
  display: "serif" | "sans" | "mono";
  /** Headline casing. */
  case: "upper" | "lower" | "title";
  /** Headline letter-spacing in em — negative for tight editorial type. */
  tracking: number;
  /** Corner radius in px (0 for sharp, 999 for pills). */
  radius: number;
  /** Border weight in px. */
  border: number;
  /** Hard offset shadow, the neo-brutalist signature. */
  hard: boolean;
  /** Background texture behind the page. */
  texture: "none" | "grid" | "halftone" | "dots";
  /* --- the template's own colour identity --------------------------------- */
  page: string;
  panel: string;
  ink: string;
  muted: string;
  accent: string;
  onAccent: string;
  /** Optional hairline colour between sections. */
  line: string;
};

/* ==========================================================================
 *  SECTION VOCABULARY
 * ========================================================================== */

export type TemplateSection =
  | { kind: "nav"; style: "pill" | "bar" | "minimal" | "window"; links: string[]; cta?: string }
  | { kind: "heroSplit"; eyebrow: string; title: string; body: string; cta: string; secondary?: string }
  | { kind: "heroWordmark"; word: string; sub: string; cta: string; float: string }
  | { kind: "heroFullbleed"; chip: string; title: string; sub: string; cta: string }
  | { kind: "heroCentered"; eyebrow: string; title: string; sub: string; cta: string }
  | { kind: "heroCarousel"; title: string; sub: string; cta: string; filters: string[] }
  | { kind: "heroDome"; title?: string; sub?: string; cta?: string; shots?: number }
  | { kind: "heroTypeLed"; title: string; sub: string; meta: string[]; cta: string }
  | { kind: "marquee"; items: string[]; tone: "light" | "dark" | "accent" }
  | { kind: "statCards"; items: { value: string; label: string; note?: string }[] }
  | { kind: "statBar"; items: { value: string; label: string }[] }
  | { kind: "featureCards"; columns: 2 | 3 | 4; items: { title: string; body?: string }[] }
  | { kind: "imageTextSplit"; eyebrow: string; title: string; body: string; cta?: string; side: "left" | "right"; chips?: string[] }
  | { kind: "collectionDark"; title: string; body: string; items: { title: string; price: string }[]; cta: string }
  | { kind: "caseStudies"; title: string; items: { title: string; meta: string }[] }
  | { kind: "productGrid"; title: string; columns: 3 | 4; items: { title: string; price: string }[] }
  | { kind: "menuList"; title: string; note: string; items: { label: string; value: string }[] }
  | { kind: "pricing"; items: { title: string; price: string; note: string; featured?: boolean }[] }
  | { kind: "timeline"; items: { when: string; title: string; body: string }[] }
  | { kind: "windowCards"; items: { title: string; meta: string; body: string }[] }
  | { kind: "codeCard"; lines: { key: string; value: string }[] }
  | { kind: "iconRow"; items: string[] }
  | { kind: "logoStrip"; items: string[] }
  | { kind: "bookingBar"; fields: string[]; cta: string }
  | { kind: "availabilityCard"; title: string; note: string }
  | { kind: "galleryMasonry"; shots: number; caption: string }
  | { kind: "footerCta"; title: string; cta: string; newsletter?: boolean }
  | { kind: "footerBar"; items: string[] };

export type SiteTemplate = {
  id: string;
  name: string;
  domain: string;
  category: string;
  blurb: string;
  /** Site palette applied live when this concept is chosen. */
  theme: ThemeId;
  features: string[];
  startingAt: string;
  design: TemplateDesign;
  sections: TemplateSection[];
};

export const templatesSection = {
  eyebrow: "Build My Website",
  title: "Choose a Starting Point",
  lede:
    "Twenty real designs — different layouts, type and art direction, not one layout in twenty colours. Open any of them to read the whole page, then pick the closest and I'll build from there.",
  note: "Selecting a concept also repaints this page in its palette.",
} as const;

/* ==========================================================================
 *  THE LIBRARY
 * ========================================================================== */

export const templates: SiteTemplate[] = [
  /* 01 ───────────────────────────────────────── white gallery portfolio */
  {
    id: "minimal",
    name: "Gallery White",
    domain: "gallerywhite.studio",
    category: "Minimal Portfolio",
    blurb: "Type-led and almost white. Thin rules, huge headings, no ornament — the work is the design.",
    theme: "daylight",
    features: ["Case-study index", "About", "Contact", "Light theme"],
    startingAt: "₹12,000",
    design: {
      display: "sans", case: "lower", tracking: -0.03, radius: 0, border: 1,
      hard: false, texture: "none",
      page: "#FAFAF8", panel: "#FFFFFF", ink: "#131310", muted: "#6C6C63",
      accent: "#131310", onAccent: "#FAFAF8", line: "#E3E3DD",
    },
    sections: [
      { kind: "nav", style: "minimal", links: ["Work", "Studio", "Contact"] },
      { kind: "heroTypeLed", title: "Selected work, plainly shown.", sub: "Independent designer — identity, editorial and web.", meta: ["2019 — 2026", "Remote", "Available"], cta: "Start a project" },
      { kind: "caseStudies", title: "Index", items: [
        { title: "Kite Coffee", meta: "Identity · 2025" },
        { title: "Halo Foods", meta: "Website · 2025" },
        { title: "Northline", meta: "Art direction · 2024" },
      ] },
      { kind: "footerBar", items: ["Instagram", "Are.na", "Email"] },
    ],
  },

  /* 02 ───────────────────────────────────── cream card-based consultancy */
  {
    id: "agency",
    name: "Marigold Studio",
    domain: "marigold.studio",
    category: "Creative Agency",
    blurb: "Cream cards on olive, a pill navbar and a stat row. Warm, editorial, very current.",
    theme: "crimson",
    features: ["Case studies", "Services", "Team", "Enquiry form"],
    startingAt: "₹22,000",
    design: {
      display: "sans", case: "upper", tracking: -0.02, radius: 20, border: 0,
      hard: false, texture: "none",
      page: "#F0EAD2", panel: "#FBF7E4", ink: "#1C1B14", muted: "#6F6B54",
      accent: "#6D5BF6", onAccent: "#FBF7E4", line: "#DDD6BC",
    },
    sections: [
      { kind: "nav", style: "pill", links: ["About", "Services", "Work", "Contact"], cta: "Studio" },
      { kind: "heroSplit", eyebrow: "Strategy & Brand Consulting", title: "Big ideas, beautifully executed.", body: "I help brands find their voice, sharpen their strategy, and build the kind of presence people actually remember.", cta: "Let's talk", secondary: "See my work" },
      { kind: "statCards", items: [
        { value: "60+", label: "Brands transformed", note: "since 2016" },
        { value: "98%", label: "Satisfaction", note: "across engagements", },
      ] },
      { kind: "marquee", items: ["Brand Strategy", "Creative Direction", "Marketing Systems", "Content Strategy", "Visual Identity"], tone: "light" },
      { kind: "imageTextSplit", eyebrow: "About me", title: "I'm Maya Chen, brand strategist.", body: "Seven years in the industry, a background in psychology, and a bias for work that survives contact with reality.", cta: "My full story", side: "left", chips: ["Strategy", "Branding", "Marketing"] },
      { kind: "logoStrip", items: ["Oat Collective", "Bloom Studio", "Soly.io", "Cebar & Co", "Hatch Labs"] },
      { kind: "footerBar", items: ["Marigold Studio © 2026", "Instagram", "LinkedIn"] },
    ],
  },

  /* 03 ───────────────────────────────────────────────── dark luxury estate */
  {
    id: "luxury",
    name: "Aurum Estates",
    domain: "aurum-estates.com",
    category: "Dark Luxury",
    blurb: "Black and gold, a full-bleed property hero and a centred showcase. Built for high-ticket sales.",
    theme: "amber",
    features: ["Listing showcase", "Enquiry form", "Location", "Gallery"],
    startingAt: "₹28,000",
    design: {
      display: "serif", case: "title", tracking: 0.01, radius: 2, border: 1,
      hard: false, texture: "none",
      page: "#0B0A08", panel: "#15120D", ink: "#F2E8D7", muted: "#A2967E",
      accent: "#C9A227", onAccent: "#14110B", line: "#2A251B",
    },
    sections: [
      { kind: "nav", style: "bar", links: ["Estates", "Story", "Journal", "Enquire"], cta: "Book a viewing" },
      { kind: "heroCarousel", title: "A residence, not an address.", sub: "Nine private estates in the hills above the valley.", cta: "Explore the collection", filters: ["All", "Hillside", "Waterfront", "Estate"] },
      { kind: "collectionDark", title: "The collection", body: "Each property is surveyed, restored and photographed in one pass — so what you see is what is there.", items: [
        { title: "The Ridge House", price: "₹4.2 Cr" },
        { title: "The Grove", price: "₹3.1 Cr" },
        { title: "Villa Serena", price: "₹5.8 Cr" },
      ], cta: "Enquire" },
      { kind: "statBar", items: [{ value: "09", label: "Residences" }, { value: "1.2k", label: "Site visits" }, { value: "92%", label: "Sold on first viewing" }] },
      { kind: "footerCta", title: "Private viewings, by appointment.", cta: "Request a viewing", newsletter: false },
    ],
  },

  /* 04 ────────────────────────────────────────── soft corporate / interiors */
  {
    id: "business",
    name: "Meridian",
    domain: "meridian.co.in",
    category: "Modern Business",
    blurb: "Calm blue, rounded serif headings and alternating image rows. Reads corporate without being dull.",
    theme: "ocean",
    features: ["Services", "About", "Testimonials", "Contact & map"],
    startingAt: "₹18,000",
    design: {
      display: "serif", case: "title", tracking: 0, radius: 14, border: 0,
      hard: false, texture: "none",
      page: "#E8F0F1", panel: "#FFFFFF", ink: "#123039", muted: "#5B7A82",
      accent: "#1F6F78", onAccent: "#FFFFFF", line: "#CDDDDF",
    },
    sections: [
      { kind: "nav", style: "bar", links: ["Services", "About", "Clients", "Contact"], cta: "Book a call" },
      { kind: "heroSplit", eyebrow: "Operations consulting", title: "Operations that scale with you.", body: "Advisory, audits and training for growing companies — practical work, delivered in quarters you can plan around.", cta: "Book a call", secondary: "See services" },
      { kind: "imageTextSplit", eyebrow: "Our approach", title: "Fewer initiatives, finished properly.", body: "We take on three engagements a quarter. Every one ends with a system your team owns and can run without us.", cta: "Read the method", side: "right" },
      { kind: "imageTextSplit", eyebrow: "Facilitation", title: "Workshops that produce decisions.", body: "Two days, one room, an agenda that ends in signed-off priorities instead of another action list.", side: "left" },
      { kind: "featureCards", columns: 3, items: [
        { title: "Advisory", body: "Monthly retainer" },
        { title: "Operating audit", body: "Fixed scope, four weeks" },
        { title: "Training", body: "Team workshops" },
      ] },
      { kind: "footerCta", title: "Tell us what's slowing the business down.", cta: "Start a conversation", newsletter: true },
    ],
  },

  /* 05 ──────────────────────────────────────────────────── SaaS product */
  {
    id: "saas",
    name: "Orbit",
    domain: "orbit.app",
    category: "SaaS Product",
    blurb: "Indigo product marketing: a stacked hero card carousel, feature grid and three pricing tiers.",
    theme: "midnight",
    features: ["Pricing", "Feature grid", "Signup / login", "Docs links"],
    startingAt: "₹30,000",
    design: {
      display: "sans", case: "title", tracking: -0.02, radius: 16, border: 1,
      hard: false, texture: "none",
      page: "#0A0B12", panel: "#14161F", ink: "#E7E9F4", muted: "#8E93A8",
      accent: "#6366F1", onAccent: "#FFFFFF", line: "#22252F",
    },
    sections: [
      { kind: "nav", style: "bar", links: ["Product", "Pricing", "Docs", "Changelog"], cta: "Start free" },
      { kind: "heroCentered", eyebrow: "Analytics for product teams", title: "Ship faster with less guesswork.", sub: "Funnels, cohorts and alerts that tell you what changed this week — in under five minutes of setup.", cta: "Start free" },
      { kind: "heroDome", title: "", sub: "", cta: "", shots: 5 },
      { kind: "featureCards", columns: 3, items: [
        { title: "Funnels", body: "Step-by-step drop-off, no SQL" },
        { title: "Alerts", body: "Slack and email, threshold based" },
        { title: "API", body: "REST and webhooks" },
      ] },
      { kind: "logoStrip", items: ["Kite", "Northline", "Halo Foods", "Cebar", "Soly"] },
      { kind: "pricing", items: [
        { title: "Starter", price: "₹0", note: "1 project · 10k events" },
        { title: "Growth", price: "₹2,499", note: "5 projects · unlimited", featured: true },
        { title: "Scale", price: "₹7,999", note: "SSO · audit log · SLA" },
      ] },
      { kind: "footerBar", items: ["Orbit © 2026", "Docs", "Status", "Privacy"] },
    ],
  },

  /* 06 ──────────────────────────────────────── furniture / shop editorial */
  {
    id: "ecommerce",
    name: "Woodcraft",
    domain: "woodcraft.in",
    category: "Online Store",
    blurb: "Brutal editorial commerce: oversized wordmark, a black marquee band, collection panel and product grid.",
    theme: "warm",
    features: ["Product catalogue", "Cart & checkout", "Payments", "Order updates"],
    startingAt: "₹26,000",
    design: {
      display: "sans", case: "lower", tracking: -0.04, radius: 2, border: 1,
      hard: false, texture: "none",
      page: "#F3F0E9", panel: "#FFFFFF", ink: "#14140F", muted: "#6B675C",
      accent: "#14140F", onAccent: "#F3F0E9", line: "#DCD8CE",
    },
    sections: [
      { kind: "nav", style: "minimal", links: ["Home", "About", "Blog", "Collection", "Contact"], cta: "Shop" },
      { kind: "heroWordmark", word: "woodcraft", sub: "Our mission is to deliver bespoke furniture that is built from wood and natural materials.", cta: "Explore", float: "Full collection" },
      { kind: "marquee", items: ["Bespoke", "Bespoke", "Bespoke", "Bespoke", "Bespoke"], tone: "dark" },
      { kind: "collectionDark", title: "Collection", body: "At Woodcraft, we are dedicated to crafting bespoke furniture made from wood and natural materials. Our designs embrace modern minimalism with a touch of creativity.", items: [
        { title: "Low Chair", price: "₹18,400" },
        { title: "Arc Lounge", price: "₹24,900" },
        { title: "Dining Bench", price: "₹12,600" },
      ], cta: "View more" },
      { kind: "caseStudies", title: "Case studies", items: [
        { title: "Copy Corner", meta: "Brand refresh" },
        { title: "Bespoke Residence", meta: "Full fit-out" },
      ] },
      { kind: "productGrid", title: "Featured products", columns: 3, items: [
        { title: "Rocking Chair", price: "Classic Walnut · ₹22,000" },
        { title: "Birch Chair", price: "Lightwood · ₹16,500" },
        { title: "Lounge Chair", price: "Oak & Bone · ₹19,800" },
      ] },
      { kind: "footerCta", title: "Don't miss out!", cta: "Subscribe", newsletter: true },
    ],
  },

  /* 07 ────────────────────────────────────────────────────────── restaurant */
  {
    id: "restaurant",
    name: "Saveur",
    domain: "saveur.in",
    category: "Restaurant & Café",
    blurb: "Dark plating: a two-column menu with prices, a story panel and a booking bar. Built to get reservations.",
    theme: "crimson",
    features: ["Digital menu", "Table booking", "Gallery", "Delivery links", "Opening hours"],
    startingAt: "₹16,000",
    design: {
      display: "serif", case: "title", tracking: 0.005, radius: 4, border: 1,
      hard: false, texture: "none",
      page: "#100C0A", panel: "#1B1411", ink: "#F3E9DC", muted: "#A18D7C",
      accent: "#D6452F", onAccent: "#FBF3E9", line: "#2E241E",
    },
    sections: [
      { kind: "nav", style: "bar", links: ["Menu", "Story", "Gallery", "Reserve"], cta: "Book a table" },
      { kind: "heroFullbleed", chip: "Seasonal kitchen", title: "A table by candlelight.", sub: "Seasonal plates, natural wine, and no hurry at all.", cta: "Book a table" },
      { kind: "menuList", title: "Tonight's menu", note: "Kitchen closes at 23:00", items: [
        { label: "Charred aubergine, sesame, mint", value: "₹420" },
        { label: "Saffron risotto, aged parmesan", value: "₹560" },
        { label: "Line-caught fish, brown butter", value: "₹720" },
        { label: "Burnt basque cheesecake", value: "₹380" },
      ] },
      { kind: "galleryMasonry", shots: 4, caption: "The room" },
      { kind: "bookingBar", fields: ["Date", "Guests", "Time"], cta: "Reserve" },
      { kind: "footerBar", items: ["Saveur · Pune", "Open Tue–Sun", "Swiggy", "Zomato"] },
    ],
  },

  /* 08 ───────────────────────────────────────────────────── personal brand */
  {
    id: "personal",
    name: "Aria",
    domain: "ariamenon.com",
    category: "Personal Brand",
    blurb: "Soft rose, rounded cards, a centred hero and one testimonial that does the heavy lifting.",
    theme: "plum",
    features: ["Bio & about", "Offerings", "Testimonials", "Booking link"],
    startingAt: "₹15,000",
    design: {
      display: "sans", case: "title", tracking: -0.02, radius: 22, border: 0,
      hard: false, texture: "none",
      page: "#FBF2F7", panel: "#FFFFFF", ink: "#23121C", muted: "#75606C",
      accent: "#DB2777", onAccent: "#FFFFFF", line: "#EFDCE7",
    },
    sections: [
      { kind: "nav", style: "pill", links: ["About", "Work", "Notes"], cta: "Book" },
      { kind: "heroCentered", eyebrow: "Copy & content strategy", title: "I help founders sound like themselves.", sub: "Positioning, site copy and launch content — for people who are tired of writing in someone else's voice.", cta: "Work with me" },
      { kind: "statCards", items: [
        { value: "140+", label: "Launches written", note: "since 2018" },
        { value: "4.9", label: "Average rating", note: "42 engagements" },
      ] },
      { kind: "featureCards", columns: 3, items: [
        { title: "Site copy", body: "Two weeks, end to end" },
        { title: "Launch kit", body: "Landing page + emails" },
        { title: "Consulting", body: "Hourly, bookable" },
      ] },
      { kind: "imageTextSplit", eyebrow: "Kind words", title: "Our signups doubled after the rewrite.", body: "She found the sentence we'd been avoiding for two years and put it at the top of the page.", side: "right", chips: ["Founder, Kite Coffee"] },
      { kind: "footerCta", title: "Bring the thing you keep rewriting.", cta: "Book a call", newsletter: true },
    ],
  },

  /* 09 ────────────────────────────────────────────────────────── education */
  {
    id: "education",
    name: "Scholar",
    domain: "scholar.academy",
    category: "Education",
    blurb: "Structured and trustworthy: three course tiers, a coloured stat bar, faculty and a timeline of terms.",
    theme: "ocean",
    features: ["Course list", "Faculty", "Admissions form", "Downloads"],
    startingAt: "₹20,000",
    design: {
      display: "sans", case: "title", tracking: -0.01, radius: 8, border: 1,
      hard: false, texture: "none",
      page: "#F6F9FC", panel: "#FFFFFF", ink: "#0F2035", muted: "#5B7290",
      accent: "#1D4ED8", onAccent: "#FFFFFF", line: "#DEE7F1",
    },
    sections: [
      { kind: "nav", style: "bar", links: ["Courses", "Faculty", "Admissions", "Campus"], cta: "Apply now" },        { kind: "heroSplit", eyebrow: "Small cohorts, real projects", title: "Learn the thing properly.", body: "Twelve students per term, taught by people who still do the work.", cta: "Apply for 2026", secondary: "Download syllabus" },
      { kind: "statBar", items: [{ value: "92%", label: "Completion" }, { value: "18", label: "Mentors" }, { value: "4.9", label: "Rating" }, { value: "12", label: "Seats per term" }] },
      { kind: "pricing", items: [
        { title: "Foundation", price: "₹18,000", note: "6 weeks · evenings" },
        { title: "Studio", price: "₹42,000", note: "10 weeks · full time", featured: true },
        { title: "Advanced", price: "₹64,000", note: "12 weeks · portfolio" },
      ] },
      { kind: "timeline", items: [
        { when: "Week 1", title: "Foundations", body: "Tools, critique and the first finished piece." },
        { when: "Week 4", title: "Studio", body: "Client-style briefs with weekly review." },
        { when: "Week 8", title: "Showcase", body: "Portfolio, site and public presentation." },
      ] },
      { kind: "footerCta", title: "Admissions for the next term are open.", cta: "Apply now", newsletter: true },
    ],
  },

  /* 10 ───────────────────────────────────────────────────────────── gaming */
  {
    id: "gaming",
    name: "Overdrive",
    domain: "overdrive.gg",
    category: "Gaming",
    blurb: "Neo-brutalist: graph-paper grid, thick borders, hard shadows and monospace code panels.",
    theme: "neon",
    features: ["Roster", "Tournaments", "Schedule", "Discord link", "Stream embed"],
    startingAt: "₹22,000",
    design: {
      display: "mono", case: "upper", tracking: -0.01, radius: 2, border: 2,
      hard: true, texture: "grid",
      page: "#0B0B12", panel: "#15151F", ink: "#EAF6FF", muted: "#8794A8",
      accent: "#22D3EE", onAccent: "#05131A", line: "#2A2A38",
    },
    sections: [
      { kind: "nav", style: "window", links: ["Skills", "Projects", "Schedule", "Blog"], cta: "Contact me" },        { kind: "heroSplit", eyebrow: "Hey, I'm Overdrive", title: "Esports, engineered.", body: "Roster management, tournament tooling and broadcast overlays for competitive teams.", cta: "Join the Discord", secondary: "Download kit" },
      { kind: "iconRow", items: ["React", "TypeScript", "Node", "WebGL", "OBS", "Git"] },
      { kind: "codeCard", lines: [
        { key: "team", value: "Overdrive" },
        { key: "season", value: "2026" },
        { key: "titles", value: "4" },
        { key: "goal", value: "Playoffs" },
      ] },
      { kind: "statBar", items: [{ value: "12", label: "Players" }, { value: "31", label: "Wins" }, { value: "04", label: "Titles" }] },
      { kind: "windowCards", items: [
        { title: "Fixtures", meta: "week-07.html", body: "vs Vortex — Sat 20:00. vs Ashen — Sun 19:30." },
        { title: "Roster", meta: "roster.json", body: "Six starters, two subs, one analyst." },
      ] },
      { kind: "footerBar", items: ["Overdrive © 2026", "Twitch", "Discord", "X"] },
    ],
  },

  /* 11 ─────────────────────────────────────── anime / cinematic showcase */
  {
    id: "anime",
    name: "Cinematic",
    domain: "cinematic.studio",
    category: "Anime & Cinematic",
    blurb: "Near-black stage, a centred card carousel with arrows, filter pills and a wide CTA band.",
    theme: "crimson",
    features: ["WebGL hero", "Scroll sequence", "Horizontal reel", "Sound toggle"],
    startingAt: "₹35,000",
    design: {
      display: "serif", case: "upper", tracking: 0.08, radius: 6, border: 1,
      hard: false, texture: "none",
      page: "#07060A", panel: "#120C14", ink: "#EFE6E9", muted: "#9A8A90",
      accent: "#C81E27", onAccent: "#F7EDEE", line: "#241A1F",
    },
    sections: [
      { kind: "nav", style: "minimal", links: ["Home", "Story", "Gallery", "Contact"] },
      { kind: "heroCarousel", title: "The art of silence", sub: "An interactive film sequence that happens to be a website.", cta: "Enter", filters: ["All", "Character", "Sequence", "Score", "Motion"] },
      { kind: "marquee", items: ["Discipline", "Sacrifice", "Shadow", "Stillness"], tone: "accent" },
      { kind: "galleryMasonry", shots: 5, caption: "Frames" },
      { kind: "imageTextSplit", eyebrow: "The story", title: "Built frame by frame.", body: "Every transition is scrubbed by scroll, so the sequence plays at the visitor's own pace — and reverses when they scroll back.", side: "left" },
      { kind: "footerCta", title: "Enter the shadow.", cta: "Start a project", newsletter: false },
    ],
  },

  /* 12 ──────────────────────────────────────────────────────────── fitness */
  {
    id: "fitness",
    name: "Iron & Ember",
    domain: "ironember.fit",
    category: "Gym & Fitness",
    blurb: "High-contrast strength brand: lime accents on near-black, membership tiers and a timetable.",
    theme: "graphite",
    features: ["Membership plans", "Class timetable", "Trainer profiles", "Free-trial form"],
    startingAt: "₹17,000",
    design: {
      display: "sans", case: "upper", tracking: -0.03, radius: 4, border: 1,
      hard: false, texture: "none",
      page: "#0C0C0E", panel: "#17171B", ink: "#F1F1F3", muted: "#8F8F96",
      accent: "#A3E635", onAccent: "#101014", line: "#26262C",
    },
    sections: [
      { kind: "nav", style: "bar", links: ["Plans", "Classes", "Coaches", "Contact"], cta: "Free trial" },
      { kind: "heroFullbleed", chip: "Open 24/7", title: "TRAIN HARD", sub: "Strength, conditioning and recovery under one roof.", cta: "Claim free trial" },
      { kind: "pricing", items: [
        { title: "Monthly", price: "₹2,000", note: "All classes" },
        { title: "Quarterly", price: "₹5,400", note: "Save 10%", featured: true },
        { title: "Annual", price: "₹18,000", note: "Save 25% + PT" },
      ] },
      { kind: "timeline", items: [
        { when: "06:00", title: "Strength", body: "Barbell club · 12 places" },
        { when: "18:30", title: "HIIT", body: "3 places left" },
        { when: "20:00", title: "Mobility", body: "Open mat" },
      ] },
      { kind: "statBar", items: [{ value: "12", label: "Classes a week" }, { value: "9", label: "Coaches" }, { value: "6am", label: "Doors open" }] },
      { kind: "footerCta", title: "First session is on us.", cta: "Book a free trial", newsletter: false },
    ],
  },

  /* 13 ──────────────────────────────────────────────────────── photography */
  {
    id: "photo",
    name: "Aperture",
    domain: "aperture.photo",
    category: "Photography",
    blurb: "Photo-first: a perspective fan of images under a slim nav, dark and gallery-quiet.",
    theme: "graphite",
    features: ["Full-bleed gallery", "Albums", "Prints store", "Booking form"],
    startingAt: "₹18,000",
    design: {
      display: "serif", case: "title", tracking: 0, radius: 10, border: 1,
      hard: false, texture: "none",
      page: "#0A0A0B", panel: "#141416", ink: "#F2F2F4", muted: "#96969C",
      accent: "#E7E5E4", onAccent: "#0A0A0B", line: "#232326",
    },
    sections: [
      { kind: "nav", style: "minimal", links: ["Discover", "Stories", "Prints", "Contact"], cta: "Log in" },
      { kind: "heroDome", title: "Capturing moments & sharing stories.", sub: "From amateur to seasoned pro, discover inspiration and share technique.", cta: "Explore" },
      { kind: "caseStudies", title: "Albums", items: [
        { title: "Monsoon, Kerala", meta: "Editorial · 32 frames" },
        { title: "Salt Flat", meta: "Landscape · 18 frames" },
        { title: "Studio Portraits", meta: "Portrait · 44 frames" },
      ] },
      { kind: "galleryMasonry", shots: 6, caption: "Recent work" },
      { kind: "bookingBar", fields: ["Session type", "Date", "Location"], cta: "Check availability" },
      { kind: "footerBar", items: ["Aperture © 2026", "Instagram", "Behance", "Prints"] },
    ],
  },

  /* 14 ────────────────────────────────────────────────────────────── music */
  {
    id: "music",
    name: "Lowlight",
    domain: "lowlight.band",
    category: "Music & Artist",
    blurb: "Plum and neon: a release carousel, tour list and streaming links. Night-time energy.",
    theme: "plum",
    features: ["Release list", "Tour dates", "Streaming links", "Mailing list"],
    startingAt: "₹19,000",
    design: {
      display: "sans", case: "upper", tracking: 0.02, radius: 18, border: 0,
      hard: false, texture: "none",
      page: "#120A0F", panel: "#1C1017", ink: "#F3E7EE", muted: "#A08595",
      accent: "#F472B6", onAccent: "#120A0F", line: "#2C1A24",
    },
    sections: [
      { kind: "nav", style: "pill", links: ["Music", "Tour", "Shop", "Contact"], cta: "Listen" },
      { kind: "heroCarousel", title: "New record out now.", sub: "Recorded live in one room over three nights.", cta: "Listen", filters: ["Albums", "Singles", "Live", "Remix"] },
      { kind: "timeline", items: [
        { when: "12 Nov", title: "Mumbai — Blue Room", body: "Doors 20:00 · tickets from ₹499" },
        { when: "19 Nov", title: "Bengaluru — Echo", body: "Doors 21:00 · sold fast last time" },
      ] },
      { kind: "iconRow", items: ["Spotify", "Apple Music", "Bandcamp", "YouTube"] },
      { kind: "footerCta", title: "Join the mailing list.", cta: "Subscribe", newsletter: true },
    ],
  },

  /* 15 ───────────────────────────────────────────────────────── technology */
  {
    id: "tech",
    name: "Cortex",
    domain: "cortex.systems",
    category: "Technology",
    blurb: "Engineering-brand brutal: cyan on charcoal, spec bars, a code panel and a changelog window.",
    theme: "neon",
    features: ["Spec table", "Docs", "Changelog", "Status page"],
    startingAt: "₹26,000",
    design: {
      display: "mono", case: "upper", tracking: -0.005, radius: 2, border: 2,
      hard: true, texture: "grid",
      page: "#050A0C", panel: "#0C161A", ink: "#D9F6FA", muted: "#79A0A6",
      accent: "#22D3EE", onAccent: "#04121A", line: "#173037",
    },
    sections: [
      { kind: "nav", style: "window", links: ["Platform", "Docs", "Pricing", "Status"], cta: "Read docs" },        { kind: "heroSplit", eyebrow: "Edge infrastructure", title: "Compute at the edge.", body: "Deploy to forty regions with one command, and roll back in eleven seconds.", cta: "Read the docs", secondary: "View pricing" },
      { kind: "statBar", items: [{ value: "40", label: "Regions" }, { value: "18ms", label: "p50 latency" }, { value: "99.99%", label: "Uptime" }, { value: "11s", label: "Rollback" }] },
      { kind: "codeCard", lines: [
        { key: "$ cortex deploy", value: "→ building" },
        { key: "regions", value: "40" },
        { key: "cold start", value: "18ms" },
        { key: "status", value: "healthy" },
      ] },
      { kind: "windowCards", items: [
        { title: "Changelog", meta: "v4.2.0", body: "Streaming logs in the dashboard, plus per-route budgets." },
        { title: "Status", meta: "status.html", body: "All systems operational. 99.99% over 90 days." },
      ] },
      { kind: "footerBar", items: ["Cortex © 2026", "Docs", "GitHub", "Status"] },
    ],
  },

  /* 16 ─────────────────────────────────────────────────── blog / magazine */
  {
    id: "blog",
    name: "Folio Press",
    domain: "foliopress.media",
    category: "Blog & Magazine",
    blurb: "Retro monochrome: halftone greys, window-chrome article cards and a typewriter masthead.",
    theme: "daylight",
    features: ["Article index", "Categories", "Author pages", "Newsletter"],
    startingAt: "₹20,000",
    design: {
      display: "mono", case: "lower", tracking: -0.02, radius: 3, border: 2,
      hard: false, texture: "halftone",
      page: "#EDEDED", panel: "#FFFFFF", ink: "#111111", muted: "#565656",
      accent: "#111111", onAccent: "#EDEDED", line: "#CFCFCF",
    },
    sections: [
      { kind: "nav", style: "window", links: ["Projects", "Blog", "Learn", "About"], cta: "Find me" },
      { kind: "heroTypeLed", title: "Hello. I'm Folio.", sub: "A reading room for slow essays on design, cities and work — updated twice a week.", meta: ["142 essays", "Since 2019", "No ads"], cta: "Browse the archive" },
      { kind: "windowCards", items: [
        { title: "Possimus", meta: "2026-04-08-project.html", body: "Officia sit numquam fugiat sunt molestiae id. Est modi at debitis dolorem." },
        { title: "Dolorum Ullam", meta: "2026-04-08-project.html", body: "Consequatur consequatur et quisquam sit velit. Distinctio sint omnis." },
      ] },
      { kind: "caseStudies", title: "From the blog", items: [
        { title: "The quiet return of the broadsheet", meta: "6 min read" },
        { title: "Why your homepage is too loud", meta: "4 min read" },
        { title: "Notes on writing for skimmers", meta: "9 min read" },
      ] },
      { kind: "footerBar", items: ["Folio Press © 2026", "RSS", "Subscribe", "Contact"] },
    ],
  },

  /* 17 ────────────────────────────────────────────────────────── event */
  {
    id: "event",
    name: "Summit",
    domain: "summit2026.in",
    category: "Event & Conference",
    blurb: "Conference shape: a day-by-day programme, speaker grid and ticket tiers in warm clay tones.",
    theme: "warm",
    features: ["Agenda", "Speakers", "Ticketing", "Venue map"],
    startingAt: "₹21,000",
    design: {
      display: "sans", case: "upper", tracking: 0.01, radius: 12, border: 1,
      hard: false, texture: "none",
      page: "#0E0C08", panel: "#1A1611", ink: "#F5EDE1", muted: "#A3927C",
      accent: "#EA580C", onAccent: "#FFF6EE", line: "#2C261E",
    },
    sections: [
      { kind: "nav", style: "bar", links: ["Agenda", "Speakers", "Tickets", "Venue"], cta: "Get tickets" },
      { kind: "heroFullbleed", chip: "12–14 Feb · Bengaluru", title: "Three days. One question.", sub: "A working conference on design systems, with studio tours on day three.", cta: "Get tickets" },
      { kind: "timeline", items: [
        { when: "Day 01", title: "Keynotes", body: "Six talks, one stage, no parallel tracks." },
        { when: "Day 02", title: "Workshops", body: "Four rooms, twelve people each." },
        { when: "Day 03", title: "Studio tours", body: "Three studios, one bus, lunch included." },
      ] },
      { kind: "featureCards", columns: 4, items: [
        { title: "24 talks", body: "Curated, not sponsored" },
        { title: "4 workshops", body: "Small rooms" },
        { title: "3 tours", body: "Behind the scenes" },
        { title: "1 party", body: "Rooftop, rooftop" },
      ] },
      { kind: "pricing", items: [
        { title: "Student", price: "₹1,500", note: "Valid ID" },
        { title: "Standard", price: "₹4,900", note: "All three days", featured: true },
        { title: "Team", price: "₹15,000", note: "Four seats" },
      ] },
      { kind: "footerBar", items: ["Summit © 2026", "Code of conduct", "Venue", "Contact"] },
    ],
  },

  /* 18 ──────────────────────────────────────────────────── landing page */
  {
    id: "landing",
    name: "Launchpad",
    domain: "launchpad.site",
    category: "Landing Page",
    blurb: "One page, one goal: an oversized promise, three proof points and a single repeating CTA.",
    theme: "verdant",
    features: ["Single page", "Lead form", "A/B ready", "Analytics"],
    startingAt: "₹9,000",
    design: {
      display: "sans", case: "upper", tracking: -0.03, radius: 8, border: 1,
      hard: false, texture: "none",
      page: "#05100B", panel: "#0C1A13", ink: "#E7F5EC", muted: "#82A691",
      accent: "#22C55E", onAccent: "#04120A", line: "#1C3326",
    },
    sections: [
      { kind: "nav", style: "bar", links: ["Offer", "Proof", "FAQ"], cta: "Get the plan" },
      { kind: "heroCentered", eyebrow: "Five-day launch sprint", title: "Get your first 100 customers.", sub: "A repeatable launch sequence — positioning, landing page, and the first three channels to test.", cta: "Get the plan" },
      { kind: "statBar", items: [{ value: "5", label: "Days" }, { value: "₹0", label: "Ad spend" }, { value: "100", label: "Customers" }] },
      { kind: "featureCards", columns: 3, items: [
        { title: "Positioning", body: "One sentence a stranger repeats" },
        { title: "Landing page", body: "Built and live in a day" },
        { title: "Channels", body: "Three tests, measured" },
      ] },
      { kind: "imageTextSplit", eyebrow: "Proof", title: "We hit 120 signups in the first week.", body: "The sequence works because it refuses to do five things badly — it does one thing every day until it converts.", side: "right", chips: ["Founder, Orbit"] },
      { kind: "footerCta", title: "The next sprint starts Monday.", cta: "Get the plan", newsletter: false },
    ],
  },

  /* 19 ────────────────────────────────────────────────────────── hotel */
  {
    id: "hotel",
    name: "Azure Bay",
    domain: "azurebay.com",
    category: "Hotel & Resort",
    blurb: "Bright, airy hospitality: a photo hero, an availability bar, room cards and an amenities panel.",
    theme: "ocean",
    features: ["Rooms & suites", "Availability form", "Amenities", "Location map"],
    startingAt: "₹24,000",
    design: {
      display: "serif", case: "title", tracking: 0, radius: 12, border: 1,
      hard: false, texture: "none",
      page: "#EEF4F7", panel: "#FFFFFF", ink: "#10333F", muted: "#5C7E8B",
      accent: "#0E7490", onAccent: "#FFFFFF", line: "#D3E2E8",
    },
    sections: [
      { kind: "nav", style: "pill", links: ["Rooms", "Dine", "Spa", "Journal"], cta: "Book now" },
      { kind: "heroFullbleed", chip: "Open all year", title: "Stay by the water.", sub: "Twelve rooms, one horizon, and breakfast served until eleven.", cta: "Check dates" },
      { kind: "bookingBar", fields: ["Arrive", "Depart", "Guests"], cta: "Check availability" },
      { kind: "imageTextSplit", eyebrow: "Welcome", title: "A small hotel that behaves like a home.", body: "Twelve rooms, a kitchen that changes its menu with the catch, and staff who remember your name on day two.", side: "left" },
      { kind: "caseStudies", title: "Rooms & suites", items: [
        { title: "Deluxe Room", meta: "₹6,500 / night · garden view" },
        { title: "Sea Suite", meta: "₹11,000 / night · balcony" },
        { title: "Private Villa", meta: "₹18,000 / night · plunge pool" },
      ] },
      { kind: "galleryMasonry", shots: 4, caption: "The property" },
      { kind: "footerBar", items: ["Azure Bay © 2026", "Directions", "Amenities", "Contact"] },
    ],
  },

  /* 20 ─────────────────────────────────────────────────────── salon & spa */
  {
    id: "salon",
    name: "Lumière",
    domain: "lumierestudio.com",
    category: "Salon & Spa",
    blurb: "Muted and tactile: a service menu with prices, stylist profiles and a soft booking panel.",
    theme: "plum",
    features: ["Service & price list", "Appointment form", "Stylist profiles", "Instagram feed"],
    startingAt: "₹15,000",
    design: {
      display: "serif", case: "title", tracking: 0.005, radius: 16, border: 1,
      hard: false, texture: "none",
      page: "#140F14", panel: "#1F1820", ink: "#F4EAF1", muted: "#A48F9D",
      accent: "#E879C0", onAccent: "#140F14", line: "#2E2430",
    },
    sections: [
      { kind: "nav", style: "bar", links: ["Services", "Stylists", "Studio", "Book"], cta: "Book a chair" },        { kind: "heroSplit", eyebrow: "Hair · skin · nails", title: "Ten minutes of calm.", body: "Cut, colour and care in a small studio that only takes four clients at a time.", cta: "Book a chair", secondary: "See services" },
      { kind: "menuList", title: "Services", note: "All prices include consultation", items: [
        { label: "Cut & finish", value: "₹900" },
        { label: "Colour, full head", value: "₹2,400" },
        { label: "Spa ritual, 60 min", value: "₹1,800" },
        { label: "Bridal trial", value: "₹3,600" },
      ] },
      { kind: "featureCards", columns: 3, items: [
        { title: "Ana", body: "Colour specialist · 9 years" },
        { title: "Rhea", body: "Cuts & styling · 6 years" },
        { title: "Meera", body: "Skin & spa · 11 years" },
      ] },
      { kind: "galleryMasonry", shots: 3, caption: "The studio" },
      { kind: "bookingBar", fields: ["Service", "Stylist", "Date"], cta: "Request appointment" },
      { kind: "footerBar", items: ["Lumière © 2026", "Instagram", "Directions", "Careers"] },
    ],
  },
];

export function templateById(id: string): SiteTemplate | undefined {
  return templates.find((t) => t.id === id);
}
