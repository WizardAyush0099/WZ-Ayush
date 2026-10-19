import { useEffect, useRef, useState } from "react";
import { pointOf } from "../../lib/studio";

/**
 * ============================================================================
 *  PICK MODE — point at anything on the page and select it in the dashboard
 * ============================================================================
 *  The Studio tab shows the real site in a frame, and this is how it knows
 *  which element the owner means: with `?pick=1` in the URL, every point on the
 *  page (anything carrying `data-tune`) picks itself out under the pointer and
 *  is outlined, and tapping one posts its id to the dashboard.
 *
 *  It is a URL flag rather than a build-time switch, and it is read once on
 *  mount, so a visitor never sees it and the published site never pays for it.
 *  Nothing here touches the page's own interactivity: the outline is
 *  `pointer-events-none`, and the tap is captured before any link or button
 *  underneath can act on it.
 * ============================================================================
 */

type Outline = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function pointLabel(id: string): string {
  return pointOf(id)?.label ?? id.replace(/^(sec|item|slot|stage)-/, "");
}

export default function PickMode() {
  const [outline, setOutline] = useState<Outline | null>(null);
  const lastRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const enabled = new URLSearchParams(window.location.search).has("pick");
    if (!enabled) return;

    const root = document.documentElement;
    root.classList.add("studio-picking");

    const hit = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof Element)) return null;
      const el = target.closest("[data-tune]");
      return el instanceof HTMLElement ? el : null;
    };

    const measure = (id: string, element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      setOutline({
        id,
        label: pointLabel(id),
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
    };

    const onMove = (event: PointerEvent) => {
      const element = hit(event.target);
      lastRef.current = element;
      const id = element?.dataset.tune;
      if (!element || !id) {
        setOutline(null);
        return;
      }
      measure(id, element);
    };

    const onClick = (event: MouseEvent) => {
      const element = hit(event.target);
      const id = element?.dataset.tune;
      if (!element || !id) return;
      // The tap is the owner picking a point, never a navigation.
      event.preventDefault();
      event.stopPropagation();
      window.parent?.postMessage({ source: "wz-studio", type: "pick", id }, "*");
      measure(id, element);
    };

    // The dashboard can ask this frame to walk itself to a point.
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { source?: string; type?: string; id?: string } | null;
      if (!data || data.source !== "wz-studio-host") return;
      if (data.type !== "scrollTo" || !data.id) return;
      const element = document.querySelector<HTMLElement>(`[data-tune="${data.id}"]`);
      if (!element) return;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      lastRef.current = element;
    };

    // A scroll moves everything the outline is drawn against, so it is dropped
    // rather than left hanging in the wrong place; the next pointer move draws
    // it again.
    const onScroll = () => setOutline(null);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("click", onClick, true);
    window.addEventListener("message", onMessage);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      root.classList.remove("studio-picking");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!outline) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-[97]"
      style={{
        left: outline.x,
        top: outline.y,
        width: outline.width,
        height: outline.height,
      }}
    >
      <span className="absolute inset-0 border border-blood-500/80 bg-blood-500/5" />
      <span className="absolute left-0 top-0 -translate-y-full whitespace-nowrap bg-blood-600 px-2 py-1 font-mono text-[10px] tracking-wide text-bone">
        {outline.label} · {outline.id}
      </span>
    </div>
  );
}
