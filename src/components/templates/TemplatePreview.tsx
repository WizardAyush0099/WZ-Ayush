import type { TemplateKind } from "../../data/content";

/**
 * ============================================================================
 *  TEMPLATE PREVIEW
 * ============================================================================
 *  A miniature, non-interactive rendering of what each template looks like.
 *  Built entirely from DOM + CSS (no screenshots to go stale or break), and it
 *  inherits whichever palette its wrapper sets via `data-theme`.
 * ============================================================================
 */

type Props = { kind: TemplateKind; name: string; domain: string };

const DOT = "h-1.5 w-1.5 rounded-full bg-bone/20";

const ACCENT_GRADIENT =
  "linear-gradient(135deg, rgb(var(--blood-700-rgb)) 0%, rgb(var(--ink-800-rgb)) 52%, rgb(var(--ink-950-rgb)) 100%)";

/** Stands in for a photograph — layered gradients, never a flat block. */
function Shot({
  className = "",
  label,
  caption,
}: {
  className?: string;
  label?: string;
  caption?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden border border-bone/10 ${className}`}
      style={{ background: ACCENT_GRADIENT }}
    >
      <span
        aria-hidden="true"
        className="absolute -right-3 -top-4 h-14 w-14 rounded-full opacity-30 blur-xl"
        style={{ background: "rgb(var(--accent-rgb))" }}
      />
      {label ? (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent px-2 pb-1.5 pt-5 text-[9px] uppercase tracking-wide2 text-bone">
          {label}
        </span>
      ) : null}
      {caption ? (
        <span className="absolute left-2 top-2 text-[7px] uppercase tracking-wide2 text-bone-muted">
          {caption}
        </span>
      ) : null}
    </div>
  );
}

function Nav({ name, links }: { name: string; links: string[] }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-display text-[9px] tracking-[0.22em] text-bone">{name.toUpperCase()}</span>
      <span className="flex gap-2.5 text-[6px] uppercase tracking-wide2 text-bone-dim">
        {links.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </span>
    </div>
  );
}

function Body({ kind, name }: { kind: TemplateKind; name: string }) {
  switch (kind) {
    case "hotel":
      return (
        <>
          <Nav name={name} links={["Rooms", "Dine", "Spa", "Book"]} />
          <Shot className="mt-2.5 aspect-[16/7] w-full" label="Stay by the water" />
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {[
              ["Deluxe", "₹6,500"],
              ["Sea Suite", "₹11,000"],
              ["Private Villa", "₹18,000"],
            ].map(([room, price]) => (
              <div key={room} className="border border-bone/10 bg-ink-900/70 p-1.5">
                <span className="block text-[7px] uppercase tracking-wide2 text-bone-muted">{room}</span>
                <span className="mt-1 block text-[8px] text-blood-300">
                  {price}
                  <span className="text-bone-dim"> /night</span>
                </span>
              </div>
            ))}
          </div>
        </>
      );

    case "restaurant":
      return (
        <>
          <Nav name={name} links={["Menu", "Story", "Gallery", "Reserve"]} />
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <div className="flex flex-col justify-center">
              <span className="font-display text-[13px] leading-tight text-bone">A table by candlelight.</span>
              <span className="mt-1.5 text-[7px] leading-relaxed text-bone-dim">
                Seasonal plates, natural wine, no hurry.
              </span>
              <span className="mt-2 inline-block w-fit border border-blood-500/60 px-2 py-1 text-[6px] uppercase tracking-wide2 text-bone">
                Book now
              </span>
            </div>
            <Shot className="aspect-[4/3] w-full" />
          </div>
          <div className="mt-2.5 flex flex-col gap-1">
            {[
              ["Charred aubergine", "₹420"],
              ["Saffron risotto", "₹560"],
            ].map(([dish, price]) => (
              <div key={dish} className="flex items-baseline justify-between border-t border-bone/10 pt-1">
                <span className="text-[7px] text-bone-muted">{dish}</span>
                <span className="text-[7px] text-blood-300">{price}</span>
              </div>
            ))}
          </div>
        </>
      );

    case "salon":
      return (
        <>
          <Nav name={name} links={["Services", "Stylists", "Book"]} />
          <div className="mt-2.5 grid grid-cols-5 gap-2.5">
            <Shot className="col-span-3 aspect-[4/5] w-full" caption="Studio" />
            <div className="col-span-2 flex flex-col justify-center gap-1.5">
              {[
                ["Cut & finish", "₹900"],
                ["Colour", "₹2,400"],
                ["Spa ritual", "₹1,800"],
              ].map(([svc, price]) => (
                <div key={svc} className="flex items-baseline justify-between border-b border-bone/10 pb-1">
                  <span className="text-[6.5px] uppercase tracking-wide2 text-bone-muted">{svc}</span>
                  <span className="text-[7px] text-blood-300">{price}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      );

    case "store":
      return (
        <>
          <Nav name={name} links={["Shop", "New", "Cart"]} />
          <div className="mt-2.5 grid grid-cols-4 gap-2">
            {[
              ["Linen shirt", "₹2,400"],
              ["Wool cap", "₹1,200"],
              ["Leather tote", "₹4,800"],
              ["Ceramic mug", "₹700"],
            ].map(([item, price]) => (
              <div key={item}>
                <Shot className="aspect-square w-full" />
                <span className="mt-1 block truncate text-[6.5px] text-bone-muted">{item}</span>
                <span className="text-[7px] text-blood-300">{price}</span>
              </div>
            ))}
          </div>
          <span className="mt-2.5 inline-block border border-bone/15 px-2 py-1 text-[6px] uppercase tracking-wide2 text-bone-dim">
            Free shipping over ₹2,000
          </span>
        </>
      );

    case "gym":
      return (
        <>
          <Nav name={name} links={["Plans", "Classes", "Coaches"]} />
          <div className="mt-2.5 flex items-end justify-between">
            <span className="font-display text-[16px] leading-none text-bone">TRAIN HARD</span>
            <span className="border border-blood-500/60 px-2 py-1 text-[6px] uppercase tracking-wide2 text-bone">
              Free trial
            </span>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {[
              ["12", "Classes"],
              ["9", "Coaches"],
              ["24/7", "Open"],
            ].map(([value, label]) => (
              <div key={label} className="border border-bone/10 bg-ink-900/70 px-2 py-1.5">
                <span className="block font-display text-[11px] text-blood-300">{value}</span>
                <span className="text-[6px] uppercase tracking-wide2 text-bone-dim">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            <Shot className="aspect-[4/3] w-full" />
            <Shot className="aspect-[4/3] w-full" />
            <Shot className="aspect-[4/3] w-full" />
          </div>
        </>
      );

    case "studio":
    default:
      return (
        <>
          <Nav name={name} links={["Work", "Studio", "Journal"]} />
          <span className="mt-2.5 block font-display text-[15px] leading-[1.05] text-bone">
            We build brands that get remembered.
          </span>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <div>
              <Shot className="aspect-[16/10] w-full" />
              <span className="mt-1 block text-[6.5px] uppercase tracking-wide2 text-bone-muted">
                Case study — Northline
              </span>
            </div>
            <div>
              <Shot className="aspect-[16/10] w-full" />
              <span className="mt-1 block text-[6.5px] uppercase tracking-wide2 text-bone-muted">
                Case study — Halo Foods
              </span>
            </div>
          </div>
        </>
      );
  }
}

export default function TemplatePreview({ kind, name, domain }: Props) {
  return (
    <div className="relative w-full overflow-hidden bg-ink-950">
      <div className="flex items-center gap-1.5 border-b border-bone/10 bg-ink-900/90 px-3 py-2">
        <span className={DOT} />
        <span className={DOT} />
        <span className={DOT} />
        <span className="ml-2 flex-1 truncate rounded-sm bg-bone/5 px-2 py-[3px] text-center text-[7px] tracking-wide text-bone-dim">
          {domain}
        </span>
      </div>
      <div className="p-3">
        <Body kind={kind} name={name} />
      </div>
    </div>
  );
}
