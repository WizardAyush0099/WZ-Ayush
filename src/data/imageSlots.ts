import { archiveImages } from "./content";

/**
 * ============================================================================
 *  IMAGE SLOTS — every image the site renders, section by section
 * ============================================================================
 *  This is the document the dashboard edits and the page reads. It exists so
 *  the owner never has to touch a component to change a picture: upload the
 *  file to GitHub, paste its path into the matching slot, set how it should
 *  behave, save.
 *
 *  A section is one part of the page (the hero plane, The Archive, the live
 *  project cards). Every section holds exactly `SLOTS_PER_SECTION` numbered
 *  slots — 01 … 09 — and a slot is one picture in that section.
 *
 *  A slot renders one of two ways:
 *
 *    a still   `src` is an image path (repo-relative, absolute or full URL)
 *    a film    `film` is a numbered folder of frames, scrubbed by scroll —
 *              the same mechanic the hero's opening run uses, so a slot can
 *              hold a 3D scroll animation instead of a flat picture
 *
 *  Everything else on a slot is a property the dashboard exposes:
 *  `animation` (how the picture moves), `opacity`, `blur` (a soft, blurred
 *  copy of the picture behind the frame), `background` (the colour behind it),
 *  `width` / `height` (how big the frame is) and the crop trio — `zoom`,
 *  `posX` / `posY` — which enlarge the picture inside its frame and pick which
 *  part of it survives the crop. The Studio tab edits those same fields, so a
 *  picture can be cropped from either place.
 *
 *  Defaults below are the committed source of truth; `src/lib/siteData.ts`
 *  layers the owner's edits on top and keeps them in this browser, plus on the
 *  shared backend when one is configured.
 * ============================================================================
 */

const base = import.meta.env.BASE_URL;

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type ImageSectionId = "hero" | "story" | "archive" | "projects";

/**
 * How the picture behaves.
 *
 *   film       the frame's run is scrubbed by scroll (needs a `film`)
 *   reveal     clip-mask open + blur-to-sharp as it enters
 *   parallax   gentle vertical drift while it crosses the screen
 *   zoom       slow push-in as it crosses the screen
 *   fade       plain fade-in
 *   still      no motion at all
 */
export type SlotAnimation = "film" | "reveal" | "parallax" | "zoom" | "fade" | "still";

/** A numbered frame run: `dir/000.jpg`, `001.jpg`, … (zero-padded to 3). */
export type SlotFilm = {
  dir: string;
  count: number;
  ext: "jpg" | "jpeg" | "webp" | "png" | "avif";
};

export type ImageSlot = {
  /** Stable id: `archive-04`. */
  id: string;
  section: ImageSectionId;
  /** 1 … `SLOTS_PER_SECTION`. */
  index: number;
  /** Still image path. Empty means the slot has no picture of its own. */
  src: string;
  /** Scroll-scrubbed frame run, or null for a plain still. */
  film: SlotFilm | null;
  caption: string;
  alt: string;
  animation: SlotAnimation;
  /** 0.2 … 1 — how strongly the picture itself is drawn. */
  opacity: number;
  /** 0 … 24 px — the blurred copy behind the frame. */
  blur: number;
  /** CSS colour painted behind the frame. Empty means "theme default". */
  background: string;
  /** 20 … 100 — the frame's width as a percentage of its column. */
  width: number;
  /** 0 = keep the section's own aspect ratio, otherwise a pixel height. */
  height: number;
  /**
   * 1 … 4 — how far the picture is enlarged inside its frame. Past 1 the frame
   * crops: this is the “enlarge” half of the Studio's crop controls, and it
   * applies to stills and to scroll films alike.
   */
  zoom: number;
  /** 0 … 100 — which part of the picture survives the crop, across. 50 = centre. */
  posX: number;
  /** 0 … 100 — and down. */
  posY: number;
  /** 0 … 64 px — rounded corners on the frame. */
  radius: number;
  /** Which part of the run this slot plays, 0 … 1. `filmFrom` < `filmTo`. */
  filmFrom: number;
  filmTo: number;
  /** Off slots render nothing at all. */
  enabled: boolean;
};

export type ImageSection = {
  id: ImageSectionId;
  label: string;
  /** One line for the dashboard, saying what the section is. */
  hint: string;
  /** Where these slots actually appear on the page. */
  usage: string;
};

/* -------------------------------------------------------------------------- */
/*  Sections                                                                  */
/* -------------------------------------------------------------------------- */

export const SLOTS_PER_SECTION = 9;

export const IMAGE_SECTIONS: ImageSection[] = [
  {
    id: "hero",
    label: "Hero",
    hint: "The planes behind the opening film.",
    usage:
      "Slot 01 is the artwork sitting behind the hero's film — the defocused backdrop plane. Give it a path, a blur and an opacity; the hero's own scroll choreography still drives it, so this one deliberately has no separate animation. The other slots are free for later use.",
  },
  {
    id: "story",
    label: "Studio",
    hint: "The tall picture beside “How I Work”.",
    usage:
      "Slot 01 fills the frame beside the Approach copy. Give it a picture, a scroll film or both, pick an animation, and set its size — the rest of the slots are free for later use.",
  },
  {
    id: "archive",
    label: "The Archive",
    hint: "Everything in the frames section — the big stills and the scroll films.",
    usage:
      "Slots 01–03 fill the three wide frames. Slots 04–09 are the tiles below them and start empty: paste a picture's path into one, or give it a folder of frames and it plays as a scroll film instead.",
  },
  {
    id: "projects",
    label: "Featured work",
    hint: "The preview image on each live project card, in card order.",
    usage:
      "Slot 01 styles the first live project card, slot 02 the second, and so on. Leave a slot off and the card keeps the image set in the Projects tab.",
  },
];

export const ANIMATION_LABELS: Record<SlotAnimation, string> = {
  film: "Scroll film — the run scrubs as the frame passes",
  reveal: "Reveal — mask opens and the blur sharpens",
  parallax: "Parallax — drifts while it crosses the screen",
  zoom: "Zoom — slow push-in",
  fade: "Fade in",
  still: "Still — no motion",
};

export const ANIMATION_ORDER: SlotAnimation[] = [
  "film",
  "reveal",
  "parallax",
  "zoom",
  "fade",
  "still",
];

/** `archive-04` */
export function slotId(section: ImageSectionId, index: number): string {
  return `${section}-${String(index).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/*  Defaults                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Where a slot starts when it is switched to a film. Nothing on the site ships
 * a film by default — this points at the folder the asset workflow reserves for
 * a run (`public/assets/sequence/`), and the shelf of frames you upload
 * replaces it. Frames are read as `folder/000.jpg` … — zero-padded to three
 * digits, starting at 000.
 */
export const defaultFilm: SlotFilm = { dir: `${base}assets/sequence`, count: 120, ext: "webp" };

function slot(
  section: ImageSectionId,
  index: number,
  values: Partial<ImageSlot> = {},
): ImageSlot {
  return {
    id: slotId(section, index),
    section,
    index,
    src: "",
    film: null,
    caption: "",
    alt: "",
    animation: "reveal",
    opacity: 1,
    blur: 0,
    background: "",
    width: 100,
    height: 0,
    zoom: 1,
    posX: 50,
    posY: 50,
    radius: 0,
    filmFrom: 0,
    filmTo: 1,
    enabled: false,
    ...values,
  };
}

const archiveSlots: ImageSlot[] = [
  // 01 — 03: the three wide stills from the repo's `Archive Images` folder.
  ...archiveImages.map((image, i) =>
    slot("archive", i + 1, {
      src: image.src,
      caption: image.caption,
      alt: image.alt,
      animation: "reveal",
      enabled: true,
    }),
  ),
  // 04 — 09: the grid, deliberately empty. It used to be filled with a flat
  // placeholder vector, then with a scroll film of a render that read as a dark
  // smudge at tile size; both were worse than showing nothing. The slots are
  // wired and ready — a path or a film folder from the dashboard fills one.
  ...Array.from({ length: 6 }, (_, i) => slot("archive", i + 4, { animation: "reveal" })),
];

/*
 * The Studio band starts with NO picture. It carried the 3D-website render
 * for a while, which put a large dark render immediately under the hero — two
 * dark pictures in a row, and the second one had not been asked for. Slot 01
 * is wired and empty: paste a path into it from #/admin → Images (or from the
 * Studio tab) and it appears beside the copy, at the size and crop you set.
 * See `StorySection`, which lays the copy out full width while it is empty.
 */
const storySlots: ImageSlot[] = Array.from({ length: SLOTS_PER_SECTION }, (_, i) =>
  slot("story", i + 1),
);

const heroSlots: ImageSlot[] = Array.from({ length: SLOTS_PER_SECTION }, (_, i) =>
  i === 0
    ? slot("hero", 1, {
      src: `${base}assets/hero-shadow.svg`,
      caption: "Hero backdrop",
      alt: "",
      animation: "still",
      opacity: 0.3,
      blur: 22,
      enabled: true,
    })
    : slot("hero", i + 1),
);

const projectSlots: ImageSlot[] = Array.from({ length: SLOTS_PER_SECTION }, (_, i) =>
  slot("projects", i + 1, { caption: `Card ${String(i + 1).padStart(2, "0")}` }),
);

export const imageSlotDefaults: ImageSlot[] = [
  ...heroSlots,
  ...storySlots,
  ...archiveSlots,
  ...projectSlots,
];

/** The nine slots of one section, in order, always nine long. */
export function defaultSlotsFor(section: ImageSectionId): ImageSlot[] {
  return imageSlotDefaults
    .filter((entry) => entry.section === section)
    .map((entry) => ({ ...entry, film: entry.film ? { ...entry.film } : null }));
}

/** Every default slot, keyed by id, for normalising an edited document. */
export function defaultSlotMap(): Map<string, ImageSlot> {
  const map = new Map<string, ImageSlot>();
  imageSlotDefaults.forEach((entry) => map.set(entry.id, entry));
  return map;
}
