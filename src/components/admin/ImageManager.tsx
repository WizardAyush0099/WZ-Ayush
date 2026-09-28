import { useRef, useState } from "react";
import { useStoredImages } from "../../lib/imageStore";
import { track } from "../../lib/telemetry";
import { linkTo } from "../../lib/router";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageManager() {
  const { images, loading, add, remove } = useStoredImages();
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = async (files: FileList | File[] | null) => {
    const list = files ? Array.from(files).filter((f) => f.type.startsWith("image/")) : [];
    if (list.length === 0) {
      setError("Drop an image file (PNG, JPG, WebP or AVIF).");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      for (const file of list) {
        const stored = await add(file, caption || file.name);
        track("image", `Added image — ${stored.caption}`);
      }
      setDone(`${list.length} image${list.length > 1 ? "s" : ""} added to the Archive.`);
      setCaption("");
    } catch {
      setError("That image could not be processed. Try a different file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* Uploader */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void accept(e.dataTransfer.files);
          }}
          className={`relative border border-dashed p-8 transition-colors duration-300 ${
            dragging
              ? "border-blood-500/80 bg-blood-950/25"
              : "border-bone/15 bg-ink-900 hover:border-bone/25"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => void accept(e.target.files)}
          />

          <p className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            Add artwork
          </p>
          <p className="display mt-3 text-2xl text-bone">Drop images here</p>
          <p className="mt-3 max-w-[46ch] font-body text-sm leading-relaxed text-bone-muted">
            Uploaded images are cropped into the site&apos;s Archive gallery on the homepage.
            They are resized in the browser before storage, so a phone photo only costs a few
            hundred kilobytes.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="min-w-0 flex-1 border border-bone/15 bg-ink-950 px-4 py-3 font-body text-sm text-bone placeholder:text-bone-dim focus:border-blood-500/60 focus:outline-none"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="btn disabled:opacity-50"
            >
              {busy ? "Processing…" : "Choose files"}
            </button>
          </div>

          {error && <p className="mt-4 font-body text-xs text-blood-300">{error}</p>}
          {done && <p className="mt-4 font-body text-xs text-emerald-300/90">{done}</p>}
        </div>

        {/* Guidance */}
        <div className="border border-bone/10 bg-ink-900 p-6">
          <p className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            Where they appear
          </p>
          <ul className="mt-5 flex flex-col gap-4 font-body text-sm text-bone-muted">
            <li className="flex gap-3">
              <span className="text-blood-500">01</span>
              The Archive gallery on the homepage — new uploads render first.
            </li>
            <li className="flex gap-3">
              <span className="text-blood-500">02</span>
              Each frame stays clickable and opens full-screen in the lightbox.
            </li>
            <li className="flex gap-3">
              <span className="text-blood-500">03</span>
              Storage is per-browser (IndexedDB), so uploads survive reloads on this device.
            </li>
          </ul>
          <a
            href={linkTo("/")}
            className="mt-7 inline-flex items-center gap-2 border border-bone/15 px-5 py-2.5 font-body text-[11px] uppercase tracking-wide2 text-bone-muted transition-colors hover:border-bone/30 hover:text-bone"
          >
            <span aria-hidden="true">↗</span> Open the homepage archive
          </a>
        </div>
      </div>

      {/* Library */}
      <section className="border border-bone/10 bg-ink-900">
        <header className="flex items-center justify-between border-b border-bone/10 px-5 py-4">
          <h2 className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">Library</h2>
          <span className="font-body text-[10px] uppercase tracking-wide2 text-bone-dim">
            {images.length} image{images.length === 1 ? "" : "s"}
          </span>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="block aspect-[4/3] animate-pulse bg-bone/5" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <p className="px-5 py-10 font-body text-xs text-bone-dim">
            Nothing uploaded yet. Add your first image above and it appears in the Archive.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
              <figure key={image.id} className="group relative overflow-hidden border border-bone/10">
                <img
                  src={image.dataUrl}
                  alt={image.caption}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-[900ms] ease-silk group-hover:scale-105"
                />
                <figcaption className="flex items-center justify-between gap-2 bg-ink-950 px-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate font-body text-[11px] text-bone">
                      {image.caption}
                    </span>
                    <span className="block font-body text-[9px] uppercase tracking-wide2 text-bone-dim">
                      {image.width}×{image.height} · {formatBytes(image.bytes)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove “${image.caption}” from the archive?`)) {
                        void remove(image.id);
                      }
                    }}
                    aria-label={`Remove ${image.caption}`}
                    className="shrink-0 border border-transparent px-2 py-1 font-body text-[10px] uppercase tracking-wide2 text-bone-dim transition-colors hover:border-blood-700/60 hover:text-blood-300"
                  >
                    Delete
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
