import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { SiteTemplate, TemplateDesign, TemplateSection } from "../../data/templates";

/**
 * ============================================================================
 *  TEMPLATE PREVIEW — a real page, shown like a screenshot
 * ============================================================================
 *  The page is composed at a fixed 1100px design width and then scaled to the
 *  space available. That is what makes a card read as an actual website: the
 *  proportions, type scale and section rhythm are the real ones, rather than
 *  a diagram that happens to be small.
 *
 *  Everything visible comes from the template's own `design` tokens and
 *  `sections`, so twenty concepts genuinely look like twenty websites —
 *  different composition, typography, shape language and art direction — and
 *  adding one is a data change, not a new component.
 * ============================================================================
 */

const DESIGN_WIDTH = 1100;
/** How much of the page a card shows before clipping. */
const CARD_DESIGN_HEIGHT = 1560;

const FONTS: Record<TemplateDesign["display"], string> = {
  serif: '"Cinzel", Georgia, serif',
  sans: '"Inter", system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, "Courier New", monospace',
};

const MONO = 'ui-monospace, SFMono-Regular, Menlo, "Courier New", monospace';
const SANS = '"Inter", system-ui, sans-serif';
const PAD = 72; // horizontal page padding at design width
const CAROUSEL_CAPTION = "Featured work";

/* ==========================================================================
 *  helpers
 * ========================================================================== */

function useMeasured<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () =>
      setSize((prev) => {
        const next = { width: node.clientWidth, height: node.clientHeight };
        return prev.width === next.width && prev.height === next.height ? prev : next;
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, ...size };
}

/** Apply the template's headline casing. */
function styled(text: string, design: TemplateDesign): string {
  if (design.case === "upper") return text.toUpperCase();
  if (design.case === "lower") return text.toLowerCase();
  return text;
}

type Ctx = { t: TemplateDesign };

function head(ctx: Ctx, size: number, extra?: CSSProperties): CSSProperties {
  return {
    fontFamily: FONTS[ctx.t.display],
    fontSize: size,
    lineHeight: 0.98,
    letterSpacing: `${ctx.t.tracking}em`,
    color: ctx.t.ink,
    margin: 0,
    ...extra,
  };
}

function body(ctx: Ctx, size = 15, color?: string): CSSProperties {
  return {
    fontFamily: SANS,
    fontSize: size,
    lineHeight: 1.62,
    color: color ?? ctx.t.muted,
    margin: 0,
  };
}

function label(ctx: Ctx, size = 11): CSSProperties {
  return {
    fontFamily: SANS,
    fontSize: size,
    textTransform: "uppercase",
    letterSpacing: "0.22em",
    color: ctx.t.muted,
    margin: 0,
  };
}

function card(ctx: Ctx): CSSProperties {
  return {
    background: ctx.t.panel,
    border: `${ctx.t.border}px solid ${ctx.t.line}`,
    borderRadius: ctx.t.radius,
    boxShadow: ctx.t.hard ? `7px 7px 0 0 ${ctx.t.ink}` : undefined,
  };
}

function button(ctx: Ctx, kind: "solid" | "outline" = "solid"): CSSProperties {
  const radius = ctx.t.radius >= 999 ? 999 : Math.min(ctx.t.radius, 999);
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "13px 22px",
    fontFamily: ctx.t.display === "mono" ? MONO : SANS,
    fontSize: 12,
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    borderRadius: radius,
    border: kind === "solid" ? `${ctx.t.border}px solid ${ctx.t.accent}` : `${ctx.t.border}px solid ${ctx.t.ink}`,
    background: kind === "solid" ? ctx.t.accent : "transparent",
    color: kind === "solid" ? ctx.t.onAccent : ctx.t.ink,
    boxShadow: ctx.t.hard ? `4px 4px 0 0 ${ctx.t.ink}` : undefined,
  };
}

/* ==========================================================================
 *  imagery — abstract, art-directed stand-ins for photography
 * ========================================================================== */

type ShotVariant = "portrait" | "product" | "space" | "food" | "scene" | "headshot" | "album";

function Photo({
  t,
  variant = "scene",
  style,
  ratio,
}: {
  t: TemplateDesign;
  variant?: ShotVariant;
  style?: CSSProperties;
  ratio?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const bg = `g${uid}`;
  const glow = `p${uid}`;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: t.radius ? Math.min(t.radius, 24) : 0,
        aspectRatio: ratio,
        background: t.panel,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, height: "100%", width: "100%" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={t.ink} stopOpacity="0.92" />
            <stop offset="55%" stopColor={t.accent} stopOpacity="0.55" />
            <stop offset="100%" stopColor={t.ink} stopOpacity="0.98" />
          </linearGradient>
          <radialGradient id={glow}>
            <stop offset="0%" stopColor={t.accent} stopOpacity="0.85" />
            <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="300" fill={`url(#${bg})`} />
        <circle cx="292" cy="74" r="96" fill={`url(#${glow})`} />
        <circle cx="96" cy="228" r="72" fill={`url(#${glow})`} opacity="0.6" />

        {variant === "headshot" || variant === "portrait" ? (
          <>
            <ellipse cx="200" cy="150" rx="58" ry="66" fill={t.onAccent} opacity="0.2" />
            <ellipse cx="200" cy="266" rx="104" ry="76" fill={t.onAccent} opacity="0.16" />
          </>
        ) : null}

        {variant === "space" ? (
          <>
            <rect x="0" y="196" width="400" height="104" fill={t.onAccent} opacity="0.1" />
            <rect x="52" y="150" width="120" height="46" rx="12" fill={t.onAccent} opacity="0.2" />
            <rect x="198" y="132" width="96" height="64" rx="14" fill={t.onAccent} opacity="0.16" />
            <rect x="316" y="166" width="44" height="30" rx="8" fill={t.onAccent} opacity="0.22" />
          </>
        ) : null}

        {variant === "product" ? (
          <>
            <path d="M132 132 q68 -58 136 0" stroke={t.onAccent} strokeWidth="9" fill="none" opacity="0.3" />
            <rect x="140" y="150" width="120" height="30" rx="12" fill={t.onAccent} opacity="0.26" />
            <path d="M156 180 L142 244 M244 180 L258 244 M200 180 L200 240" stroke={t.onAccent} strokeWidth="7" opacity="0.24" />
          </>
        ) : null}

        {variant === "food" ? (
          <>
            <circle cx="200" cy="160" r="74" fill={t.onAccent} opacity="0.16" />
            <circle cx="200" cy="160" r="48" fill={t.accent} opacity="0.3" />
            <circle cx="176" cy="140" r="16" fill={t.onAccent} opacity="0.22" />
            <circle cx="226" cy="182" r="12" fill={t.onAccent} opacity="0.2" />
          </>
        ) : null}

        {variant === "album" ? (
          <rect x="130" y="82" width="140" height="140" rx="6" fill={t.onAccent} opacity="0.16" />
        ) : null}

        {variant === "scene" ? (
          <>
            <path d="M0 214 L120 150 L236 214 Z" fill={t.onAccent} opacity="0.13" />
            <path d="M168 226 L300 138 L400 216 L400 300 L168 300 Z" fill={t.onAccent} opacity="0.1" />
          </>
        ) : null}

        {/* Fine diagonal hatching keeps every slot looking intentional. */}
        <g opacity="0.05" stroke={t.onAccent} strokeWidth="1.5">
          {Array.from({ length: 26 }).map((_, i) => (
            <line key={i} x1={i * 32 - 120} y1="300" x2={i * 32 + 90} y2="0" />
          ))}
        </g>
      </svg>
    </div>
  );
}

/** Page background texture: graph grid, halftone or dots. */
function textureLayer(t: TemplateDesign): CSSProperties | null {
  if (t.texture === "grid") {
    return {
      backgroundImage: `linear-gradient(${t.line} 1px, transparent 1px), linear-gradient(90deg, ${t.line} 1px, transparent 1px)`,
      backgroundSize: "34px 34px",
      opacity: 0.55,
    };
  }
  if (t.texture === "dots") {
    return {
      backgroundImage: `radial-gradient(${t.line} 1.4px, transparent 1.4px)`,
      backgroundSize: "18px 18px",
      opacity: 0.8,
    };
  }
  if (t.texture === "halftone") {
    return {
      backgroundImage: `radial-gradient(${t.muted} 1.1px, transparent 1.2px)`,
      backgroundSize: "7px 7px",
      opacity: 0.35,
    };
  }
  return null;
}

/* ==========================================================================
 *  section renderers
 * ========================================================================== */

function Nav({ section, ctx }: { section: Extract<TemplateSection, { kind: "nav" }>; ctx: Ctx }) {
  const { t } = ctx;
  const links = (
    <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
      {section.links.map((link, i) => (
        <span
          key={link}
          style={{
            fontFamily: t.display === "mono" ? MONO : SANS,
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: t.display === "mono" ? "uppercase" : "none",
            color: i === 1 ? t.ink : t.muted,
            fontWeight: i === 1 ? 600 : 400,
          }}
        >
          {link}
        </span>
      ))}
    </div>
  );

  const brand = (
    <span style={{ fontFamily: FONTS[t.display], fontSize: 19, letterSpacing: "0.06em", color: t.ink }}>
      {styled("Northline", t)}
    </span>
  );

  const cta = section.cta ? (
    <span style={{ ...button(ctx, t.case === "upper" ? "solid" : "outline"), padding: "9px 16px", fontSize: 11 }}>
      {section.cta}
      <span aria-hidden="true">↗</span>
    </span>
  ) : null;

  if (section.style === "pill") {
    return (
      <div style={{ padding: `26px ${PAD}px 10px` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: t.panel,
            border: `${t.border}px solid ${t.line}`,
            borderRadius: 999,
            padding: "12px 14px 12px 26px",
          }}
        >
          {brand}
          {links}
          {cta}
        </div>
      </div>
    );
  }

  if (section.style === "window") {
    return (
      <div style={{ padding: `${26}px ${PAD}px 0` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `2px solid ${t.ink}`,
            paddingBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 15, color: t.accent }}>&lt;/&gt;</span>
            {brand}
          </div>
          {links}
          {cta}
        </div>
      </div>
    );
  }

  if (section.style === "minimal") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `26px ${PAD}px`,
        }}
      >
        {brand}
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {links}
          {cta}
        </div>
      </div>
    );
  }

  // bar
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `24px ${PAD}px`,
        background: t.panel,
        borderBottom: `${t.border}px solid ${t.line}`,
      }}
    >
      {brand}
      {links}
      {cta}
    </div>
  );
}

function HeroSplit({ section, ctx }: { section: Extract<TemplateSection, { kind: "heroSplit" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.02fr 0.98fr", gap: 40, padding: `56px ${PAD}px 72px` }}>
      <div style={{ ...card(ctx), padding: 40, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p style={label(ctx, 11)}>{section.eyebrow}</p>
        <h1 style={head(ctx, 62, { marginTop: 22 })}>{styled(section.title, t)}</h1>
        <p style={{ ...body(ctx), marginTop: 22, maxWidth: 430 }}>{section.body}</p>
        <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
          <span style={button(ctx)}>{section.cta}</span>
          {section.secondary ? <span style={{ ...button(ctx, "outline") }}>{section.secondary}</span> : null}
        </div>
      </div>
      <Photo t={t} variant="headshot" style={{ height: "100%", minHeight: 420 }} />
    </div>
  );
}

function HeroWordmark({ section, ctx }: { section: Extract<TemplateSection, { kind: "heroWordmark" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ padding: `40px ${PAD}px 26px`, position: "relative" }}>
      <h1 style={head(ctx, 132, { letterSpacing: "-0.05em" })}>{styled(section.word, t)}</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 36, alignItems: "end", marginTop: 8 }}>
        <div style={{ position: "relative" }}>
          <Photo t={t} variant="product" style={{ height: 330 }} />
          <div style={{ position: "absolute", right: 18, bottom: 18, width: 170, ...card(ctx), padding: 12 }}>
            <Photo t={t} variant="product" ratio="4/3" />
            <p style={{ ...body(ctx, 11, t.ink), marginTop: 8, fontWeight: 600 }}>{section.float}</p>
          </div>
        </div>
        <div style={{ maxWidth: 320, paddingBottom: 22 }}>
          <p style={body(ctx, 14)}>{section.sub}</p>
          <span style={{ ...button(ctx), marginTop: 22 }}>{section.cta}</span>
        </div>
      </div>
    </div>
  );
}

function HeroFullbleed({ section, ctx }: { section: Extract<TemplateSection, { kind: "heroFullbleed" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ padding: `28px ${PAD}px 0` }}>
      <div style={{ position: "relative", borderRadius: t.radius ? Math.min(t.radius, 26) : 0, overflow: "hidden" }}>
        <Photo t={t} variant="scene" style={{ height: 470, borderRadius: 0 }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(90deg, ${t.page} 8%, ${t.page}00 78%)`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, padding: 48, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 560 }}>
          <span style={{ ...label(ctx, 11), color: t.accent }}>{section.chip}</span>
          <h1 style={head(ctx, 64, { marginTop: 18 })}>{styled(section.title, t)}</h1>
          <p style={{ ...body(ctx, 15, t.ink), opacity: 0.85, marginTop: 18, maxWidth: 380 }}>{section.sub}</p>
          <span style={{ ...button(ctx), marginTop: 26 }}>{section.cta}</span>
        </div>
      </div>
    </div>
  );
}

function HeroCentered({ section, ctx }: { section: Extract<TemplateSection, { kind: "heroCentered" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ padding: `64px ${PAD}px`, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <p style={label(ctx, 11)}>{section.eyebrow}</p>
      <h1 style={head(ctx, 68, { marginTop: 20, maxWidth: 820 })}>{styled(section.title, t)}</h1>
      <p style={{ ...body(ctx, 15), marginTop: 20, maxWidth: 520 }}>{section.sub}</p>
      <span style={{ ...button(ctx), marginTop: 28 }}>{section.cta}</span>
    </div>
  );
}

function HeroCarousel({ section, ctx }: { section: Extract<TemplateSection, { kind: "heroCarousel" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ padding: `36px ${PAD}px 54px`, textAlign: "center", position: "relative" }}>
      <h1 style={head(ctx, 44, { maxWidth: 640, margin: "0 auto" })}>{styled(section.title, t)}</h1>
      <p style={{ ...body(ctx, 14), marginTop: 14, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>{section.sub}</p>
      <span style={{ ...button(ctx), marginTop: 22 }}>{section.cta}</span>

      <div style={{ position: "relative", marginTop: 42, height: 300 }}>
        <div style={{ position: "absolute", left: 0, top: 24, width: 250, height: 236, opacity: 0.4 }}>
          <Photo t={t} variant="scene" style={{ height: "100%" }} />
        </div>
        <div style={{ position: "absolute", right: 0, top: 24, width: 250, height: 236, opacity: 0.4 }}>
          <Photo t={t} variant="space" style={{ height: "100%" }} />
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: 380,
            ...card(ctx),
            padding: 12,
          }}
        >
          <Photo t={t} variant="portrait" style={{ height: 224 }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 6px 4px" }}>
            <span style={{ ...body(ctx, 13, t.ink), fontWeight: 600 }}>{styled(CAROUSEL_CAPTION, t)}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: t.muted }}>01 / 05</span>
          </div>
        </div>

        <span style={{ position: "absolute", left: 8, top: 128, width: 40, height: 40, borderRadius: 999, border: `1px solid ${t.line}`, background: t.panel, display: "grid", placeItems: "center", color: t.ink }}>‹</span>
        <span style={{ position: "absolute", right: 8, top: 128, width: 40, height: 40, borderRadius: 999, border: `1px solid ${t.line}`, background: t.panel, display: "grid", placeItems: "center", color: t.ink }}>›</span>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 34, flexWrap: "wrap" }}>
        {section.filters.map((filter, i) => (
          <span
            key={filter}
            style={{
              padding: "9px 18px",
              borderRadius: 999,
              border: `1px solid ${i === 0 ? t.accent : t.line}`,
              background: i === 0 ? t.accent : "transparent",
              color: i === 0 ? t.onAccent : t.muted,
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {filter}
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroDome({ section, ctx }: { section: Extract<TemplateSection, { kind: "heroDome" }>; ctx: Ctx }) {
  const { t } = ctx;
  const shots = section.shots ?? 7;
  const variants: ShotVariant[] = ["scene", "portrait", "space", "product", "food", "album", "scene"];
  return (
    <div style={{ padding: `30px ${PAD}px 0` }}>
      {section.title ? (
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", ...card(ctx), padding: 34 }}>
          <h1 style={head(ctx, 42)}>{styled(section.title, t)}</h1>
          <p style={{ ...body(ctx, 13), marginTop: 14 }}>{section.sub}</p>
          {section.cta ? <span style={{ ...button(ctx), marginTop: 20 }}>{section.cta}</span> : null}
        </div>
      ) : null}

      <div
        style={{
          marginTop: section.title ? -34 : 0,
          paddingTop: section.title ? 34 : 0,
          height: 300,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 10,
          perspective: 1000,
          overflow: "hidden",
        }}
      >
        {Array.from({ length: shots }).map((_, i) => {
          const middle = (shots - 1) / 2;
          const offset = i - middle;
          return (
            <div
              key={i}
              style={{
                width: 178,
                transform: `rotateY(${offset * -8}deg) translateY(${Math.abs(offset) * 16}px)`,
                opacity: 1 - Math.abs(offset) * 0.16,
              }}
            >
              <Photo t={t} variant={variants[i % variants.length]} style={{ height: 236 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeroTypeLed({ section, ctx }: { section: Extract<TemplateSection, { kind: "heroTypeLed" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ padding: `72px ${PAD}px 64px`, borderBottom: `1px solid ${t.line}` }}>
      <h1 style={head(ctx, 88, { maxWidth: 860 })}>{styled(section.title, t)}</h1>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, marginTop: 36 }}>
        <p style={{ ...body(ctx, 16), maxWidth: 460 }}>{section.sub}</p>
        <div style={{ display: "flex", gap: 34 }}>
          {section.meta.map((item) => (
            <span key={item} style={{ ...label(ctx, 11) }}>{item}</span>
          ))}
        </div>
      </div>
      <span style={{ ...button(ctx, "outline"), marginTop: 34 }}>{section.cta}</span>
    </div>
  );
}

function Marquee({ section, ctx }: { section: Extract<TemplateSection, { kind: "marquee" }>; ctx: Ctx }) {
  const { t } = ctx;
  const bg = section.tone === "dark" ? t.ink : section.tone === "accent" ? t.accent : t.panel;
  const fg = section.tone === "dark" ? t.page : section.tone === "accent" ? t.onAccent : t.ink;
  const items = [...section.items, ...section.items];
  return (
    <div style={{ background: bg, padding: "18px 0", display: "flex", gap: 30, overflow: "hidden" }}>
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          style={{
            fontFamily: FONTS[t.display],
            fontSize: 22,
            color: fg,
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 30,
            opacity: 0.95,
          }}
        >
          {styled(item, t)}
          <span aria-hidden="true" style={{ fontSize: 14, opacity: 0.7 }}>✦</span>
        </span>
      ))}
    </div>
  );
}

function StatCards({ section, ctx }: { section: Extract<TemplateSection, { kind: "statCards" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.items.length + 1}, 1fr)`, gap: 18, padding: `44px ${PAD}px` }}>
      {section.items.map((item) => (
        <div key={item.label} style={{ ...card(ctx), padding: 28, gridColumn: "span 1" }}>
          <p style={label(ctx, 10)}>{item.label}</p>
          <p style={{ ...head(ctx, 48, { marginTop: 18 }) }}>{item.value}</p>
          {item.note ? <p style={{ ...body(ctx, 12), marginTop: 10 }}>{item.note}</p> : null}
        </div>
      ))}
      <div style={{ ...card(ctx), padding: 28, background: t.ink }}>
        <p style={{ ...label(ctx, 10), color: t.page, opacity: 0.7 }}>Availability</p>
        <p style={{ ...head(ctx, 40, { marginTop: 18, color: t.page }) }}>Now</p>
        <p style={{ ...body(ctx, 12, t.page), opacity: 0.75, marginTop: 10 }}>Taking new projects</p>
      </div>
    </div>
  );
}

function StatBar({ section, ctx }: { section: Extract<TemplateSection, { kind: "statBar" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${section.items.length}, 1fr)`,
        padding: `52px ${PAD}px`,
        borderTop: `1px solid ${t.line}`,
        borderBottom: `1px solid ${t.line}`,
      }}
    >
      {section.items.map((item, i) => (
        <div key={item.label} style={{ borderLeft: i === 0 ? "none" : `1px solid ${t.line}`, paddingLeft: i === 0 ? 0 : 28 }}>
          <p style={head(ctx, 46, { color: t.accent })}>{item.value}</p>
          <p style={{ ...body(ctx, 12), marginTop: 8 }}>{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function FeatureCards({ section, ctx }: { section: Extract<TemplateSection, { kind: "featureCards" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: 18, padding: `52px ${PAD}px` }}>
      {section.items.map((item, i) => (
        <div key={item.title} style={{ ...card(ctx), padding: 26, borderTop: i === 0 ? `${t.border}px solid ${t.accent}` : undefined }}>
          <p style={label(ctx, 10)}>{String(i + 1).padStart(2, "0")}</p>
          <p style={{ fontFamily: FONTS[t.display], fontSize: 22, color: t.ink, margin: "16px 0 0" }}>{styled(item.title, t)}</p>
          {item.body ? <p style={{ ...body(ctx, 13), marginTop: 10 }}>{item.body}</p> : null}
        </div>
      ))}
    </div>
  );
}

function ImageTextSplit({ section, ctx }: { section: Extract<TemplateSection, { kind: "imageTextSplit" }>; ctx: Ctx }) {
  const { t } = ctx;
  const text = (
    <div style={{ padding: 42, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <p style={label(ctx, 10)}>{section.eyebrow}</p>
      <h2 style={head(ctx, 40, { marginTop: 18 })}>{styled(section.title, t)}</h2>
      <p style={{ ...body(ctx, 14), marginTop: 18, maxWidth: 420 }}>{section.body}</p>
      {section.chips?.length ? (
        <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" }}>
          {section.chips.map((chip) => (
            <span
              key={chip}
              style={{
                padding: "8px 15px",
                borderRadius: 999,
                border: `1px solid ${t.accent}`,
                color: t.ink,
                fontFamily: SANS,
                fontSize: 11,
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      {section.cta ? <span style={{ ...button(ctx, "outline"), marginTop: 26, alignSelf: "flex-start" }}>{section.cta}</span> : null}
    </div>
  );
  const shot = <Photo t={t} variant={section.side === "left" ? "space" : "headshot"} style={{ height: 420 }} />;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", margin: `40px ${PAD}px`, borderRadius: t.radius ? Math.min(t.radius, 22) : 0, overflow: "hidden", background: t.panel, border: `${t.border}px solid ${t.line}` }}>
      {section.side === "left" ? (
        <>
          {shot}
          {text}
        </>
      ) : (
        <>
          {text}
          {shot}
        </>
      )}
    </div>
  );
}

function CollectionDark({ section, ctx }: { section: Extract<TemplateSection, { kind: "collectionDark" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ background: t.ink, padding: `64px ${PAD}px`, display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 48 }}>
      <div>
        <h2 style={{ ...head(ctx, 44), color: t.page }}>{styled(section.title, t)}</h2>
        <p style={{ ...body(ctx, 14, t.page), opacity: 0.75, marginTop: 20, maxWidth: 400 }}>{section.body}</p>
        <span style={{ ...button(ctx), marginTop: 28, background: t.page, color: t.ink, border: `1px solid ${t.page}` }}>
          {section.cta}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, alignContent: "center" }}>
        {section.items.map((item) => (
          <div key={item.title} style={{ background: t.page, borderRadius: Math.min(t.radius, 16), overflow: "hidden" }}>
            <Photo t={t} variant="product" ratio="1/1" style={{ borderRadius: 0 }} />
            <div style={{ padding: "14px 14px 16px" }}>
              <p style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: t.ink, margin: 0 }}>{item.title}</p>
              <p style={{ fontFamily: SANS, fontSize: 12, color: t.muted, margin: "6px 0 0" }}>{item.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseStudies({ section, ctx }: { section: Extract<TemplateSection, { kind: "caseStudies" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ padding: `56px ${PAD}px` }}>
      <h2 style={head(ctx, 34)}>{styled(section.title, t)}</h2>
      <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: `repeat(${Math.min(section.items.length, 3)}, 1fr)`, gap: 22 }}>
        {section.items.map((item, i) => (
          <div key={item.title} style={{ borderTop: `1px solid ${t.ink}`, paddingTop: 18 }}>
            <Photo t={t} variant={i % 2 === 0 ? "space" : "portrait"} ratio="16/10" />
            <p style={{ fontFamily: SANS, fontSize: 17, fontWeight: 600, color: t.ink, margin: "16px 0 0" }}>{item.title}</p>
            <p style={{ ...body(ctx, 12), marginTop: 8 }}>{item.meta}</p>
            <p style={{ ...body(ctx, 12, t.ink), marginTop: 14, display: "flex", gap: 8, alignItems: "center" }}>View project <span aria-hidden="true">→</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductGrid({ section, ctx }: { section: Extract<TemplateSection, { kind: "productGrid" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ padding: `48px ${PAD}px`, background: t.panel, borderTop: `1px solid ${t.line}`, borderBottom: `1px solid ${t.line}` }}>
      <h2 style={head(ctx, 30)}>{styled(section.title, t)}</h2>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.columns}, 1fr)`, gap: 20, marginTop: 26 }}>
        {section.items.map((item) => (
          <div key={item.title}>
            <div style={{ border: `${t.border}px solid ${t.line}`, borderRadius: Math.min(t.radius, 10), overflow: "hidden", background: t.page }}>
              <Photo t={t} variant="product" ratio="1/1" style={{ borderRadius: 0 }} />
            </div>
            <p style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: t.ink, margin: "14px 0 0" }}>{item.title}</p>
            <p style={{ ...body(ctx, 12), marginTop: 6 }}>{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuList({ section, ctx }: { section: Extract<TemplateSection, { kind: "menuList" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 48, padding: `60px ${PAD}px` }}>
      <div>
        <h2 style={head(ctx, 40)}>{styled(section.title, t)}</h2>
        <p style={{ ...body(ctx, 13), marginTop: 14 }}>{section.note}</p>
        <div style={{ marginTop: 26 }}>
          <Photo t={t} variant="food" style={{ height: 200 }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {section.items.map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "baseline", gap: 16, padding: "16px 0", borderBottom: `1px solid ${t.line}` }}>
            <span style={{ fontFamily: SANS, fontSize: 16, color: t.ink, flex: 1 }}>{item.label}</span>
            <span style={{ fontFamily: MONO, fontSize: 15, color: t.accent }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pricing({ section, ctx }: { section: Extract<TemplateSection, { kind: "pricing" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.items.length}, 1fr)`, gap: 18, padding: `56px ${PAD}px` }}>
      {section.items.map((item) => (
        <div
          key={item.title}
          style={{
            ...card(ctx),
            padding: 28,
            background: item.featured ? t.ink : t.panel,
            borderColor: item.featured ? t.ink : t.line,
          }}
        >
          <p style={{ ...label(ctx, 10), color: item.featured ? t.page : t.muted, opacity: item.featured ? 0.7 : 1 }}>{item.title}</p>
          <p style={{ ...head(ctx, 40, { marginTop: 16, color: item.featured ? t.page : t.ink }) }}>{item.price}</p>
          <p style={{ ...body(ctx, 12, item.featured ? t.page : t.muted), marginTop: 10, opacity: item.featured ? 0.75 : 1 }}>{item.note}</p>
          <span style={{ ...button(ctx, "outline"), marginTop: 22, borderColor: item.featured ? t.page : t.ink, color: item.featured ? t.page : t.ink }}>
            Choose
          </span>
        </div>
      ))}
    </div>
  );
}

function Timeline({ section, ctx }: { section: Extract<TemplateSection, { kind: "timeline" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.items.length}, 1fr)`, gap: 0, padding: `52px ${PAD}px` }}>
      {section.items.map((item, i) => (
        <div key={item.title} style={{ borderLeft: i === 0 ? `1px solid ${t.line}` : "none", borderRight: `1px solid ${t.line}`, padding: "0 26px" }}>
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              minWidth: 32,
              height: 32,
              padding: "0 10px",
              borderRadius: 999,
              background: t.accent,
              color: t.onAccent,
              fontFamily: MONO,
              fontSize: 12,
            }}
          >
            {item.when}
          </span>
          <p style={{ fontFamily: SANS, fontSize: 17, fontWeight: 600, color: t.ink, margin: "18px 0 0" }}>{item.title}</p>
          <p style={{ ...body(ctx, 13), marginTop: 10 }}>{item.body}</p>
        </div>
      ))}
    </div>
  );
}

function WindowCards({ section, ctx }: { section: Extract<TemplateSection, { kind: "windowCards" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.items.length}, 1fr)`, gap: 20, padding: `52px ${PAD}px` }}>
      {section.items.map((item) => (
        <div key={item.title} style={{ ...card(ctx), overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", borderBottom: `${t.border}px solid ${t.line}`, background: t.page }}>
            <span style={{ height: 7, width: 7, borderRadius: 999, background: t.muted, opacity: 0.5 }} />
            <span style={{ height: 7, width: 7, borderRadius: 999, background: t.muted, opacity: 0.5 }} />
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.muted, marginLeft: 8 }}>{item.meta}</span>
          </div>
          <Photo t={t} variant="scene" ratio="16/8" style={{ borderRadius: 0 }} />
          <div style={{ padding: 20 }}>
            <p style={{ fontFamily: FONTS[t.display], fontSize: 19, color: t.ink, margin: 0 }}>{styled(item.title, t)}</p>
            <p style={{ ...body(ctx, 12.5), marginTop: 10 }}>{item.body}</p>
            <span style={{ ...button(ctx, "outline"), marginTop: 16, padding: "9px 15px", fontSize: 10.5 }}>View project</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CodeCard({ section, ctx }: { section: Extract<TemplateSection, { kind: "codeCard" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ padding: `10px ${PAD}px 48px`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
      <div style={{ ...card(ctx), padding: 24, background: t.ink, borderColor: t.ink }}>
        <p style={{ fontFamily: MONO, fontSize: 12, color: t.page, opacity: 0.6 }}>// config</p>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {section.lines.map((line) => (
            <p key={line.key} style={{ fontFamily: MONO, fontSize: 13, color: t.page, margin: 0 }}>
              <span style={{ color: t.accent }}>{line.key}</span>
              <span style={{ opacity: 0.5 }}> → </span>
              <span>{line.value}</span>
            </p>
          ))}
        </div>
      </div>
      <Photo t={t} variant="scene" style={{ height: 214 }} />
    </div>
  );
}

function IconRow({ section, ctx }: { section: Extract<TemplateSection, { kind: "iconRow" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ display: "flex", gap: 0, borderTop: `${t.border}px solid ${t.line}`, borderBottom: `${t.border}px solid ${t.line}` }}>
      <div style={{ background: t.accent, color: t.onAccent, padding: "22px 30px", fontFamily: FONTS[t.display], fontSize: 15, display: "grid", placeItems: "center" }}>
        {styled("Stack", t)}
      </div>
      {section.items.map((item) => (
        <div key={item} style={{ flex: 1, padding: "22px 10px", textAlign: "center", borderLeft: `${t.border}px solid ${t.line}` }}>
          <p style={{ fontFamily: SANS, fontSize: 12.5, color: t.ink, margin: 0 }}>{item}</p>
        </div>
      ))}
    </div>
  );
}

function LogoStrip({ section, ctx }: { section: Extract<TemplateSection, { kind: "logoStrip" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ margin: `10px ${PAD}px 40px`, ...card(ctx), borderRadius: Math.min(t.radius, 26), padding: "26px 34px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 22 }}>
      <span style={label(ctx, 10)}>Trusted by</span>
      {section.items.map((item) => (
        <span key={item} style={{ fontFamily: FONTS[t.display], fontSize: 19, color: t.ink, opacity: 0.55 }}>
          {styled(item, t)}
        </span>
      ))}
    </div>
  );
}

function BookingBar({ section, ctx }: { section: Extract<TemplateSection, { kind: "bookingBar" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ padding: `10px ${PAD}px 48px` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 26,
          background: t.panel,
          border: `${t.border}px solid ${t.line}`,
          borderRadius: 999,
          padding: "16px 18px 16px 34px",
        }}
      >
        {section.fields.map((field) => (
          <div key={field} style={{ flex: 1, borderRight: `1px solid ${t.line}`, paddingRight: 20 }}>
            <p style={{ ...label(ctx, 9.5), margin: 0 }}>{field}</p>
            <p style={{ fontFamily: SANS, fontSize: 13, color: t.ink, margin: "6px 0 0" }}>Any</p>
          </div>
        ))}
        <span style={{ ...button(ctx), padding: "14px 26px" }}>{section.cta}</span>
      </div>
    </div>
  );
}

function GalleryMasonry({ section, ctx }: { section: Extract<TemplateSection, { kind: "galleryMasonry" }>; ctx: Ctx }) {
  const { t } = ctx;
  const variants: ShotVariant[] = ["portrait", "food", "space", "scene", "product", "album"];
  const heights = [260, 200, 230, 190, 250, 210];
  return (
    <div style={{ padding: `30px ${PAD}px 56px` }}>
      <p style={label(ctx, 10)}>{section.caption}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 22 }}>
        {Array.from({ length: section.shots }).map((_, i) => (
          <Photo
            key={i}
            t={t}
            variant={variants[i % variants.length]}
            style={{ height: heights[i % heights.length], marginTop: i % 3 === 1 ? 26 : 0 }}
          />
        ))}
      </div>
    </div>
  );
}

function FooterCta({ section, ctx }: { section: Extract<TemplateSection, { kind: "footerCta" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div style={{ background: t.ink, padding: `64px ${PAD}px` }}>
      <div style={{ display: "grid", gridTemplateColumns: section.newsletter ? "1fr 1fr" : "1fr", gap: 44, alignItems: "center" }}>
        <div>
          <h2 style={{ ...head(ctx, 46), color: t.page, maxWidth: 520 }}>{styled(section.title, t)}</h2>
          <span style={{ ...button(ctx), marginTop: 26, background: t.accent, color: t.onAccent, border: `1px solid ${t.accent}` }}>
            {section.cta}
          </span>
        </div>
        {section.newsletter ? (
          <div>
            <div style={{ display: "flex", gap: 10 }}>
              <span style={{ flex: 1, background: t.page, borderRadius: 6, padding: "15px 18px", fontFamily: SANS, fontSize: 13, color: t.muted }}>
                your@email.com
              </span>
              <span style={{ background: t.accent, color: t.onAccent, borderRadius: 6, padding: "15px 22px", fontFamily: SANS, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Join
              </span>
            </div>
            <div style={{ display: "flex", gap: 40, marginTop: 30 }}>
              {["Company", "Customer service", "More to explore"].map((col) => (
                <div key={col}>
                  <p style={{ ...label(ctx, 9.5), color: t.page, opacity: 0.6, margin: 0 }}>{col}</p>
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 7 }}>
                    {["About", "Contact", "Privacy"].map((row) => (
                      <span key={row} style={{ fontFamily: SANS, fontSize: 12, color: t.page, opacity: 0.75 }}>{row}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FooterBar({ section, ctx }: { section: Extract<TemplateSection, { kind: "footerBar" }>; ctx: Ctx }) {
  const { t } = ctx;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        padding: `26px ${PAD}px`,
        borderTop: `1px solid ${t.line}`,
      }}
    >
      {section.items.map((item, i) => (
        <span
          key={item}
          style={{
            fontFamily: i === 0 ? FONTS[t.display] : SANS,
            fontSize: i === 0 ? 15 : 12,
            color: i === 0 ? t.ink : t.muted,
            letterSpacing: "0.06em",
          }}
        >
          {styled(item, t)}
        </span>
      ))}
    </div>
  );
}

/* ==========================================================================
 *  dispatcher
 * ========================================================================== */

function Section({ section, ctx }: { section: TemplateSection; ctx: Ctx }) {
  switch (section.kind) {
    case "nav": return <Nav section={section} ctx={ctx} />;
    case "heroSplit": return <HeroSplit section={section} ctx={ctx} />;
    case "heroWordmark": return <HeroWordmark section={section} ctx={ctx} />;
    case "heroFullbleed": return <HeroFullbleed section={section} ctx={ctx} />;
    case "heroCentered": return <HeroCentered section={section} ctx={ctx} />;
    case "heroCarousel": return <HeroCarousel section={section} ctx={ctx} />;
    case "heroDome": return <HeroDome section={section} ctx={ctx} />;
    case "heroTypeLed": return <HeroTypeLed section={section} ctx={ctx} />;
    case "marquee": return <Marquee section={section} ctx={ctx} />;
    case "statCards": return <StatCards section={section} ctx={ctx} />;
    case "statBar": return <StatBar section={section} ctx={ctx} />;
    case "featureCards": return <FeatureCards section={section} ctx={ctx} />;
    case "imageTextSplit": return <ImageTextSplit section={section} ctx={ctx} />;
    case "collectionDark": return <CollectionDark section={section} ctx={ctx} />;
    case "caseStudies": return <CaseStudies section={section} ctx={ctx} />;
    case "productGrid": return <ProductGrid section={section} ctx={ctx} />;
    case "menuList": return <MenuList section={section} ctx={ctx} />;
    case "pricing": return <Pricing section={section} ctx={ctx} />;
    case "timeline": return <Timeline section={section} ctx={ctx} />;
    case "windowCards": return <WindowCards section={section} ctx={ctx} />;
    case "codeCard": return <CodeCard section={section} ctx={ctx} />;
    case "iconRow": return <IconRow section={section} ctx={ctx} />;
    case "logoStrip": return <LogoStrip section={section} ctx={ctx} />;
    case "bookingBar": return <BookingBar section={section} ctx={ctx} />;
    case "availabilityCard": return null;
    case "galleryMasonry": return <GalleryMasonry section={section} ctx={ctx} />;
    case "footerCta": return <FooterCta section={section} ctx={ctx} />;
    case "footerBar": return <FooterBar section={section} ctx={ctx} />;
    default:
      return null;
  }
}

/* ==========================================================================
 *  the shell — design width, scaled to fit
 * ========================================================================== */

type Props = {
  template: SiteTemplate;
  /** "card" clips to a tall thumbnail; "full" renders the whole page. */
  variant?: "card" | "full";
};

export default function TemplatePreview({ template, variant = "card" }: Props) {
  const t = template.design;
  const ctx: Ctx = { t };
  const { ref: hostRef, width } = useMeasured<HTMLDivElement>();
  const innerRef = useRef<HTMLDivElement>(null);
  const [innerHeight, setInnerHeight] = useState(0);

  useEffect(() => {
    const node = innerRef.current;
    if (!node) return;
    // clientHeight respects the card's maxHeight, so the thumbnail is clipped
    // to exactly the slice we intend to show.
    const measure = () => setInnerHeight(node.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [variant, template.id]);

  const scale = width > 0 ? width / DESIGN_WIDTH : 0;
  const texture = textureLayer(t);

  return (
    <div
      ref={hostRef}
      className="relative w-full overflow-hidden"
      style={{
        height: scale > 0 && innerHeight > 0 ? innerHeight * scale : undefined,
        background: t.page,
      }}
    >
      <div
        ref={innerRef}
        aria-hidden="true"
        style={{
          width: DESIGN_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: t.page,
          color: t.ink,
          maxHeight: variant === "card" ? CARD_DESIGN_HEIGHT : undefined,
          overflow: variant === "card" ? "hidden" : undefined,
          position: "relative",
        }}
      >
        {texture ? <div style={{ position: "absolute", inset: 0, pointerEvents: "none", ...texture }} /> : null}
        <div style={{ position: "relative" }}>
          {template.sections.map((section, i) => (
            <Section key={`${section.kind}-${i}`} section={section} ctx={ctx} />
          ))}
        </div>
      </div>
    </div>
  );
}
