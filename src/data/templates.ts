import type { ThemeId } from "../lib/theme";

/**
 * ============================================================================
 *  TEMPLATE LIBRARY — six complete websites, written as real HTML
 * ============================================================================
 *  These are not generated miniatures. Each entry points at a full,
 *  self-contained page the visitor can open and actually browse:
 *
 *      public/templates/architect.html   →  /templates/architect.html
 *      public/templates/bakery.html      →  /templates/bakery.html
 *      … (burger, cafe, cleaning, clothing)
 *
 *  The pages live in `public/` so they ship as static files — the same build
 *  works at the domain root, under a GitHub Pages sub-path and in the preview.
 *  To add a seventh template, drop the HTML file in `public/templates/` and
 *  add one entry below; every surface (homepage reel, builder library, brief
 *  step 3, full-page route) picks it up from here.
 *
 *  Opening one: every block and card links to `/#/template/<id>`, which hosts
 *  the page full-screen in an iframe with the commission actions above it.
 * ============================================================================
 */

const base = import.meta.env.BASE_URL;

export type SiteTemplate = {
  /** File stem in `public/templates/` — also the route id. */
  id: string;
  /** Brand name shown on the card, as the template itself spells it. */
  name: string;
  /** Trade the site is drawn for — "Architecture", "Bakery", "Fashion". */
  category: string;
  business: string;
  blurb: string;
  /** Site palette applied live when this template is chosen. */
  theme: ThemeId;
  features: string[];
  /** Public path of the shipped HTML page. */
  href: string;
};

export const templates: SiteTemplate[] = [
  {
    id: "architect",
    name: "Atelier Structura",
    category: "Architecture Studio",
    business: "Architecture",
    blurb:
      "A dark, editorial studio site — projects, services and an approach page built around structure, light and long-form photography.",
    theme: "graphite",
    features: ["Project index", "Studio approach", "Enquiry flow", "Scroll motion", "Lightbox plates"],
    href: `${base}templates/architect.html`,
  },
  {
    id: "bakery",
    name: "Crumb & Co.",
    category: "Artisan Bakery",
    business: "Bakery",
    blurb:
      "A luxury bakery in warm paper tones — pastry photography, a menu that reads like a lookbook and a location that finds you.",
    theme: "amber",
    features: ["Menu & bakes", "Store location", "Order enquiry", "Scroll motion", "Lightbox bakes"],
    href: `${base}templates/bakery.html`,
  },
  {
    id: "burger",
    name: "Ember & Crust",
    category: "Woodfire Grill",
    business: "Restaurant",
    blurb:
      "A smoky grill site — hearth-fired photography, the full menu and a reservation call that never leaves the scroll.",
    theme: "crimson",
    features: ["Full menu", "Table booking", "Chef & story", "Scroll motion", "Lightbox dishes"],
    href: `${base}templates/burger.html`,
  },
  {
    id: "cafe",
    name: "Velvet Brew",
    category: "Café & Roastery",
    business: "Café",
    blurb:
      "A slow café — the roastery story, the coffee list and a reserve-a-table close, all in warm neutrals and quiet type.",
    theme: "warm",
    features: ["Coffee list", "Reserve a table", "Roastery story", "Scroll motion", "Lightbox pours"],
    href: `${base}templates/cafe.html`,
  },
  {
    id: "cleaning",
    name: "PureSpace Cleaning Co.",
    category: "Home Services",
    business: "Cleaning",
    blurb:
      "A bright, trustworthy service site — services grid, proof up front and a quote request that takes one screen.",
    theme: "daylight",
    features: ["Services grid", "Instant quote", "Trust & proof", "Scroll motion", "Before/after lightbox"],
    href: `${base}templates/cleaning.html`,
  },
  {
    id: "clothing",
    name: "Void Theory",
    category: "Fashion Label",
    business: "Fashion",
    blurb:
      "A monochrome streetwear label — lookbook grids, drop-ready collections and an editorial voice that stays out of the way.",
    theme: "midnight",
    features: ["Lookbook grid", "Collections", "Drop launch", "Scroll motion", "Lightbox lookbook"],
    href: `${base}templates/clothing.html`,
  },
];

/** Copy for the library section on /#/builder. */
export const templatesSection = {
  eyebrow: "Build My Website",
  title: "Six Starting Points",
  lede:
    "Six complete websites — an architecture studio, an artisan bakery, a woodfire grill, a café, a cleaning company and a fashion label. Open any one full size, pick the closest, and I'll build yours from it.",
} as const;

export function templateById(id: string): SiteTemplate | undefined {
  return templates.find((t) => t.id === id);
}
