import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getLenis } from "../../lib/scroll";
import { usePrefersReducedMotion } from "../../lib/hooks";

export type LightboxItem = { src: string; alt: string; caption?: string };

type LightboxContextValue = {
  open: (items: LightboxItem[], index?: number) => void;
};

const LightboxContext = createContext<LightboxContextValue>({ open: () => {} });

export const useLightbox = () => useContext(LightboxContext);

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<LightboxItem[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const reduced = usePrefersReducedMotion();

  const open = useCallback((next: LightboxItem[], startIndex = 0) => {
    if (!next.length) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    setItems(next);
    setIndex(Math.max(0, Math.min(startIndex, next.length - 1)));
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => {
      setItems([]);
      lastFocused.current?.focus?.();
    }, reduced ? 0 : 340);
  }, [reduced]);

  const step = useCallback(
    (dir: number) => setIndex((i) => (items.length ? (i + dir + items.length) % items.length : 0)),
    [items.length],
  );

  // Lock scroll + keyboard controls while open.
  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";
    getLenis()?.stop();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab") {
        // Keep focus inside the dialog.
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => closeRef.current?.focus(), 60);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      getLenis()?.start();
    };
  }, [visible, close, step]);

  const current = items[index];
  const multi = items.length > 1;

  const value = useMemo(() => ({ open }), [open]);

  return (
    <LightboxContext.Provider value={value}>
      {children}
      {items.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current?.caption ?? "Image viewer"}
          className={`fixed inset-0 z-[85] flex items-center justify-center transition-opacity duration-300 ease-silk ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-ink-950/95 backdrop-blur-md" onClick={close} />

          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close image viewer"
            className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors duration-300 hover:border-blood-500/70 sm:right-8 sm:top-8"
          >
            <span className="relative block h-4 w-4">
              <span className="absolute left-1/2 top-1/2 block h-px w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />
              <span className="absolute left-1/2 top-1/2 block h-px w-4 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current" />
            </span>
          </button>

          <figure
            className="relative z-[1] mx-4 max-h-[86svh] w-full max-w-5xl transition-transform duration-500 ease-silk"
            style={{ transform: visible ? "scale(1)" : "scale(0.94)" }}
          >
            <img
              key={current?.src}
              src={current?.src}
              alt={current?.alt ?? ""}
              className="mx-auto max-h-[78svh] w-auto max-w-full object-contain shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
            />
            <figcaption className="mt-5 flex items-center justify-between gap-4 font-body text-[11px] uppercase tracking-wide2 text-bone-dim">
              <span>{current?.caption}</span>
              {multi && (
                <span>
                  {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                </span>
              )}
            </figcaption>
          </figure>

          {multi && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors duration-300 hover:border-blood-500/70 sm:left-8"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-bone/20 text-bone transition-colors duration-300 hover:border-blood-500/70 sm:right-8"
              >
                →
              </button>
            </>
          )}
        </div>
      )}
    </LightboxContext.Provider>
  );
}
