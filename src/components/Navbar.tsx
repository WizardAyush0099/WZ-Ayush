import { useEffect, useRef, useState } from "react";
import { hero, nav, meta } from "../data/content";
import { getLenis, resumeSmoothScroll, scrollToId } from "../lib/scroll";
import SoundToggle from "./SoundToggle";

export default function Navbar({ ready }: { ready: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");
  const [open, setOpen] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Solidify the bar once the hero starts scrolling past.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track the section currently in view.
  useEffect(() => {
    const sections = nav
      .map((n) => document.getElementById(n.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  /**
   * While the menu is open we lock scrolling. The cleanup ALWAYS releases the
   * lock again — otherwise Lenis keeps `overflow: clip` on <html> and the page
   * can never scroll, which is a far worse failure than an open menu.
   */
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    getLenis()?.stop();
    firstLinkRef.current?.focus();

    return () => {
      document.body.style.overflow = "";
      resumeSmoothScroll();
    };
  }, [open]);

  // Escape closes the menu (desktop / hardware keyboards).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Resizing up to desktop must dismiss the overlay, not strand it open.
  useEffect(() => {
    if (!open) return;
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mql.matches) setOpen(false);
    };
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [open]);

  const go = (id: string) => {
    const wasOpen = open;
    setOpen(false);
    // Let the overlay start closing (and scrolling unlock) before moving.
    window.setTimeout(() => scrollToId(id), wasOpen ? 260 : 0);
  };

  return (
    <>
      {/*
        The header sits ABOVE the mobile overlay (z-90 vs z-80) so the toggle
        button is always visible and tappable while the menu is open.
      */}
      <header
        className={`fixed inset-x-0 top-0 z-[90] transition-all duration-700 ease-silk ${
          scrolled || open
            ? "border-b border-bone/10 bg-ink-950/70 backdrop-blur-md"
            : "border-b border-transparent"
        }`}
        style={{ opacity: ready ? 1 : 0, transform: ready ? "translateY(0)" : "translateY(-14px)" }}
      >
        <div className="shell flex h-[72px] items-center justify-between">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              go("home");
            }}
            className="group relative z-10 flex items-baseline gap-2"
            aria-label={`${hero.title} — home`}
          >
            <span className="display text-lg tracking-[0.28em] text-bone transition-colors duration-300 group-hover:text-blood-400">
              {hero.title}
            </span>
            <span className="font-accent text-[10px] tracking-[0.3em] text-blood-500/70">{hero.accent}</span>
          </a>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
            {nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.id);
                }}
                className="group relative py-2 font-body text-[11px] font-medium uppercase tracking-wide2 text-bone-muted transition-colors duration-300 hover:text-bone"
                aria-current={active === item.id ? "true" : undefined}
              >
                {item.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-px bg-blood-500 transition-all duration-500 ease-silk ${
                    active === item.id ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </a>
            ))}
          </nav>

          <div className="relative z-10 flex items-center gap-5">
            <SoundToggle />
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="flex h-11 w-11 items-center justify-center md:hidden"
            >
              <span className="relative block h-4 w-6">
                <span
                  className={`absolute left-0 block h-px w-6 bg-bone transition-all duration-300 ease-silk ${
                    open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-px w-6 bg-bone transition-all duration-300 ease-silk ${
                    open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — sits just under the header so the close control stays reachable. */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[80] md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 h-full w-full bg-ink-950/95 backdrop-blur-xl transition-opacity duration-500 ease-silk ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="shell pointer-events-none relative flex h-full flex-col justify-center">
          <span className="eyebrow mb-8">Navigate</span>
          <nav className="pointer-events-auto flex flex-col gap-1" aria-label="Mobile">
            {nav.map((item, i) => (
              <a
                key={item.id}
                ref={i === 0 ? firstLinkRef : undefined}
                href={`#${item.id}`}
                tabIndex={open ? 0 : -1}
                onClick={(e) => {
                  e.preventDefault();
                  go(item.id);
                }}
                className="display border-b border-bone/10 py-4 text-[12vw] leading-none text-bone-muted transition-colors duration-300 hover:text-blood-400 sm:text-5xl"
                style={{
                  transitionDelay: open ? `${100 + i * 60}ms` : "0ms",
                  opacity: open ? 1 : 0,
                  transform: open ? "translateY(0)" : "translateY(24px)",
                  transitionProperty: "opacity, transform, color",
                  transitionDuration: "600ms",
                  transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <span className="mr-4 align-middle font-body text-xs tracking-cinematic text-blood-500/60">
                  0{i + 1}
                </span>
                {item.label}
              </a>
            ))}
          </nav>

          {/* Explicit close control — always visible, independent of the header. */}
          <div className="pointer-events-auto mt-10 flex items-center justify-between">
            <div className="flex flex-col gap-2 font-body text-[11px] uppercase tracking-wide2 text-bone-dim">
              <span>{meta.studio}</span>
              <span>{meta.location}</span>
            </div>
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border border-bone/20 px-5 py-3 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors duration-300 hover:border-blood-500/70 hover:text-bone"
            >
              Close
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
