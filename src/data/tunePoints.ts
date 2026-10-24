import { IMAGE_SECTIONS, SLOTS_PER_SECTION, slotId, type ImageSectionId } from "./imageSlots";

/**
 * ============================================================================
 *  TUNE POINTS — every place in the site the Studio can reach
 * ============================================================================
 *  The dashboard's Studio tab works on *points*. A point is one element of the
 *  page that carries a `data-tune="<id>"` attribute, and this file is the
 *  register of them: the id, the words the dashboard shows, and the two flags
 *  that say what may be done to it.
 *
 *    kind       section — a whole band of the page, reorderable and switchable
 *               item    — one thing inside a band (a heading, a row, a card)
 *               media   — a picture from the Images tab; its crop, zoom and
 *                         size are the slot's own fields, so the Studio edits
 *                         the slot rather than painting CSS over it
 *
 *    transform  false on the points that host pinned or sticky machinery. A
 *               `transform` on an ancestor turns `position: fixed` into a lie,
 *               which is exactly how the two pinned sections are held — so
 *               those points accept size, crop, opacity and radius, and refuse
 *               scale/rotate/nudge.
 *
 *  `pictures` says whether the point's own subtree holds pictures worth
 *  enlarging or cropping through the CSS layer (a section does; a heading does
 *  not). Picture points from the Images tab are edited slot-by-slot instead.
 * ============================================================================
 */

export type PointKind = "section" | "item" | "media";

export type TunePoint = {
  id: string;
  label: string;
  /** The band of the page this point belongs to, as shown in the dashboard. */
  group: string;
  kind: PointKind;
  /** One line the dashboard prints under the label. */
  hint: string;
  /** Scale, rotate and nudge are refused when false. */
  transform: boolean;
  /** The CSS layer also crops/enlarges the pictures inside this point. */
  pictures: boolean;
};

/* -------------------------------------------------------------------------- */
/*  The sections — also the page's order                                      */
/* -------------------------------------------------------------------------- */

export type PageSection = {
  id: string;
  label: string;
  /** The element id the navbar's links scroll to. */
  anchor: string;
  hint: string;
};

export const PAGE_SECTIONS: PageSection[] = [
  { id: "hero", label: "Hero — the opening film", anchor: "home", hint: "The pinned, scroll-scrubbed run the page opens on." },
  { id: "intro", label: "Intro — headline", anchor: "intro", hint: "The words the hero does not carry: wordmark, headline, calls to action." },
  { id: "story", label: "Studio — How I Work", anchor: "story", hint: "The approach copy, the figures and the picture beside it." },
  { id: "statement", label: "Statement — the kinetic line", anchor: "statement", hint: "The sentence that assembles word by word, and the ticker under it." },
  { id: "templates", label: "Templates — the shelf", anchor: "templates", hint: "The pinned sideways shelf of seven live template sites." },
  { id: "archive", label: "The Archive", anchor: "gallery", hint: "The frames: the statement, the three wide stills and the tiles." },
  { id: "projects", label: "Live Projects", anchor: "projects", hint: "The deployed sites, each opening the real thing." },
  { id: "capability", label: "Capability", anchor: "capability", hint: "What the studio does, as a list of services." },
  { id: "about", label: "About", anchor: "about", hint: "The portrait and the short biography." },
  { id: "themes", label: "Brief band", anchor: "themes", hint: "The pointer to the eight-step commission brief." },
  { id: "order", label: "Brief", anchor: "order", hint: "The full commission form, rendered in place." },
  { id: "cta", label: "Closing call", anchor: "contact", hint: "The last call to action before the footer." },
  { id: "footer", label: "Footer", anchor: "footer", hint: "Identity, links and the small print." },
];

/* -------------------------------------------------------------------------- */
/*  Sections and the items inside them                                        */
/* -------------------------------------------------------------------------- */

const SECTION_POINTS: TunePoint[] = PAGE_SECTIONS.map((section) => ({
  id: `sec-${section.id}`,
  label: section.label,
  group: section.label,
  kind: "section" as PointKind,
  hint: section.hint,
  // The two pinned bands refuse transforms — see the note at the top.
  transform: section.id !== "hero" && section.id !== "templates",
  pictures: true,
}));

const ITEM_POINTS: TunePoint[] = [
  // Chrome
  { id: "item-navbar", label: "Header bar", group: "Chrome", kind: "item", hint: "The fixed bar: wordmark, navigation, theme mark, sound and menu.", transform: true, pictures: false },

  // Hero
  { id: "item-hero-plate", label: "The film itself", group: "Hero — the opening film", kind: "item", hint: "The scroll-scrubbed run. Enlarge/crop works on the frames; size and opacity are safe.", transform: false, pictures: true },
  { id: "item-hero-backdrop", label: "Plane behind the film", group: "Hero — the opening film", kind: "item", hint: "The defocused artwork sitting at the back of the stage.", transform: false, pictures: true },
  { id: "item-hero-hint", label: "Scroll hint + rail", group: "Hero — the opening film", kind: "item", hint: "The “scroll to explore” line and the rail that doubles as the run's progress.", transform: true, pictures: false },

  // Intro
  { id: "item-intro-wordmark", label: "Hollow wordmark", group: "Intro — headline", kind: "item", hint: "The large outlined word above the headline.", transform: true, pictures: false },
  { id: "item-intro-title", label: "Headline", group: "Intro — headline", kind: "item", hint: "The page's h1 — kept whole for search engines and screen readers.", transform: true, pictures: false },
  { id: "item-intro-actions", label: "Call-to-action row", group: "Intro — headline", kind: "item", hint: "The two buttons under the lede.", transform: true, pictures: false },
  { id: "item-intro-contact", label: "Direct contact row", group: "Intro — headline", kind: "item", hint: "WhatsApp and email, one tap away.", transform: true, pictures: false },

  // Studio
  { id: "item-story-copy", label: "Copy column", group: "Studio — How I Work", kind: "item", hint: "The approach paragraphs and the eyebrow above them.", transform: true, pictures: false },
  { id: "item-story-media", label: "Picture column", group: "Studio — How I Work", kind: "item", hint: "The frame beside the copy — its slot is in the Images tab.", transform: true, pictures: true },
  { id: "item-story-stats", label: "The three figures", group: "Studio — How I Work", kind: "item", hint: "Live products, ready templates, real-time web.", transform: true, pictures: false },

  // Statement
  { id: "item-statement-line", label: "Kinetic line", group: "Statement — the kinetic line", kind: "item", hint: "The sentence that rises word by word as the band crosses the screen.", transform: true, pictures: false },
  { id: "item-statement-ticker", label: "Ticker", group: "Statement — the kinetic line", kind: "item", hint: "The endless list of capabilities running under the line.", transform: true, pictures: false },

  // Templates
  { id: "item-templates-head", label: "Shelf heading", group: "Templates — the shelf", kind: "item", hint: "The eyebrow and heading above the shelf.", transform: true, pictures: false },
  { id: "item-templates-shelf", label: "Moving shelf", group: "Templates — the shelf", kind: "item", hint: "The track the scroll slides sideways. Size it, or soften the blocks.", transform: false, pictures: true },

  // Archive
  { id: "item-archive-head", label: "Heading", group: "The Archive", kind: "item", hint: "The eyebrow, title and lede of the section.", transform: true, pictures: false },
  { id: "item-archive-statement", label: "Statement + mark", group: "The Archive", kind: "item", hint: "The line beside the house mark that turns with the scroll.", transform: true, pictures: false },
  { id: "item-archive-wide", label: "Wide frames row", group: "The Archive", kind: "item", hint: "The three large stills, slots 01–03.", transform: true, pictures: true },
  { id: "item-archive-grid", label: "Tiles row", group: "The Archive", kind: "item", hint: "Slots 04–09 and anything uploaded from this device.", transform: true, pictures: true },

  // Projects / capability / about / cta
  { id: "item-projects-head", label: "Heading", group: "Live Projects", kind: "item", hint: "The section's eyebrow, title and lede.", transform: true, pictures: false },
  { id: "item-projects-grid", label: "Cards", group: "Live Projects", kind: "item", hint: "The deployment cards, in the order set in the Projects tab.", transform: true, pictures: true },
  { id: "item-capability-grid", label: "Service list", group: "Capability", kind: "item", hint: "The numbered services and their descriptions.", transform: true, pictures: false },
  { id: "item-about-portrait", label: "Portrait", group: "About", kind: "item", hint: "The portrait frame — point it anywhere from the Artwork tab.", transform: true, pictures: true },
  { id: "item-about-copy", label: "Biography", group: "About", kind: "item", hint: "The short, factual biography.", transform: true, pictures: false },
  { id: "item-cta-panel", label: "Closing panel", group: "Closing call", kind: "item", hint: "The last call to action with its backdrop.", transform: true, pictures: true },
  { id: "item-footer-note", label: "Footer body", group: "Footer", kind: "item", hint: "Identity, navigation and the small print.", transform: true, pictures: false },
];

/** The `data-tune` id of one picture slot — the same shape `slotId` uses. */
export function slotPointId(sectionId: ImageSectionId, index: number): string {
  return `slot-${slotId(sectionId, index)}`;
}

/** One point per picture in the Images tab, so the Studio can reach them too. */
const MEDIA_POINTS: TunePoint[] = IMAGE_SECTIONS.flatMap((section) =>
  Array.from({ length: SLOTS_PER_SECTION }, (_, i) => i + 1).map((index) => ({
    id: slotPointId(section.id, index),
    label: `${section.label} · slot ${String(index).padStart(2, "0")}`,
    group: `Pictures — ${section.label}`,
    kind: "media" as PointKind,
    hint: "A picture from the Images tab: its crop, zoom, size, opacity and film are the slot's own fields.",
    transform: false,
    pictures: true,
  })),
);

export const TUNE_POINTS: TunePoint[] = [...SECTION_POINTS, ...ITEM_POINTS, ...MEDIA_POINTS];

/** The slot behind a `slot-…` point id, or null when it is not a slot point. */
export function parseSlotPoint(id: string): { section: ImageSectionId; index: number } | null {
  const match = /^slot-([a-z]+)-(\d{1,2})$/.exec(id);
  if (!match) return null;
  const section = IMAGE_SECTIONS.find((entry) => entry.id === match[1]);
  if (!section) return null;
  return { section: section.id, index: Number(match[2]) };
}

/** Points grouped for the dashboard, in the order they are declared. */
export function pointsByGroup(): Array<{ group: string; points: TunePoint[] }> {
  const groups: Array<{ group: string; points: TunePoint[] }> = [];
  TUNE_POINTS.forEach((point) => {
    const existing = groups.find((entry) => entry.group === point.group);
    if (existing) existing.points.push(point);
    else groups.push({ group: point.group, points: [point] });
  });
  return groups;
}
