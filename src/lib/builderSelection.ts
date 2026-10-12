import { useSyncExternalStore } from "react";

/**
 * ============================================================================
 *  BUILDER SELECTION — the concept the visitor is considering
 * ============================================================================
 *  Choosing a concept used to be state inside the builder page, which meant
 *  the standalone template route (`/#/template/<id>`) could not hand a choice
 *  back. This is the one small store both routes share: the selected concept
 *  id, persisted in localStorage so a reload — or a trip through the full-page
 *  preview and back — keeps the visitor's place.
 *
 *  The palette is deliberately not here: that is already a site-wide, persisted
 *  concern in `src/lib/theme.ts`.
 * ============================================================================
 */

const STORAGE_KEY = "wz.builder.template.v1";
const CHANGE_EVENT = "wz:template-changed";

let current: string | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

function ensureLoaded(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    current = raw && raw.trim() ? raw : null;
  } catch {
    current = null;
  }
  window.addEventListener(CHANGE_EVENT, notify);
}

export function getSelectedTemplate(): string | null {
  ensureLoaded();
  return current;
}

export function setSelectedTemplate(id: string | null): void {
  ensureLoaded();
  current = id;
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode — the choice still holds for this visit */
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(fn: () => void): () => void {
  ensureLoaded();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** React binding — the selected concept id, or null. */
export function useSelectedTemplateId(): string | null {
  return useSyncExternalStore(subscribe, getSelectedTemplate, () => null);
}
