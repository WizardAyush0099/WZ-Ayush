import { footer, meta, nav } from "../../data/content";
import { scrollToId } from "../../lib/scroll";

function resolveHref(label: string): { href: string; external: boolean; id?: string } {
  const match = nav.find((n) => n.label.toLowerCase() === label.toLowerCase());
  if (match) return { href: `#${match.id}`, external: false, id: match.id };
  return { href: `mailto:${footer.email}?subject=${encodeURIComponent(label)}`, external: false };
}

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-bone/10 bg-ink-950 pt-16" aria-label="Footer">
      <div className="shell">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <span className="display block text-4xl tracking-[0.1em] text-bone sm:text-5xl">ITACHI</span>
            <span className="mt-3 block font-body text-[10px] uppercase tracking-cinematic text-bone-dim">
              {footer.tagline}
            </span>
            <a
              href={`mailto:${footer.email}`}
              data-cursor="hover"
              className="mt-8 inline-block font-body text-sm text-bone-muted underline decoration-bone/20 underline-offset-4 transition-colors duration-300 hover:text-bone hover:decoration-blood-500/70"
            >
              {footer.email}
            </a>
          </div>

          {footer.columns.map((col) => (
            <nav key={col.title} className="md:col-span-2" aria-label={col.title}>
              <h3 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">{col.title}</h3>
              <ul className="mt-5 flex flex-col gap-3">
                {col.links.map((label) => {
                  const { href, id } = resolveHref(label);
                  return (
                    <li key={label}>
                      <a
                        href={href}
                        onClick={(e) => {
                          if (id) {
                            e.preventDefault();
                            scrollToId(id);
                          }
                        }}
                        className="font-body text-sm text-bone-muted transition-colors duration-300 hover:text-bone"
                      >
                        {label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}

          <nav className="md:col-span-3" aria-label="Social">
            <h3 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">Follow</h3>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
              {footer.social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body text-sm text-bone-muted transition-colors duration-300 hover:text-blood-400"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-bone/10 py-8 sm:flex-row sm:items-center">
          <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            © {meta.year} {meta.studio} — {meta.location}
          </span>
          <button
            type="button"
            onClick={() => scrollToId("home")}
            data-cursor="hover"
            className="group flex items-center gap-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors duration-300 hover:text-bone"
          >
            Back to top
            <span className="transition-transform duration-500 ease-silk group-hover:-translate-y-0.5">↑</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
