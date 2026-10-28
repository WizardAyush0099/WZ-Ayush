import { useEffect, useState } from "react";
import { useMediaQuery } from "../../lib/hooks";
import { linkTo } from "../../lib/router";
import StickerBadge from "./StickerBadge";

/**
 * ============================================================================
 *  STICKY STICKER — the seal that follows the visitor down the page
 * ============================================================================
 *  Once the opening film has passed, a round sticker parks itself in the
 *  bottom-left corner and stays there: the studio's seal, turning slowly, with
 *  the one action the page is for at its centre. It is the closest thing this
 *  site has to a "house mark", and it is the same thing a good shop does with a
 *  wax seal on the door — presence without taking up the wall.
 *
 *  The rules it keeps:
 *
 *    after the hero   it never appears over the film. It fades in a screen
 *                     later, when the visitor is already reading.
 *    before the end   it gets out of the way as the closing call approaches, so
 *                     it can never sit on top of the thing it is advertising.
 *    desktop only     a fixed 104px disc on a phone is a corner of the screen
 *                     spent forever; below `lg` it does not render at all.
 *    one transform    the fade and the lift are the only animated properties,
 *                     both composited, so it costs nothing while you scroll.
 * ============================================================================
 */
export default function StickySticker() {
  const wide = useMediaQuery("(min-width: 1024px)");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!wide) {
      setVisible(false);
      return;
    }

    let raf = 0;

    const update = () => {
      raf = 0;
      const rest = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      // In the body of the page, but not while the closing panel is on screen.
      setVisible(window.scrollY > window.innerHeight * 1.1 && rest > 420);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [wide]);

  if (!wide) return null;

  return (
    <div
      className={`fixed bottom-7 left-7 z-[70] transition-[opacity,transform] duration-700 ease-silk ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <a
        href={linkTo("/builder")}
        data-cursor="hover"
        aria-label="Start a project"
        className="group grid place-items-center rounded-full bg-ink-950/55 backdrop-blur-sm transition-colors duration-500 ease-silk hover:bg-ink-900/70"
      >
        <StickerBadge
          text="START A PROJECT · WZ STUDIO · SINCE 2024 · "
          size={104}
          durationS={22}
          className="text-bone/50 transition-colors duration-500 group-hover:text-blood-300"
        >
          <span className="display text-[15px] tracking-[0.08em] text-bone transition-transform duration-500 ease-silk group-hover:-translate-y-0.5">
            WZ
          </span>
          <span
            aria-hidden="true"
            className="mt-0.5 text-[13px] leading-none text-blood-400 transition-transform duration-500 ease-silk group-hover:translate-x-0.5"
          >
            ↗
          </span>
        </StickerBadge>
      </a>
    </div>
  );
}
