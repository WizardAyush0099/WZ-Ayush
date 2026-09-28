import { useCallback, useEffect, useState } from "react";

/**
 * ============================================================================
 *  IMAGE STORE — IndexedDB backed, survives reloads
 * ============================================================================
 *  Used by the admin dashboard to add artwork to the live site. Images are
 *  downscaled in the browser before being stored, so a 12 MP phone photo
 *  costs a few hundred kilobytes instead of twelve megabytes.
 * ============================================================================
 */

const DB_NAME = "wz-portfolio";
const DB_VERSION = 1;
const STORE = "images";
const MAX_EDGE = 1800;

export type StoredImage = {
  id: string;
  name: string;
  caption: string;
  dataUrl: string;
  bytes: number;
  width: number;
  height: number;
  createdAt: number;
};

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest,
): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, mode);
    const request = run(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => resolve(null);
  });
}

export async function listImages(): Promise<StoredImage[]> {
  const all = await withStore<StoredImage[]>("readonly", (s) => s.getAll());
  return (all ?? []).sort((a, b) => b.createdAt - a.createdAt);
}

export async function addImage(file: File, caption: string): Promise<StoredImage> {
  const bitmap = await loadBitmap(file);
  const { dataUrl, width, height } = await downscale(bitmap);
  const image: StoredImage = {
    id: `img_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: file.name.replace(/\.[^.]+$/, ""),
    caption: caption.trim() || file.name,
    dataUrl,
    bytes: Math.round((dataUrl.length * 3) / 4),
    width,
    height,
    createdAt: Date.now(),
  };
  await withStore("readwrite", (s) => s.put(image));
  return image;
}

export async function removeImage(id: string): Promise<void> {
  await withStore("readwrite", (s) => s.delete(id));
}

/* -------------------------------------------------------------------------- */
/*  Decoding / resizing                                                       */
/* -------------------------------------------------------------------------- */

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img> decoding */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // The decoded image keeps its own copy, so the object URL can go.
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

async function downscale(source: ImageBitmap | HTMLImageElement) {
  const sw = "width" in source ? source.width : 0;
  const sh = "height" in source ? source.height : 0;
  const scale = Math.min(1, MAX_EDGE / Math.max(sw, sh || 1));
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // Keep the flow alive even on a canvas failure.
    return { dataUrl: "", width: sw, height: sh };
  }
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
  if ("close" in source) source.close();
  return { dataUrl: canvas.toDataURL("image/webp", 0.82), width, height };
}

/* -------------------------------------------------------------------------- */
/*  React binding                                                             */
/* -------------------------------------------------------------------------- */

export function useStoredImages() {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await listImages();
    setImages(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener("wz:images-changed", onChange);
    return () => window.removeEventListener("wz:images-changed", onChange);
  }, [refresh]);

  const add = useCallback(
    async (file: File, caption: string) => {
      const image = await addImage(file, caption);
      window.dispatchEvent(new Event("wz:images-changed"));
      return image;
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    await removeImage(id);
    window.dispatchEvent(new Event("wz:images-changed"));
  }, []);

  return { images, loading, add, remove, refresh };
}
