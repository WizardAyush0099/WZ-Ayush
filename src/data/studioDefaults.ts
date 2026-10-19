import type { StudioDoc } from "../lib/studio";

/**
 * ============================================================================
 *  STUDIO DEFAULTS — the committed document
 * ============================================================================
 *  What the site ships with, before anyone has opened the dashboard. It is a
 *  partial document on purpose: anything left out falls back to the defaults in
 *  `src/lib/studio.ts`, so an empty object here means “the design as committed”.
 *
 *  To make a session's work permanent for every hosting target — with no
 *  backend involved — open `#/admin → Studio → Document`, press **Copy the
 *  document**, and paste the `studioDefaults` value of that JSON in here.
 *
 *  Shape:
 *
 *    boxes    per point, only the values that differ from the defaults:
 *             `{ "sec-story": { "on": true, "zoom": 1.2, "width": 90, … } }`
 *             Keys are the `data-tune` ids printed by the Studio tab.
 *    hidden   sections switched off entirely: `["themes"]`
 *    order    the page's sections, in the order they render
 *    stages   the 3D runs: frame folder, window, speed, size, anchor
 *    motion   the speeds of the built-in choreography
 *    effects  one switch per atmosphere layer
 * ============================================================================
 */
export const studioDefaults: Partial<StudioDoc> = {};
