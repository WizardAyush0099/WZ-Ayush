import { contact, meta } from "../data/content";

/**
 * ============================================================================
 *  WHATSAPP — direct line for commission enquiries
 * ============================================================================
 *  Prefers `VITE_WHATSAPP_NUMBER` (keeps the number out of source), falling
 *  back to `contact.whatsapp` in src/data/content.ts. Formatting characters
 *  are stripped so `+91 98765 43210` and `919876543210` both work.
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

/** The fields the form hands over when building the chat message. */
export type WhatsAppBrief = {
  name: string;
  contact: string;
  business: string;
  templateName: string;
  themeName: string;
  pages: string[];
  budget: string;
  timeline: string;
  wants: string;
  avoids: string;
  references: string;
};

/** A short opener for the always-visible WhatsApp button. */
export function introMessage(): string {
  return `Hi ${meta.studio}, I found your portfolio and I'd like to talk about getting a website built.`;
}

/** Turn a filled brief into a readable WhatsApp message. */
export function briefToMessage(brief: WhatsAppBrief): string {
  const lines: Array<string | null> = [
    `Hi ${meta.studio}, I'd like to order a website.`,
    "",
    `Name: ${brief.name || "—"}`,
    brief.business ? `Business: ${brief.business}` : null,
    `Reach me at: ${brief.contact || "—"}`,
    `Template: ${brief.templateName || "Not sure yet"}`,
    `Theme: ${brief.themeName}`,
    brief.pages.length ? `Pages: ${brief.pages.join(", ")}` : null,
    brief.budget ? `Budget: ${brief.budget}` : null,
    brief.timeline ? `Timeline: ${brief.timeline}` : null,
  ];

  if (brief.wants) lines.push("", `What I want: ${brief.wants}`);
  if (brief.avoids) lines.push("", `What I don't want: ${brief.avoids}`);
  if (brief.references) lines.push("", `References: ${brief.references}`);

  return lines.filter((line): line is string => line !== null).join("\n");
}
