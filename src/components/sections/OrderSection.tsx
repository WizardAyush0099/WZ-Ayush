import { useEffect, useMemo, useState } from "react";
import { order as orderCopy, templateById, templates } from "../../data/content";
import { getThemeById, type ThemeId } from "../../lib/theme";
import { submitOrder, type Order } from "../../lib/orders";
import { track } from "../../lib/telemetry";
import { briefToMessage, buildWhatsAppUrl, introMessage, whatsAppNumber } from "../../lib/whatsapp";
import { RevealText } from "../common/Reveal";

const fieldClass =
  "w-full border border-bone/15 bg-ink-950 px-4 py-3 font-body text-sm text-bone placeholder:text-bone-dim transition-colors duration-300 focus:border-blood-500/70 focus:outline-none";
const labelClass = "mb-2 block font-body text-[10px] uppercase tracking-cinematic text-bone-dim";

type Props = {
  /** Template picked in the section above (may be empty). */
  templateId: string | null;
  /** Palette currently applied — used as the default for the brief. */
  theme: ThemeId;
};

type FormState = {
  name: string;
  contact: string;
  business: string;
  templateId: string;
  pages: string[];
  budget: string;
  timeline: string;
  wants: string;
  avoids: string;
  references: string;
};

const EMPTY: FormState = {
  name: "",
  contact: "",
  business: "",
  templateId: "",
  pages: [],
  budget: "",
  timeline: "",
  wants: "",
  avoids: "",
  references: "",
};

export default function OrderSection({ templateId, theme }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<Order | null>(null);
  const configured = whatsAppNumber().length > 0;

  // Keep the form aligned with the template/palette chosen above.
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      templateId: templateId ?? prev.templateId,
    }));
  }, [templateId]);

  const themeDef = getThemeById(theme);
  const chosenTemplate = templateById(form.templateId);

  const brief = useMemo(
    () => ({
      name: form.name,
      contact: form.contact,
      business: form.business,
      templateName: chosenTemplate?.name ?? "",
      themeName: themeDef.name,
      pages: form.pages,
      budget: form.budget,
      timeline: form.timeline,
      wants: form.wants,
      avoids: form.avoids,
      references: form.references,
    }),
    [form, chosenTemplate, themeDef],
  );

  const togglePage = (page: string) => {
    setForm((prev) => ({
      ...prev,
      pages: prev.pages.includes(page)
        ? prev.pages.filter((p) => p !== page)
        : [...prev.pages, page],
    }));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) {
      setError("Please add your name and a way to reach you.");
      return;
    }
    setError("");
    const order = submitOrder({
      name: form.name.trim(),
      contact: form.contact.trim(),
      business: form.business.trim(),
      templateId: form.templateId || "undecided",
      templateName: chosenTemplate?.name ?? "Undecided",
      themeId: theme,
      themeName: themeDef.name,
      pages: form.pages,
      budget: form.budget,
      timeline: form.timeline,
      wants: form.wants.trim(),
      avoids: form.avoids.trim(),
      references: form.references.trim(),
    });
    track("note", `Order placed — ${order.templateName} (${order.themeName})`);
    setPlaced(order);
    window.scrollTo({ top: window.scrollY - 60, behavior: "smooth" });
  };

  const reset = () => {
    setPlaced(null);
    setForm({ ...EMPTY, templateId: templateId ?? "" });
  };

  return (
    <section
      id="order"
      className="relative z-10 bg-ink-950 py-24 md:py-32"
      aria-labelledby="order-title"
    >
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Pitch */}
          <div className="lg:col-span-5">
            <RevealText stagger className="flex flex-col gap-6">
              <span className="eyebrow">{orderCopy.eyebrow}</span>
              <h2 id="order-title" className="display text-[11vw] leading-[0.92] sm:text-5xl lg:text-[3.4rem]">
                {orderCopy.title}
              </h2>
              <p className="max-w-[46ch] font-body text-base leading-relaxed text-bone-muted">
                {orderCopy.lede}
              </p>
            </RevealText>

            <ol className="mt-10 flex flex-col gap-6 border-t border-bone/10 pt-8">
              {orderCopy.steps.map((step) => (
                <li key={step.key} className="flex gap-5">
                  <span className="font-body text-[11px] tracking-cinematic text-blood-500/80">
                    {step.key}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="font-display text-lg text-bone">{step.title}</span>
                    <span className="max-w-[42ch] font-body text-sm leading-relaxed text-bone-dim">
                      {step.body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href={buildWhatsAppUrl(introMessage())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 border border-bone/25 px-6 py-4 font-body text-[12px] font-medium uppercase tracking-wide2 text-bone transition-colors duration-500 ease-silk hover:border-blood-500/80"
              >
                Chat on WhatsApp
                <span aria-hidden="true">↗</span>
              </a>
              <span className="max-w-[30ch] font-body text-[11px] leading-relaxed text-bone-dim">
                {configured
                  ? "Fastest reply. Your message opens pre-filled."
                  : "Set VITE_WHATSAPP_NUMBER (or contact.whatsapp) to point this at your number."}
              </span>
            </div>

            <p className="mt-8 font-body text-[11px] leading-relaxed text-bone-dim">
              {orderCopy.footnote}
            </p>
          </div>

          {/* Form / confirmation */}
          <div className="lg:col-span-7">
            {placed ? (
              <div className="border border-blood-500/40 bg-ink-900 p-7 sm:p-9">
                <span className="font-body text-[10px] uppercase tracking-cinematic text-blood-400">
                  Brief received
                </span>
                <h3 className="display mt-4 text-3xl text-bone">Thank you, {placed.name.split(" ")[0]}.</h3>
                <p className="mt-4 font-body text-sm leading-relaxed text-bone-muted">
                  Your brief is saved and waiting in the studio dashboard. Send it straight to
                  WhatsApp below and we can start the same day.
                </p>

                <dl className="mt-7 grid gap-px overflow-hidden border border-bone/10 sm:grid-cols-2">
                  {[
                    ["Template", placed.templateName],
                    ["Palette", placed.themeName],
                    ["Pages", placed.pages.length ? placed.pages.join(", ") : "To be discussed"],
                    ["Budget", placed.budget || "To be discussed"],
                    ["Timeline", placed.timeline || "Flexible"],
                    ["Reach at", placed.contact],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-ink-950/70 p-4">
                      <dt className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                        {label}
                      </dt>
                      <dd className="mt-1.5 font-body text-sm text-bone">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <a
                    href={buildWhatsAppUrl(briefToMessage(brief))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 border border-blood-600/70 bg-blood-600/10 px-6 py-4 font-body text-[12px] font-medium uppercase tracking-wide2 text-bone transition-colors duration-500 ease-silk hover:border-blood-500 hover:bg-blood-600/20"
                  >
                    Send on WhatsApp
                    <span aria-hidden="true">↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={reset}
                    className="font-body text-[11px] uppercase tracking-wide2 text-bone-muted underline decoration-bone/20 underline-offset-4 transition-colors hover:text-bone"
                  >
                    Send another brief
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="border border-bone/10 bg-ink-900 p-6 sm:p-8" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="order-name">
                      Your name *
                    </label>
                    <input
                      id="order-name"
                      className={fieldClass}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Riya Sharma"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="order-contact">
                      Email or WhatsApp *
                    </label>
                    <input
                      id="order-contact"
                      className={fieldClass}
                      value={form.contact}
                      onChange={(e) => setForm({ ...form, contact: e.target.value })}
                      placeholder="you@example.com / +91…"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="order-business">
                      Business / brand
                    </label>
                    <input
                      id="order-business"
                      className={fieldClass}
                      value={form.business}
                      onChange={(e) => setForm({ ...form, business: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="order-template">
                      Template
                    </label>
                    <select
                      id="order-template"
                      className={fieldClass}
                      value={form.templateId}
                      onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                    >
                      <option value="">Not sure yet / my own design</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <span className={labelClass}>Pages / features you need</span>
                  <div className="flex flex-wrap gap-2">
                    {orderCopy.pageOptions.map((page) => {
                      const on = form.pages.includes(page);
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => togglePage(page)}
                          aria-pressed={on}
                          className={`border px-3 py-2 font-body text-[10px] uppercase tracking-wide2 transition-colors duration-300 ${
                            on
                              ? "border-blood-500/70 bg-blood-950/40 text-bone"
                              : "border-bone/15 text-bone-muted hover:border-bone/35 hover:text-bone"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="order-budget">
                      Budget
                    </label>
                    <select
                      id="order-budget"
                      className={fieldClass}
                      value={form.budget}
                      onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    >
                      <option value="">Select a range</option>
                      {orderCopy.budgets.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="order-timeline">
                      Timeline
                    </label>
                    <select
                      id="order-timeline"
                      className={fieldClass}
                      value={form.timeline}
                      onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                    >
                      <option value="">Select a timeline</option>
                      {orderCopy.timelines.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 grid gap-5">
                  <div>
                    <label className={labelClass} htmlFor="order-wants">
                      What do you want?
                    </label>
                    <textarea
                      id="order-wants"
                      rows={3}
                      className={`${fieldClass} resize-y`}
                      value={form.wants}
                      onChange={(e) => setForm({ ...form, wants: e.target.value })}
                      placeholder="Colours, sections, the feeling you're after, anything that must be there…"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="order-avoids">
                      What do you NOT want?
                    </label>
                    <textarea
                      id="order-avoids"
                      rows={3}
                      className={`${fieldClass} resize-y`}
                      value={form.avoids}
                      onChange={(e) => setForm({ ...form, avoids: e.target.value })}
                      placeholder="Things to avoid, pages you don't need, styles you dislike…"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="order-references">
                      Sites you like (one per line)
                    </label>
                    <textarea
                      id="order-references"
                      rows={2}
                      className={`${fieldClass} resize-y`}
                      value={form.references}
                      onChange={(e) => setForm({ ...form, references: e.target.value })}
                      placeholder="https://…"
                    />
                  </div>
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="mt-5 border border-blood-600/50 bg-blood-950/40 px-4 py-3 font-body text-xs text-blood-200"
                  >
                    {error}
                  </p>
                ) : null}

                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <button
                    type="submit"
                    className="group relative inline-flex items-center gap-3 overflow-hidden border border-bone/25 px-8 py-4 font-body text-[12px] font-medium uppercase tracking-wide2 text-bone transition-colors duration-500 ease-silk hover:border-blood-500/80"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 -z-10 origin-left scale-x-0 bg-blood-700/40 transition-transform duration-700 ease-silk group-hover:scale-x-100"
                    />
                    Send the brief
                    <span aria-hidden="true" className="transition-transform duration-500 ease-silk group-hover:translate-x-1">
                      →
                    </span>
                  </button>
                  <span className="font-body text-[11px] text-bone-dim">
                    Sends to the studio dashboard instantly.
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
