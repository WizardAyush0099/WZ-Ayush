import { builder, contact, meta } from "../data/content";
import { templateById } from "../data/templates";

/**
 * ============================================================================
 *  WHATSAPP — direct line for commission enquiries
 * ============================================================================
 *  Prefers `VITE_WHATSAPP_NUMBER` (keeps the number out of source), falling
 *  back to `contact.whatsapp` in src/data/content.ts. Formatting characters
 *  are stripped so `+91 83530 11030` and `918353011030` both work.
 * ============================================================================
 */

export function whatsAppNumber(): string {
  const env = ((import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? "").trim();
  const raw = env || contact.whatsapp || "";
  return raw.replace(/[^\d]/g, "");
}

export function buildWhatsAppUrl(message: string): string {
  const number = whatsAppNumber();
  const base = number ? `https://wa.me/${number}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** A short opener for the always-visible WhatsApp buttons. */
export function introMessage(): string {
  return `Hi ${meta.studio}, I found your portfolio and I'd like to talk about getting a website built.`;
}

/** The fields the builder hands over when composing the chat message. */
export type WhatsAppBrief = {
  name: string;
  email: string;
  phone: string;
  business: string;
  websiteType: string;
  templateName: string;
  themeName: string;
  features: string[];
  pagesNeeded: string;
  budget: string;
  timeline: string;
  wants: string;
  avoids: string;
  references: string;
  goal: string;
  audience: string;
  conditional: Record<string, string>;
};

/** Look up the label for a conditional answer key ("payments" → "Which payment…"). */
function conditionalLabel(type: string, key: string): string {
  const questions = builder.conditional[type] ?? [];
  return questions.find((q) => q.key === key)?.label ?? key;
}

/** Turn a filled brief into a readable WhatsApp message. */
export function briefToMessage(brief: WhatsAppBrief): string {
  const lines: Array<string | null> = [
    `Hi ${meta.studio}, I'd like to order a website.`,
    "",
    `Name: ${brief.name || "—"}`,
    brief.business ? `Business: ${brief.business}` : null,
    brief.email ? `Email: ${brief.email}` : null,
    brief.phone ? `WhatsApp: ${brief.phone}` : null,
    brief.websiteType ? `Type: ${brief.websiteType}` : null,
    `Template: ${brief.templateName || "Not sure yet"}`,
    `Theme: ${brief.themeName}`,
    brief.features.length ? `Features: ${brief.features.join(", ")}` : null,
    brief.pagesNeeded ? `Pages: ${brief.pagesNeeded}` : null,
    brief.budget ? `Budget: ${brief.budget}` : null,
    brief.timeline ? `Timeline: ${brief.timeline}` : null,
  ];

  const answers = Object.entries(brief.conditional).filter(([, value]) => value.trim());
  if (answers.length) {
    lines.push("", `${brief.websiteType || "Project"} details:`);
    answers.forEach(([key, value]) => {
      lines.push(`• ${conditionalLabel(brief.websiteType, key)} ${value}`.trim());
    });
  }

  if (brief.goal) lines.push("", `What it's for: ${brief.goal}`);
  if (brief.audience) lines.push("", `Audience: ${brief.audience}`);
  if (brief.wants) lines.push("", `What I want: ${brief.wants}`);
  if (brief.avoids) lines.push("", `What I don't want: ${brief.avoids}`);
  if (brief.references) lines.push("", `References: ${brief.references}`);

  return lines.filter((line): line is string => line !== null).join("\n");
}

/** Convenience: the template's display name for a stored id. */
export function templateNameOf(id: string): string {
  return templateById(id)?.name ?? "";
}
