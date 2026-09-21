import { useEffect, useRef, useState } from "react";
import { hero, nav, meta } from "../data/content";
import { getLenis, scrollToId } from "../lib/scroll";
import SoundToggle from "./SoundToggle";

export default function Navbar({ ready }: { ready: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");
  const [open, setOpen] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

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

  // Lock scrolling + handle Escape while the mobile menu is open.
  // Intentionally only touches scroll-lock when the menu is actually open so
  // it never fights the preloader / lightbox for ownership of body overflow.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    getLenis()?.stop();
    firstLinkRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      getLenis()?.start();
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    // Let the menu overlay begin closing before we scroll.
    window.setTimeout(() => scrollToId(id), open ? 220 : 0);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[55] transition-all duration-700 ease-silk ${
          scrolled ? "border-b border-bone/10 bg-ink-950/70 backdrop-blur-md" : "border-b border-transparent"
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
            className="group flex items-baseline gap-2"
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

          <div className="flex items-center gap-5">
            <SoundToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
            >
              <span
                className={`block h-px w-6 bg-bone transition-transform duration-300 ease-silk ${
                  open ? "translate-y-[3px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-px w-6 bg-bone transition-transform duration-300 ease-silk ${
                  open ? "-translate-y-[3px] -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[80] md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-ink-950/95 backdrop-blur-xl transition-opacity duration-500 ease-silk ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <div className="shell relative flex h-full flex-col justify-center">
          <span className="eyebrow mb-8">Navigate</span>
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {nav.map((item, i) => (
              <a
                key={item.id}
                ref={i === 0 ? firstLinkRef : undefined}
                href={`#${item.id}`}
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
          <div className="mt-10 flex flex-col gap-2 font-body text-[11px] uppercase tracking-wide2 text-bone-dim">
            <span>{meta.studio}</span>
            <span>{meta.location}</span>
          </div>
        </div>
      </div>
    </>
  );
}
