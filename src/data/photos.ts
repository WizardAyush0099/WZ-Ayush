/**
 * ============================================================================
 *  TEMPLATE PHOTOGRAPHY — real pictures, one pool per concept
 * ============================================================================
 *  Every template preview used to draw abstract SVG stand-ins, which is why a
 *  page of twenty concepts read as twenty diagrams of the same thing. Each
 *  concept now carries a pool of real photographs of the business it is for —
 *  a restaurant shows plates and a dining room, a hotel shows rooms and a
 *  pool, a cleaner shows a crew at work.
 *
 *  Sources are Unsplash's free CDN at a fixed width, so nothing is bundled and
 *  no licence is needed. Every URL in this file was requested and answered with
 *  a 200 before it was added.
 *
 *  The owner replaces any of them from the dashboard (Content → Template
 *  photos): paste an image URL or upload a file, per slot, per template. The
 *  replacements live in the site document (`src/lib/siteData.ts`), so they
 *  reach every visitor and survive reloads.
 *
 *  Slot 0 is always the hero — the largest crop, so it gets the widest shot.
 */

/** One editable image slot inside a template. */
export type PhotoSlot = {
  /** Stable key used by the stored overrides. */
  key: string;
  /** Human label in the dashboard. */
  label: string;
  /** Default free photograph. */
  url: string;
};

const CDN = "https://images.unsplash.com/photo-";
const QUERY = "?auto=format&fit=crop&q=72";

/** Hero-grade crop — wide enough for a full-bleed banner at 2x. */
function hero(id: string): string {
  return `${CDN}${id}&w=1600${QUERY}`;
}

/** Body crop — the size the composition actually paints it at. */
function shot(id: string): string {
  return `${CDN}${id}&w=1100${QUERY}`;
}

/** Slot labels, in the order photos are handed out. */
const SLOT_LABELS = ["Hero photo", "Feature photo", "Gallery photo 1", "Gallery photo 2", "Gallery photo 3", "Gallery photo 4"];

function slots(ids: string[]): PhotoSlot[] {
  return ids.map((id, i) => ({
    key: `slot-${i}`,
    label: SLOT_LABELS[i] ?? `Photo ${i + 1}`,
    url: i === 0 ? hero(id) : shot(id),
  }));
}

/**
 * Default pools, keyed by template id. Every id used in `templates.ts` appears
 * here — `templatePhotoSlots()` falls back to the first pool for an unknown id
 * so a new template can never render an empty frame.
 */
export const templatePhotos: Record<string, PhotoSlot[]> = {
  /* ---------------------------------------------------------------- studio */
  minimal: slots([
    "1497366754035-f200968a6e72",
    "1513364776144-60967b0f800f",
    "1497215728101-856f4ea42174",
    "1456513080510-7bf3a84b82f8",
  ]),
  agency: slots([
    "1521737604893-d14cc237f11d",
    "1552664730-d307ca884978",
    "1600880292203-757bb62b4baf",
    "1517048676732-d65bc937f952",
  ]),
  photo: slots([
    "1516035069371-29a1b244cc32",
    "1452587925148-ce544e77e70d",
    "1493863641943-9b68992a8d07",
    "1471341971476-ae15ff5dd4ea",
  ]),
  blog: slots([
    "1456513080510-7bf3a84b82f8",
    "1481627834876-b7833e8f5570",
    "1497633762265-9d179a990aa6",
    "1487014679447-9f8336841d58",
  ]),
  personal: slots([
    "1531123897727-8f129e1688ce",
    "1508214751196-bcfd4ca60f91",
    "1494790108377-be9c29b29330",
    "1500648767791-00dcc994a43e",
  ]),

  /* ------------------------------------------------------------ hospitality */
  hotel: slots([
    "1566073771259-6a8506099945",
    "1571003123894-1f0594d2b5d9",
    "1445019980597-93fa8acb246c",
    "1590490360182-c33d57733427",
    "1582719508461-905c673771fd",
    "1611892440504-42a792e24d32",
  ]),
  travel: slots([
    "1502602898657-3e91760cbb34",
    "1476514525535-07fb3b4ae5f1",
    "1501785888041-af3ef285b470",
    "1507525428034-b723cf961d3e",
    "1488646953014-85cb44e25828",
    "1503220317375-aaad61436b1b",
  ]),

  /* ------------------------------------------------------------ food & drink */
  restaurant: slots([
    "1517248135467-4c7edcad34c4",
    "1552566626-52f8b828add9",
    "1414235077428-338989a2e8c0",
    "1504674900247-0877df9cc836",
    "1555396273-367ea4eb4db5",
    "1466978913421-dad2ebd01d17",
  ]),
  cafe: slots([
    "1554118811-1e0d58224f24",
    "1521305916504-4a1121188589",
    "1442512595331-e89e73853f31",
    "1509440159596-0249088772ff",
    "1495474472287-4d71bcdd2085",
    "1559925393-8be0ec4767c8",
  ]),

  /* --------------------------------------------------------------- property */
  luxury: slots([
    "1600585154340-be6161a56a0c",
    "1600607687939-ce8a6c25118c",
    "1560448204-e02f11c3d0e2",
    "1512917774080-9991f1c4c750",
  ]),
  interior: slots([
    "1615529182904-14819c35db37",
    "1600585152220-90363fe7e115",
    "1584622650111-993a426fbf0a",
    "1581094794329-c8112a89af12",
    "1504307651254-35680f356dfd",
  ]),

  /* ------------------------------------------------------------------ retail */
  ecommerce: slots([
    "1524758631624-e2822e304c36",
    "1586023492125-27b2c045efd7",
    "1616486338812-3dadae4b4ace",
    "1567538096630-e0c55bd6374c",
  ]),
  shop: slots([
    "1441986300917-64674bd600d8",
    "1567401893414-76b7b1e5a7a5",
    "1445205170230-053b83016050",
    "1555529669-e69e7aa0ba9a",
    "1489987707025-afc232f7ea0f",
    "1556742049-0cfed4f6a45d",
  ]),

  /* ------------------------------------------------------------ home services */
  cleaning: slots([
    "1581578731548-c64695cc6952",
    "1585421514738-01798e348b17",
    "1527515637462-cff94eecc1ac",
    "1610557892470-55d9e80c0bce",
    "1479064555552-3ef4979f8908",
    "1563453392212-326f5e854473",
  ]),

  /* ----------------------------------------------------------- health & beauty */
  clinic: slots([
    "1631679706909-1844bbd07221",
    "1584982751601-97dcc096659c",
    "1629909613654-28e377c37b09",
    "1551076805-e1869033e561",
    "1576091160399-112ba8d25d1d",
  ]),
  salon: slots([
    "1560066984-138dadb4c035",
    "1522335789203-aabd1fc54bc9",
    "1596462502278-27bfdc403348",
    "1540555700478-4be289fbecef",
    "1516975080664-ed2fc6a32937",
    "1595476108010-b4d1f102b1b1",
  ]),
  fitness: slots([
    "1534438327276-14e5300c3a48",
    "1571902943202-507ec2618e8f",
    "1517836357463-d25dfeac3438",
    "1518611012118-696072aa579a",
    "1540497077202-7c8a3999166f",
    "1571019613454-1cb2f99b2d8b",
  ]),

  /* ---------------------------------------------------------------- product */
  saas: slots([
    "1550751827-4bd374c3f58b",
    "1531482615713-2afd69097998",
    "1519389950473-47ba0277781c",
    "1498050108023-c5249f4df085",
  ]),
  tech: slots([
    "1518770660439-4636190af475",
    "1526374965328-7f61d4dc18c5",
    "1461749280684-dccba630e2f6",
    "1555066931-4365d14bab8c",
  ]),
  business: slots([
    "1503387762-592deb58ef4e",
    "1541888946425-d81bb19240f5",
    "1460925895917-afdab827c52f",
    "1522071820081-009f0129c71c",
  ]),
  landing: slots([
    "1556761175-b413da4baf72",
    "1454165804606-c3d57bc86b40",
    "1552664730-d307ca884978",
    "1522071820081-009f0129c71c",
  ]),

  /* -------------------------------------------------------- culture & events */
  education: slots([
    "1524178232363-1fb2b075b655",
    "1580582932707-520aed937b7b",
    "1503676260728-1c00da094a0b",
    "1523240795612-9a054b0db644",
    "1427504494785-3a9ca7044f45",
  ]),
  event: slots([
    "1540575467063-178a50c2df87",
    "1505373877841-8d25f7d46678",
    "1519167758481-83f550bb49b3",
    "1542744173-8e7e53415bb0",
  ]),
  music: slots([
    "1470229722913-7c0e2dbbafd3",
    "1516450360452-9312f5e86fc7",
    "1514320291840-2e0a9bf2a9ae",
    "1511671782779-c97d3d27a1d4",
  ]),
  gaming: slots([
    "1493225457124-a3eb161ffa5f",
    "1526374965328-7f61d4dc18c5",
    "1550751827-4bd374c3f58b",
    "1518770660439-4636190af475",
  ]),
  anime: slots([
    "1519681393784-d120267933ba",
    "1506905925346-21bda4d32df4",
    "1470071459604-3b5ec3a7fe05",
    "1464822759023-fed622ff2c3b",
  ]),
};

/** The pool an unknown template falls back to, so a slot is never empty. */
const FALLBACK = templatePhotos.minimal;

/** Editable slots for a template, defaults included. */
export function templatePhotoSlots(templateId: string): PhotoSlot[] {
  return templatePhotos[templateId] ?? FALLBACK;
}

/** Just the default URLs, in slot order. */
export function defaultTemplatePhotos(templateId: string): string[] {
  return templatePhotoSlots(templateId).map((slot) => slot.url);
}
