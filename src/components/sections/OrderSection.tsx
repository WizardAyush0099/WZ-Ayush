import { order as orderCopy } from "../../data/content";
import { templateById, type SiteTemplate } from "../../data/templates";
import { getThemeById, type ThemeId } from "../../lib/theme";
import { buildWhatsAppUrl, introMessage } from "../../lib/whatsapp";
import { RevealText } from "../common/Reveal";
import OrderForm from "../builder/OrderForm";

type Props = {
  /** Template picked in the section above (may be empty). */
  templateId: string | null;
  onSelectTemplate: (template: SiteTemplate) => void;
  /** Palette currently applied — used as the default for the brief. */
  theme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
};

/**
 * ============================================================================
 *  COMMISSIONS — the brief, right here on the homepage
 * ============================================================================
 *  Same eight-step form the builder route uses (one implementation, two
 *  entrances), paired with a plain explanation of what happens after it is
 *  sent. The visitor never has to leave the page they were reading to start a
 *  project — and the full guided flow is still there at /#/builder for anyone
 *  who wants the template library first.
 * ============================================================================
 */
export default function OrderSection({
  templateId,
  onSelectTemplate,
  theme,
  onSelectTheme,
}: Props) {
  const active = templateId ? templateById(templateId) : undefined;
  const palette = getThemeById(theme);

  return (
    <section
      id="order"
      className="relative z-10 bg-ink-950 py-20 md:py-28"
      aria-labelledby="order-title"
    >
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Pitch + what happens next */}
          <div className="lg:col-span-4">
            <RevealText stagger className="flex flex-col gap-5">
              <span className="eyebrow">{orderCopy.eyebrow}</span>
              <h2
                id="order-title"
                className="display text-[12vw] leading-[0.92] text-bone sm:text-5xl"
              >
                {orderCopy.title}
              </h2>
              <p className="max-w-[46ch] font-body text-base leading-relaxed text-bone-muted">
                {orderCopy.lede}
              </p>
            </RevealText>

            <ol className="mt-10 flex flex-col gap-6 border-t border-bone/10 pt-8">
              {orderCopy.steps.map((step) => (
                <li key={step.key} className="flex gap-4">
                  <span className="font-body text-[10px] uppercase tracking-cinematic text-blood-500/80">
                    {step.key}
                  </span>
                  <div>
                    <h3 className="display text-lg leading-tight text-bone">{step.title}</h3>
                    <p className="mt-1.5 max-w-[42ch] font-body text-sm leading-relaxed text-bone-muted">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <dl className="mt-9 flex flex-col gap-4 border-t border-bone/10 pt-7">
              {active ? (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                    Template
                  </dt>
                  <dd className="font-body text-sm text-bone">{active.name}</dd>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                  Palette
                </dt>
                <dd className="font-body text-sm text-bone">{palette.name}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                  Reply time
                </dt>
                <dd className="font-body text-sm text-bone">Within one working day</dd>
              </div>
            </dl>

            <a
              href={buildWhatsAppUrl(introMessage())}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="hover"
              className="mt-8 inline-flex items-center gap-3 border border-bone/20 px-5 py-3.5 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors duration-500 ease-silk hover:border-blood-500/70 hover:text-bone"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" aria-hidden="true" />
              Prefer to chat? WhatsApp
            </a>
          </div>

          {/* The brief itself */}
          <div className="lg:col-span-8">
            <OrderForm
              templateId={templateId}
              onSelectTemplate={onSelectTemplate}
              theme={theme}
              onSelectTheme={onSelectTheme}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
