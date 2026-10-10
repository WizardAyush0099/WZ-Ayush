import { useMemo, useState } from "react";
import { builder, contact } from "../../data/content";
import { templateById, templates, type SiteTemplate } from "../../data/templates";
import { getThemeById, THEMES, type ThemeId } from "../../lib/theme";
import { ORDER_STATUSES, submitOrder, type Order } from "../../lib/orders";
import { track } from "../../lib/telemetry";
import { briefToMessage, buildWhatsAppUrl } from "../../lib/whatsapp";

const fieldClass =
  "w-full border border-bone/15 bg-ink-950 px-4 py-3 font-body text-sm text-bone placeholder:text-bone-dim transition-colors duration-300 focus:border-blood-500/70 focus:outline-none";
const labelClass = "mb-2 block font-body text-[10px] uppercase tracking-cinematic text-bone-dim";

type FormState = {
  name: string;
  email: string;
  phone: string;
  business: string;
  websiteType: string;
  templateId: string;
  features: string[];
  pages: string[];
  wants: string;
  avoids: string;
  references: string;
  goal: string;
  audience: string;
  pagesNeeded: string;
  hasLogo: string;
  hasContent: string;
  needsHosting: string;
  needsUpdates: string;
  budget: string;
  timeline: string;
  conditional: Record<string, string>;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  phone: "",
  business: "",
  websiteType: "",
  templateId: "",
  features: [],
  pages: [],
  wants: "",
  avoids: "",
  references: "",
  goal: "",
  audience: "",
  pagesNeeded: "",
  hasLogo: "",
  hasContent: "",
  needsHosting: "",
  needsUpdates: "",
  budget: "",
  timeline: "",
  conditional: {},
};

type Props = {
  templateId: string | null;
  onSelectTemplate: (template: SiteTemplate) => void;
  theme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
};

/**
 * The eight-step brief.
 *
 * Steps exist so nobody meets a wall of fields at once, and the follow-up
 * questions only appear when the chosen website type actually needs them —
 * a restaurant is never asked about shipping.
 */
export default function OrderForm({ templateId, onSelectTemplate, theme, onSelectTheme }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<Order | null>(null);

  const themeDef = getThemeById(theme);
  const chosen = templateById(templateId ?? form.templateId);
  const conditional = builder.conditional[form.websiteType] ?? [];

  const brief = useMemo(
    () => ({
      name: form.name,
      email: form.email,
      phone: form.phone,
      business: form.business,
      websiteType: form.websiteType,
      templateName: chosen?.name ?? "",
      themeName: themeDef.name,
      features: form.features,
      pagesNeeded: form.pagesNeeded || form.pages.join(", "),
      budget: form.budget,
      timeline: form.timeline,
      wants: form.wants,
      avoids: form.avoids,
      references: form.references,
      goal: form.goal,
      audience: form.audience,
      conditional: form.conditional,
    }),
    [form, chosen, themeDef],
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggle = (key: "features" | "pages", value: string) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));

  const selectTemplate = (template: SiteTemplate) => {
    set("templateId", template.id);
    onSelectTemplate(template);
  };

  /** Step 1 is the only step that can block progress. */
  const validate = (index: number): string => {
    if (index === 0) {
      if (!form.name.trim()) return "Please add your name.";
      if (!form.email.trim() && !form.phone.trim()) {
        return "Add an email or a phone number so I can reach you.";
      }
    }
    return "";
  };

  const next = () => {
    const problem = validate(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStep((s) => Math.min(builder.steps.length - 1, s + 1));
  };

  const back = () => {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Walk back to the first invalid step instead of failing silently.
    for (let i = 0; i < builder.steps.length; i++) {
      const problem = validate(i);
      if (problem) {
        setStep(i);
        setError(problem);
        return;
      }
    }
    setError("");

    const resolvedTemplate = templateById(form.templateId);
    const resolvedTheme = getThemeById(theme);
    const order = submitOrder({
      name: form.name.trim(),
      contact: form.email.trim() || form.phone.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      business: form.business.trim(),
      websiteType: form.websiteType,
      templateId: form.templateId || "undecided",
      templateName: resolvedTemplate?.name ?? "Undecided",
      themeId: theme,
      themeName: resolvedTheme.name,
      features: form.features,
      conditional: form.conditional,
      wants: form.wants.trim(),
      avoids: form.avoids.trim(),
      references: form.references.trim(),
      goal: form.goal.trim(),
      audience: form.audience.trim(),
      pagesNeeded: form.pagesNeeded.trim() || form.pages.join(", "),
      hasLogo: form.hasLogo,
      hasContent: form.hasContent,
      needsHosting: form.needsHosting,
      needsUpdates: form.needsUpdates,
      budget: form.budget,
      timeline: form.timeline,
    });

    track("note", `Brief submitted — ${order.websiteType || "untyped"} / ${order.templateName}`);
    setPlaced(order);
  };

  const reset = () => {
    setPlaced(null);
    setForm(EMPTY);
    setStep(0);
  };

  /* ---------------------------------------------------------------- receipt */

  if (placed) {
    const message = briefToMessage(brief);
    return (
      <div className="border border-blood-500/40 bg-ink-900 p-7 sm:p-9" id="brief-receipt">
        <span className="font-body text-[10px] uppercase tracking-cinematic text-blood-400">
          Brief received
        </span>
        <h3 className="display mt-4 text-3xl text-bone">
          Thank you, {placed.name.split(" ")[0] || "there"}.
        </h3>
        <p className="mt-4 max-w-[54ch] font-body text-sm leading-relaxed text-bone-muted">
          Your brief is saved and waiting in the studio dashboard. Send it straight over and we can
          start the same day — the message arrives pre-filled, so nothing gets retyped.
        </p>

        <dl className="mt-7 grid gap-px overflow-hidden border border-bone/10 sm:grid-cols-2">
          {[
            ["Type", placed.websiteType || "To be discussed"],
            ["Template", placed.templateName],
            ["Palette", placed.themeName],
            ["Features", placed.features.length ? String(placed.features.length) + " selected" : "—"],
            ["Pages", placed.pagesNeeded || "To be discussed"],
            ["Budget", placed.budget || "To be discussed"],
            ["Timeline", placed.timeline || "Flexible"],
            ["Reach at", placed.contact],
          ].map(([label, value]) => (
            <div key={label} className="bg-ink-950/70 p-4">
              <dt className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">{label}</dt>
              <dd className="mt-1.5 font-body text-sm text-bone">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href={buildWhatsAppUrl(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 border border-blood-600/70 bg-blood-600/10 px-6 py-4 font-body text-[12px] font-medium uppercase tracking-wide2 text-bone transition-colors duration-500 ease-silk hover:border-blood-500 hover:bg-blood-600/20"
          >
            Send on WhatsApp
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href={`mailto:${contact.email}?subject=${encodeURIComponent(
              `Website brief — ${placed.websiteType || placed.templateName}`,
            )}&body=${encodeURIComponent(message)}`}
            className="inline-flex items-center gap-3 border border-bone/20 px-6 py-4 font-body text-[12px] font-medium uppercase tracking-wide2 text-bone-muted transition-colors duration-500 ease-silk hover:border-bone/40 hover:text-bone"
          >
            Send by email
            <span aria-hidden="true">✉</span>
          </a>
          <button
            type="button"
            onClick={reset}
            className="font-body text-[11px] uppercase tracking-wide2 text-bone-muted underline decoration-bone/20 underline-offset-4 transition-colors hover:text-bone"
          >
            Start another brief
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ steps */

  const progress = ((step + 1) / builder.steps.length) * 100;

  return (
    <form onSubmit={onSubmit} className="border border-bone/10 bg-ink-900" noValidate>
      {/* Progress + step rail */}
      <div className="border-b border-bone/10 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="font-body text-[10px] uppercase tracking-cinematic text-bone-dim">
            Step {step + 1} of {builder.steps.length}
          </span>
          <span className="font-body text-[11px] text-bone-muted">
            {builder.steps[step].title}
            <span className="ml-2 text-bone-dim">{builder.steps[step].hint}</span>
          </span>
        </div>
        <div className="mt-3 h-px w-full bg-bone/10">
          <div
            className="h-px bg-blood-500 transition-[width] duration-500 ease-silk"
            style={{ width: `${progress}%` }}
          />
        </div>
        <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          {builder.steps.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => {
                  // Only jump back freely; forward must pass validation.
                  if (i <= step) setStep(i);
                  else next();
                }}
                aria-current={i === step ? "step" : undefined}
                className={`font-body text-[10px] uppercase tracking-wide2 transition-colors ${
                  i === step
                    ? "text-bone"
                    : i < step
                      ? "text-blood-400/80 hover:text-bone"
                      : "text-bone-dim hover:text-bone-muted"
                }`}
              >
                {s.key} · {s.title}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="px-5 py-7 sm:px-7 sm:py-8">
        {/* 1 — about you */}
        {step === 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="b-name">
                Your name *
              </label>
              <input
                id="b-name"
                className={fieldClass}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Riya Sharma"
                autoComplete="name"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="b-business">
                Business / brand
              </label>
              <input
                id="b-business"
                className={fieldClass}
                value={form.business}
                onChange={(e) => set("business", e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="b-email">
                Email *
              </label>
              <input
                id="b-email"
                type="email"
                className={fieldClass}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="b-phone">
                WhatsApp / phone
              </label>
              <input
                id="b-phone"
                className={fieldClass}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+91…"
                autoComplete="tel"
              />
            </div>
          </div>
        ) : null}

        {/* 2 — website type + conditional follow-ups */}
        {step === 1 ? (
          <div>
            <span className={labelClass}>What kind of website is this?</span>
            <div className="flex flex-wrap gap-2">
              {builder.websiteTypes.map((type) => {
                const on = form.websiteType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      set("websiteType", on ? "" : type);
                      set("conditional", {});
                    }}
                    className={`border px-3 py-2 font-body text-[10px] uppercase tracking-wide2 transition-colors duration-300 ${
                      on
                        ? "border-blood-500/70 bg-blood-950/40 text-bone"
                        : "border-bone/15 text-bone-muted hover:border-bone/35 hover:text-bone"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            {conditional.length ? (
              <div className="mt-7 border-t border-bone/10 pt-6">
                <p className="font-body text-[10px] uppercase tracking-cinematic text-blood-400">
                  A few {form.websiteType} specifics
                </p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {conditional.map((question) => (
                    <div key={question.key}>
                      <label className={labelClass} htmlFor={`c-${question.key}`}>
                        {question.label}
                      </label>
                      <input
                        id={`c-${question.key}`}
                        className={fieldClass}
                        value={form.conditional[question.key] ?? ""}
                        onChange={(e) =>
                          set("conditional", { ...form.conditional, [question.key]: e.target.value })
                        }
                        placeholder="Answer in a line or two"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* 3 — template */}
        {step === 2 ? (
          <div>
            <span className={labelClass}>Pick the closest starting point</span>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => {
                const on = form.templateId === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => selectTemplate(template)}
                    className={`flex flex-col gap-1 border p-3 text-left transition-colors duration-300 ${
                      on
                        ? "border-blood-500/70 bg-blood-950/30"
                        : "border-bone/15 hover:border-bone/35"
                    }`}
                  >
                    <span className="font-body text-[10px] uppercase tracking-wide2 text-blood-400/80">
                      {template.category}
                    </span>
                    <span className="font-display text-lg text-bone">{template.name}</span>
                    <span className="font-body text-[11px] leading-relaxed text-bone-dim">
                      {template.blurb}
                    </span>
                    <span className="mt-1 font-body text-[10px] uppercase tracking-wide2 text-bone-muted">
                      from {template.startingAt}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                set("templateId", "");
                setForm((prev) => ({ ...prev, templateId: "" }));
              }}
              className={`mt-3 border px-3 py-2 font-body text-[10px] uppercase tracking-wide2 transition-colors ${
                form.templateId === ""
                  ? "border-blood-500/70 text-bone"
                  : "border-bone/15 text-bone-dim hover:border-bone/35 hover:text-bone"
              }`}
            >
              Not sure yet — design something for me
            </button>
          </div>
        ) : null}

        {/* 4 — theme */}
        {step === 3 ? (
          <div>
            <span className={labelClass}>Choose a palette — it applies live</span>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {THEMES.map((option) => {
                const on = option.id === theme;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onSelectTheme(option.id)}
                    className={`flex flex-col gap-2 border p-4 text-left transition-colors duration-300 ${
                      on ? "border-blood-500/70 bg-blood-950/30" : "border-bone/15 hover:border-bone/35"
                    }`}
                  >
                    <span className="flex overflow-hidden rounded-sm border border-bone/15">
                      {option.swatch.map((colour) => (
                        <span key={colour} className="block h-6 w-6" style={{ background: colour }} />
                      ))}
                    </span>
                    <span className="font-body text-[11px] uppercase tracking-wide2 text-bone">
                      {option.name}
                      <span className="ml-2 text-bone-dim">{option.family === "light" ? "Light" : "Dark"}</span>
                    </span>
                    <span className="font-body text-[11px] leading-relaxed text-bone-dim">
                      {option.blurb}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* 5 — features */}
        {step === 4 ? (
          <div className="flex flex-col gap-8">
            <div>
              <span className={labelClass}>Features the site must have</span>
              <div className="flex flex-wrap gap-2">
                {builder.features.map((feature) => {
                  const on = form.features.includes(feature);
                  return (
                    <button
                      key={feature}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle("features", feature)}
                      className={`border px-3 py-2 font-body text-[10px] uppercase tracking-wide2 transition-colors duration-300 ${
                        on
                          ? "border-blood-500/70 bg-blood-950/40 text-bone"
                          : "border-bone/15 text-bone-muted hover:border-bone/35 hover:text-bone"
                      }`}
                    >
                      {feature}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <span className={labelClass}>Pages you need</span>
              <div className="flex flex-wrap gap-2">
                {builder.pageOptions.map((page) => {
                  const on = form.pages.includes(page);
                  return (
                    <button
                      key={page}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle("pages", page)}
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
          </div>
        ) : null}

        {/* 6 — custom requirements */}
        {step === 5 ? (
          <div className="grid gap-5">
            <div>
              <label className={labelClass} htmlFor="b-wants">
                What do you want?
              </label>
              <textarea
                id="b-wants"
                rows={4}
                className={`${fieldClass} resize-y`}
                value={form.wants}
                onChange={(e) => set("wants", e.target.value)}
                placeholder="Colours, sections, the feeling you're after, anything that must be there…"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="b-avoids">
                What do you NOT want?
              </label>
              <textarea
                id="b-avoids"
                rows={4}
                className={`${fieldClass} resize-y`}
                value={form.avoids}
                onChange={(e) => set("avoids", e.target.value)}
                placeholder="Styles you dislike, pages you don't need, things to avoid entirely…"
              />
            </div>
          </div>
        ) : null}

        {/* 7 — references */}
        {step === 6 ? (
          <div>
            <label className={labelClass} htmlFor="b-references">
              Sites you like (one per line)
            </label>
            <textarea
              id="b-references"
              rows={5}
              className={`${fieldClass} resize-y`}
              value={form.references}
              onChange={(e) => set("references", e.target.value)}
              placeholder={"https://an-example-you-like.com\nhttps://another-one.com"}
            />
            <p className="mt-3 font-body text-xs text-bone-dim">
              Links are the fastest way to align on direction — even if it's a site you only like one
              part of. Say which part below if you want.
            </p>
          </div>
        ) : null}

        {/* 8 — project details */}
        {step === 7 ? (
          <div className="grid gap-5">
            {builder.details.map((detail) => (
              <div key={detail.key}>
                <label className={labelClass} htmlFor={`d-${detail.key}`}>
                  {detail.label}
                </label>
                <input
                  id={`d-${detail.key}`}
                  className={fieldClass}
                  value={form[detail.key]}
                  onChange={(e) => set(detail.key, e.target.value)}
                  placeholder={detail.placeholder}
                />
              </div>
            ))}

            <div className="grid gap-5 sm:grid-cols-2">
              {builder.yesNo.map((question) => (
                <div key={question.key}>
                  <label className={labelClass} htmlFor={`y-${question.key}`}>
                    {question.label}
                  </label>
                  <select
                    id={`y-${question.key}`}
                    className={fieldClass}
                    value={form[question.key]}
                    onChange={(e) => set(question.key, e.target.value)}
                  >
                    <option value="">Select…</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="In progress">In progress</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="b-budget">
                  Approximate budget (optional)
                </label>
                <select
                  id="b-budget"
                  className={fieldClass}
                  value={form.budget}
                  onChange={(e) => set("budget", e.target.value)}
                >
                  <option value="">Select a range</option>
                  {builder.budgets.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="b-timeline">
                  Desired timeline
                </label>
                <select
                  id="b-timeline"
                  className={fieldClass}
                  value={form.timeline}
                  onChange={(e) => set("timeline", e.target.value)}
                >
                  <option value="">Select a timeline</option>
                  {builder.timelines.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-6 border border-blood-600/50 bg-blood-950/40 px-4 py-3 font-body text-xs text-blood-200"
          >
            {error}
          </p>
        ) : null}
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-bone/10 px-5 py-5 sm:px-7">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="border border-bone/15 px-5 py-3 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors duration-300 hover:border-bone/35 hover:text-bone disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Back
        </button>

        <div className="flex flex-wrap items-center gap-4">
          <span className="font-body text-[11px] text-bone-dim">
            Step {step + 1} / {builder.steps.length}
          </span>
          {step < builder.steps.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="group relative inline-flex items-center gap-3 overflow-hidden border border-bone/25 px-7 py-3.5 font-body text-[12px] font-medium uppercase tracking-wide2 text-bone transition-colors duration-500 ease-silk hover:border-blood-500/80"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 origin-left scale-x-0 bg-blood-700/40 transition-transform duration-700 ease-silk group-hover:scale-x-100"
              />
              Continue
              <span aria-hidden="true" className="transition-transform duration-500 ease-silk group-hover:translate-x-1">
                →
              </span>
            </button>
          ) : (
            <button
              type="submit"
              className="group relative inline-flex items-center gap-3 overflow-hidden border border-blood-600/70 bg-blood-600/15 px-7 py-3.5 font-body text-[12px] font-medium uppercase tracking-wide2 text-bone transition-colors duration-500 ease-silk hover:border-blood-500"
            >
              Send the brief
              <span aria-hidden="true" className="transition-transform duration-500 ease-silk group-hover:translate-x-1">
                →
              </span>
            </button>
          )}
        </div>
      </div>

      <p className="border-t border-bone/10 px-5 py-4 font-body text-[11px] text-bone-dim sm:px-7">
        {builder.footnote}
      </p>
    </form>
  );
}

/** Exposed for the dashboard copy ("new / reviewing / contacted …"). */
export const STATUS_LABELS = ORDER_STATUSES;
