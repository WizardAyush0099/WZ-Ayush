import { useMemo } from "react";
import { archiveSection } from "../../data/content";
import type { ImageSlot } from "../../data/imageSlots";
import { useImageSlots } from "../../lib/siteData";
import { useStoredImages } from "../../lib/imageStore";
import { RevealText } from "../common/Reveal";
import { useLightbox } from "../common/Lightbox";
import SharinganMark from "../theme/SharinganMark";
import SlotMedia from "../media/SlotMedia";
import CursorTrail from "../fx/CursorTrail";
import { frameUrlIn } from "../media/frameRun";

/**
 * ============================================================================
 *  THE ARCHIVE — the frames
 * ============================================================================
 *  What is here, in order:
 *
 *    1. the section's statement, with the house mark beside it. The mark is the
 *       small vector Sharingan from the theme control, turning with the page as
 *       the visitor scrolls (see `useScrollSpin`).
 *    2. slots 01–03 of the Archive's image manager — the three wide stills from
 *       the repo's `Archive Images` folder.
 *    3. any remaining slots that are switched on, in a uniform grid. They start
 *       empty on purpose: the sharingan render that used to fill them read as a
 *       dark smudge at tile size, so the grid waits for the owner's own
 *       pictures instead of filling itself with something nobody wanted.
 *
 *  Every frame here is a slot: the picture, the animation, the opacity, the
 *  blurred backdrop, the colour behind it and its size all come from
 *  `#/admin` → **Images** (see src/data/imageSlots.ts). Nothing in this file
 *  hard-codes a path, so adding a frame is pasting a GitHub path into the
 *  matching slot and pressing save. A slot can hold a still or a scroll film.
 *
 *  The live deployments are NOT here — they have their own section directly
 *  below (`LiveProjects`), so this one is only ever about pictures.
 * ============================================================================
 */

/** What the lightbox shows for a slot: its still, or its film's first frame. */
function stillOf(slot: ImageSlot): { src: string; alt: string; caption: string } {
  return {
    src: slot.src || (slot.film ? frameUrlIn(slot.film, 0) : ""),
    alt: slot.alt || slot.caption,
    caption: slot.caption || `Slot ${String(slot.index).padStart(2, "0")}`,
  };
}

export default function GallerySection() {
  const { open } = useLightbox();
  const slots = useImageSlots("archive");
  const { images } = useStoredImages();

  /**
   * Slots 01–03 are the wide frames; 04–09 (and anything the owner enables
   * beyond them) are the grid tiles.
   */
  const wide = useMemo(() => slots.filter((slot) => slot.index <= 3), [slots]);
  const tiles = useMemo(() => slots.filter((slot) => slot.index > 3), [slots]);

  /**
   * Quick images added from the dashboard this device — they render in front of
   * the tiles, so the site visibly changes the moment something is uploaded.
   */
  const uploaded = useMemo(
    () => images.map((image) => ({ src: image.dataUrl, alt: image.caption, caption: image.caption })),
    [images],
  );

  /** One list in page order, so "next" in the lightbox walks the section. */
  const stills = useMemo(
    () => [...wide.map(stillOf), ...uploaded, ...tiles.map(stillOf)],
    [wide, tiles, uploaded],
  );

  /**
   * What the cursor trail plays: only the wide frames, and only ones that
   * actually have a picture — a ghost of an empty slot would be a grey box
   * chasing the pointer.
   */
  const trailFrames = useMemo(
    () => wide.map(stillOf).filter((frame) => Boolean(frame.src)),
    [wide],
  );

  const gridCount = tiles.length + uploaded.length;

  return (
    <section
      id="gallery"
      data-tune="sec-archive"
      className="relative z-10 bg-ink-950 py-24 md:py-32 lg:py-40"
      aria-labelledby="gallery-title"
    >
      <div className="shell">
        <div data-tune="item-archive-head">
        <RevealText stagger className="flex flex-col gap-5">
          <span className="eyebrow">{archiveSection.eyebrow}</span>
          <h2 id="gallery-title" className="display text-[12vw] leading-[0.9] sm:text-6xl lg:text-7xl">
            {archiveSection.title}
          </h2>
          <p className="max-w-[54ch] font-body text-base text-bone-muted">
            {archiveSection.lede}
          </p>
        </RevealText>
        </div>

        {/* — Tier 1: the statement, the mark turning with the page. — */}
        <div
          data-tune="item-archive-statement"
          className="mt-14 border-t border-bone/10 pt-8 md:mt-20"
        >
          <div className="flex items-center gap-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-bone/15 bg-ink-900">
              <SharinganMark className="h-[22px] w-[22px]" />
            </span>
            <span className="font-body text-[10px] uppercase tracking-cinematic text-blood-400/80">
              {archiveSection.sequenceLabel}
            </span>
          </div>
          <h3 className="display mt-5 text-3xl leading-tight text-bone sm:text-4xl">
            {archiveSection.sequenceTitle}
          </h3>
          <p className="mt-3 max-w-[52ch] font-body text-base leading-relaxed text-bone-muted">
            {archiveSection.sequenceBody}
          </p>
        </div>

        {/* — Tier 2: the wide frames, one row, identical frames. — */}
        <div className="mt-16 flex flex-wrap items-baseline justify-between gap-3 border-t border-bone/10 pt-6 md:mt-24">
          <span className="font-body text-[10px] uppercase tracking-cinematic text-blood-500/80">
            {archiveSection.framesLabel} · {String(wide.length).padStart(2, "0")}
          </span>
          <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            {archiveSection.framesNote}
          </span>
        </div>

        <div
          data-tune="item-archive-wide"
          className="relative mt-8 grid grid-cols-12 gap-4 sm:gap-6 md:gap-x-8"
        >
          {/* Moving across the row throws fading copies of these frames behind
              the pointer — the trail reads the frame under the cursor. */}
          <CursorTrail frames={trailFrames} />

          {wide.map((slot, i) => (
            <figure key={slot.id} className="group col-span-12 sm:col-span-4">
              <button
                type="button"
                data-trail-frame={i}
                onClick={() => open(stills, i)}
                data-sfx="open"
                data-cursor="media"
                data-cursor-label="View"
                aria-label={`Open ${slot.caption || "this frame"} full-screen`}
                className="relative block w-full text-left"
              >
                <SlotMedia
                  slot={slot}
                  aspect="aspect-[16/9]"
                  className="border border-bone/10"
                  mediaClassName="transition-transform duration-[1400ms] ease-silk group-hover:scale-[1.04]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/55 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              </button>
              <figcaption className="mt-3 flex items-baseline justify-between gap-3 font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                <span className="truncate text-bone-muted transition-colors duration-500 group-hover:text-bone">
                  {slot.caption || `Slot ${String(slot.index).padStart(2, "0")}`}
                </span>
                <span className="shrink-0 text-blood-500/70">
                  {String(slot.index).padStart(2, "0")}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* — Tier 3: whatever else is switched on, tiles of one size. — */}
        <div className="mt-16 flex flex-wrap items-baseline justify-between gap-3 border-t border-bone/10 pt-6 md:mt-24">
          <span className="font-body text-[10px] uppercase tracking-cinematic text-blood-500/80">
            {archiveSection.stillsLabel} · {String(gridCount).padStart(2, "0")}
          </span>
          <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            {archiveSection.framesNote}
          </span>
        </div>

        {gridCount === 0 ? (
          <p className="mt-8 border border-bone/10 bg-ink-900 px-5 py-6 font-body text-sm leading-relaxed text-bone-muted">
            Slots 04–09 are ready and empty. Open{" "}
            <span className="text-bone">#/admin</span> → <span className="text-bone">Images</span> →{" "}
            <span className="text-bone">The Archive</span>, paste a picture's path — or point a slot
            at a folder of frames to have it play as a scroll film — and it appears here.
          </p>
        ) : (
          <div
            data-tune="item-archive-grid"
            className="mt-8 grid grid-cols-12 gap-4 sm:gap-6 md:gap-x-8 md:gap-y-10"
          >
            {uploaded.map((image, i) => (
              <div key={`upload-${image.caption}-${i}`} className="group col-span-12 sm:col-span-4">
                <div className="relative">
                  <div className="relative aspect-[4/5] w-full overflow-hidden border border-bone/10">
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-[1400ms] ease-silk group-hover:scale-105"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => open(stills, wide.length + i)}
                    data-sfx="open"
                    data-cursor="media"
                    data-cursor-label="View"
                    className="absolute inset-0 z-10"
                    aria-label={`Open ${image.caption} full-screen`}
                  />
                  <span className="pointer-events-none absolute left-3 top-3 z-20 border border-blood-600/60 bg-ink-950/80 px-2 py-1 font-body text-[9px] uppercase tracking-wide2 text-blood-300 backdrop-blur-sm">
                    New
                  </span>
                </div>
                <span className="mt-3 flex items-center justify-between font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                  <span className="truncate transition-colors duration-500 group-hover:text-bone">
                    {image.caption}
                  </span>
                </span>
              </div>
            ))}

            {tiles.map((slot, i) => (
              <div key={slot.id} className="group col-span-12 sm:col-span-4">
                <div className="relative">
                  <SlotMedia
                    slot={slot}
                    className="w-full border border-bone/10"
                    mediaClassName="transition-transform duration-[1400ms] ease-silk group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() => open(stills, wide.length + uploaded.length + i)}
                    data-sfx="open"
                    data-cursor="media"
                    data-cursor-label="View"
                    className="absolute inset-0 z-10"
                    aria-label={`Open ${slot.caption} full-screen`}
                  />
                </div>
                <span className="mt-3 flex items-center justify-between font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                  <span className="truncate transition-colors duration-500 group-hover:text-bone">
                    {slot.caption || `Slot ${String(slot.index).padStart(2, "0")}`}
                  </span>
                  <span className="text-blood-500/70">{String(slot.index).padStart(2, "0")}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
