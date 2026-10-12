import { useMemo, useRef, useState } from "react";
import { templates, templateById } from "../../data/templates";
import { templatePhotoSlots } from "../../data/photos";
import { defaultTemplatePhotos } from "../../data/photos";
import {
  publishSiteData,
  resetTemplatePhotos,
  setTemplatePhoto,
  useSiteData,
  useTemplatePhotos,
} from "../../lib/siteData";
import { useStoredImages } from "../../lib/imageStore";
import { track } from "../../lib/telemetry";

/**
 * ============================================================================
 *  TEMPLATE PHOTOS — swap the picture inside any concept
 * ============================================================================
 *  Every concept ships with free photography of the business it is drawn for.
 *  This panel replaces any single picture, per template, two ways:
 *
 *    URL / path   — paste an image URL (or a repo path like
 *                   `assets/templates/foo.webp`). Stored in the site document,
 *                   so it publishes to every visitor.
 *    Upload       — pick a file from this device. Downscaled, kept in this
 *                   browser's image store, and referenced by id, so the
 *                   document stays small. It is live on this device straight
 *                   away; publish a URL instead when everyone must see it.
 *
 *  "Reset" puts the original shipped photograph back.
 * ============================================================================
 */

type Note = { kind: "ok" | "warn"; text: string } | null;

export default function PhotosPanel() {
  const site = useSiteData();
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const template = useMemo(() => templateById(templateId) ?? templates[0], [templateId]);
  const slots = useMemo(() => templatePhotoSlots(template.id), [template.id]);
  const resolved = useTemplatePhotos(template.id);
  const stored = site.photos[template.id];
  const { add } = useStoredImages();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Note>(null);
  const [publishing, setPublishing] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const currentDefault = useMemo(() => defaultTemplatePhotos(template.id), [template.id]);

  const apply = (index: number, url: string, message: string) => {
    setTemplatePhoto(template.id, index, url);
    setNote({ kind: "ok", text: message });
  };

  const onUrl = (index: number, label: string) => {
    const value = (drafts[`${template.id}:${index}`] ?? "").trim();
    if (!value) {
      setNote({ kind: "warn", text: "Paste an image URL or a path such as assets/photo.webp first." });
      return;
    }
    apply(index, value, `${label} for ${template.name} set to the pasted image.`);
    setDrafts((prev) => ({ ...prev, [`${template.id}:${index}`]: "" }));
    track("image", `Template photo replaced — ${template.name} / ${label}`);
  };

  const onUpload = async (index: number, label: string, file: File | undefined) => {
    if (!file) return;
    setBusy(`${index}`);
    setNote(null);
    try {
      const image = await add(file, `${template.name} — ${label}`);
      apply(
        index,
        `idb:${image.id}`,
        `${label} replaced with your upload. It shows on this device now; paste a hosted URL to make it live for everyone.`,
      );
    } catch {
      setNote({ kind: "warn", text: "That file could not be processed. Try a JPG, PNG or WebP." });
    } finally {
      setBusy(null);
      const input = fileInputs.current[`${template.id}:${index}`];
      if (input) input.value = "";
    }
  };

  const publish = async () => {
    setPublishing(true);
    setNote(null);
    const result = await publishSiteData();
    setNote({ kind: result.ok ? "ok" : "warn", text: result.detail });
    setPublishing(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 border border-bone/10 bg-ink-900 p-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:p-7">
        <div>
          <p className="font-body text-[10px] uppercase tracking-cinematic text-bone-dim">
            Concept
          </p>
          <div className="mt-4 flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-1">
            {templates.map((item) => {
              const on = item.id === template.id;
              const custom = Boolean(site.photos[item.id]);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTemplateId(item.id)}
                  aria-pressed={on}
                  className={`flex items-center justify-between gap-3 border px-3 py-2.5 text-left transition-colors duration-300 ${
                    on
                      ? "border-blood-500/70 bg-blood-950/30"
                      : "border-bone/10 hover:border-bone/30"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-body text-sm text-bone">{item.name}</span>
                    <span className="block truncate font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                      {item.business}
                    </span>
                  </span>
                  {custom ? (
                    <span
                      className="shrink-0 border border-blood-500/50 px-1.5 py-0.5 font-body text-[9px] uppercase tracking-wide2 text-blood-300"
                      title="This concept has photography of your own"
                    >
                      edited
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-body text-[10px] uppercase tracking-cinematic text-bone-dim">
                {template.business} · {template.category}
              </p>
              <h2 className="display mt-2 text-2xl text-bone">{template.name}</h2>
              <p className="mt-2 max-w-[62ch] font-body text-sm leading-relaxed text-bone-muted">
                Replace any picture below. Paste a hosted URL to publish it for every visitor, or
                upload a file to use it on this device immediately.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {stored ? (
                <button
                  type="button"
                  onClick={() => {
                    resetTemplatePhotos(template.id);
                    setNote({ kind: "ok", text: `${template.name} is back to the shipped photography.` });
                  }}
                  className="border border-bone/20 px-4 py-2.5 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/40 hover:text-bone"
                >
                  Reset all
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void publish()}
                disabled={publishing}
                className="border border-blood-600/70 bg-blood-600/15 px-4 py-2.5 font-body text-[10px] uppercase tracking-wide2 text-bone transition-colors hover:border-blood-400 disabled:opacity-50"
              >
                {publishing ? "Publishing…" : "Publish to all visitors"}
              </button>
            </div>
          </div>

          {note ? (
            <p
              className={`mt-5 border px-4 py-3 font-body text-xs leading-relaxed ${
                note.kind === "ok"
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-200"
                  : "border-amber-500/30 bg-amber-500/5 text-amber-200"
              }`}
            >
              {note.text}
            </p>
          ) : null}

          <ul className="mt-7 grid gap-5 sm:grid-cols-2">
            {slots.map((slot, index) => {
              const url = resolved[index] ?? "";
              const overridden = Boolean(stored) && stored?.[index] !== currentDefault[index];
              const draftKey = `${template.id}:${index}`;
              return (
                <li key={slot.key} className="flex flex-col border border-bone/10 bg-ink-950">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-900">
                    {url ? (
                      <img src={url} alt={`${template.name} — ${slot.label}`} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                        No image
                      </span>
                    )}
                    {overridden ? (
                      <span className="absolute left-3 top-3 border border-blood-500/60 bg-ink-950/85 px-2 py-1 font-body text-[9px] uppercase tracking-wide2 text-blood-300">
                        Yours
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div>
                      <p className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                        Slot {index + 1}
                      </p>
                      <p className="mt-1 font-body text-sm text-bone">{slot.label}</p>
                    </div>

                    <label className="flex flex-col gap-2">
                      <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
                        Image URL or path
                      </span>
                      <input
                        type="url"
                        inputMode="url"
                        value={drafts[draftKey] ?? ""}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [draftKey]: e.target.value }))}
                        placeholder="https://… or assets/photo.webp"
                        className="border border-bone/15 bg-bone/5 px-3 py-2.5 font-body text-xs text-bone outline-none transition-colors focus:border-blood-500/70"
                      />
                    </label>

                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUrl(index, slot.label)}
                        className="border border-bone/20 px-3.5 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-blood-500/60 hover:text-bone"
                      >
                        Use URL
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputs.current[draftKey]?.click()}
                        disabled={busy === `${index}`}
                        className="border border-bone/20 px-3.5 py-2 font-body text-[10px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-blood-500/60 hover:text-bone disabled:opacity-50"
                      >
                        {busy === `${index}` ? "Working…" : "Upload"}
                      </button>
                      {overridden ? (
                        <button
                          type="button"
                          onClick={() => apply(index, "", `${slot.label} is back to the original photograph.`)}
                          className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim underline decoration-bone/20 underline-offset-4 transition-colors hover:text-bone"
                        >
                          Reset slot
                        </button>
                      ) : null}
                      <input
                        ref={(node) => {
                          fileInputs.current[draftKey] = node;
                        }}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => void onUpload(index, slot.label, e.target.files?.[0])}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
