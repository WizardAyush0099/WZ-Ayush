import { contact, footer, meta, nav } from "../../data/content";
import { linkTo } from "../../lib/router";
import { scrollToId } from "../../lib/scroll";
import { buildWhatsAppUrl, introMessage } from "../../lib/whatsapp";

type FooterLink = {
  label: string;
  /** Section id on the homepage. */
  id?: string;
  /** Hash route (builder, admin). */
  route?: string;
  /** External URL or mailto. */
  href?: string;
};

/**
 * Footer navigation.
 *
 * Section links scroll, route links navigate, and everything else is a real
 * URL — so no footer link can silently fall back to the wrong destination.
 */
function footerColumns(): Array<{ title: string; links: FooterLink[] }> {
  const sectionLinks: FooterLink[] = nav
    .filter((item) => item.id)
    .map((item) => ({ label: item.label, id: item.id }));

  return [
    { title: "Explore", links: sectionLinks },
    {
      title: "Start",
      links: [
        { label: "Build My Website", route: "/builder" },
        { label: "Chat on WhatsApp", href: buildWhatsAppUrl(introMessage()) },
        { label: "Email", href: `mailto:${contact.email}` },
      ],
    },
  ];
}

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-bone/10 bg-ink-950 pt-16" aria-label="Footer">
      <div className="shell">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <span className="display block text-4xl tracking-[0.1em] text-bone sm:text-5xl">
              {meta.studio}
            </span>
            <span className="mt-3 block font-body text-[10px] uppercase tracking-cinematic text-bone-dim">
              {footer.tagline}
            </span>
            <div className="mt-8 flex flex-col gap-2">
              <a
                href={`mailto:${contact.email}`}
                data-cursor="hover"
                className="w-fit font-body text-sm text-bone-muted underline decoration-bone/20 underline-offset-4 transition-colors duration-300 hover:text-bone hover:decoration-blood-500/70"
              >
                {contact.email}
              </a>
              <a
                href={buildWhatsAppUrl(introMessage())}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="hover"
                className="w-fit font-body text-sm text-bone-muted transition-colors duration-300 hover:text-bone"
              >
                WhatsApp {contact.whatsappDisplay}
              </a>
            </div>
          </div>

          {footerColumns().map((col) => (
            <nav key={col.title} className="md:col-span-2" aria-label={col.title}>
              <h3 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                {col.title}
              </h3>
              <ul className="mt-5 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.id ? (
                      <a
                        href={`#${link.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToId(link.id as string);
                        }}
                        className="font-body text-sm text-bone-muted transition-colors duration-300 hover:text-bone"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <a
                        href={link.route ? linkTo(link.route) : link.href}
                        target={link.href && !link.href.startsWith("mailto:") ? "_blank" : undefined}
                        rel={
                          link.href && !link.href.startsWith("mailto:")
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="font-body text-sm text-bone-muted transition-colors duration-300 hover:text-bone"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav className="md:col-span-3" aria-label="Social">
            <h3 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">Live</h3>
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
              <li>
                <a
                  href={linkTo("/admin")}
                  className="font-body text-sm text-bone-dim transition-colors duration-300 hover:text-bone"
                >
                  Dashboard
                </a>
              </li>
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
            <span className="transition-transform duration-500 ease-silk group-hover:-translate-y-0.5">
              ↑
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
