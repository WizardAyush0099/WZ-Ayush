import type { SlotFilm } from "../../data/imageSlots";

/**
 * ============================================================================
 *  FRAME RUN — one numbered sequence, loaded once, shared by every frame
 * ============================================================================
 *  The hero's run is loaded by `ScrollMedia`, which owns its own copy because
 *  there is exactly one of it. A grid of slots is different: several tiles can
 *  play different passages of the SAME run, and loading that run once per tile
 *  would mean that many times the bandwidth and that many copies of every
 *  decoded frame in memory.
 *
 *  So a run is acquired, not loaded: the first frame that asks for a folder
 *  starts it, and every other frame with the same folder, count and extension
 *  gets the same object back. Frames stream in the same way the hero's do —
 *  frame 0 first, then a coarse ladder, then the rest — and subscribers are told
 *  when more have landed so a canvas can repaint.
 *
 *  Frames are addressed exactly like `ScrollMedia.frameUrl`: zero-padded to
 *  three digits, starting at `000`. A folder of `001…240` will therefore miss
 *  every frame; see docs/ASSET_WORKFLOW.md.
 * ============================================================================
 */

/** Ceiling on frames we are willing to hold, matching `ScrollMedia`. */
const MAX_FRAMES = 600;
const LADDER_SPACING = 12;
const LADDER_MIN_STEPS = 24;
const LADDER_CONCURRENCY = 4;
const STREAM_CONCURRENCY = 6;

export type FrameRun = {
  key: string;
  count: number;
  /** The stills themselves. An entry exists before its image has loaded. */
  images: HTMLImageElement[];
  decoded: boolean[];
  /** 0 → 1, how much of the run has landed. */
  progress: () => number;
  complete: () => boolean;
  /** Called when a batch of frames arrives. Returns the unsubscribe. */
  subscribe: (listener: () => void) => () => void;
};

/** `assets/sequence/000.webp` — zero-padded, same as the hero's loader. */
export function frameUrlIn(film: { dir: string; ext: string }, index: number): string {
  return `${film.dir.replace(/\/+$/, "")}/${String(index).padStart(3, "0")}.${film.ext}`;
}

const RUNS = new Map<string, FrameRun>();

/** Get the shared run for a film, starting it if nobody has yet. */
export function acquireRun(film: SlotFilm): FrameRun {
  const count = Math.max(1, Math.min(MAX_FRAMES, Math.round(film.count) || 1));
  const key = `${film.dir.replace(/\/+$/, "")}|${count}|${film.ext}`;
  const existing = RUNS.get(key);
  if (existing) return existing;

  const images = new Array<HTMLImageElement>(count);
  const decoded = new Array<boolean>(count).fill(false);
  const listeners = new Set<() => void>();
  let landed = 0;
  let finished = false;
  let notifyTimer = 0;

  /**
   * Coalesce the "frames arrived" notifications: decoding is progressive, and
   * one React re-render per frame across six tiles is exactly the kind of work
   * a scrub cannot afford.
   */
  const notify = () => {
    if (notifyTimer) return;
    notifyTimer = window.setTimeout(() => {
      notifyTimer = 0;
      listeners.forEach((listener) => listener());
    }, 120);
  };

  const run: FrameRun = {
    key,
    count,
    images,
    decoded,
    progress: () => (finished ? 1 : landed / count),
    complete: () => finished,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  RUNS.set(key, run);

  const load = (index: number) =>
    new Promise<void>((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.setAttribute("fetchpriority", index === 0 ? "high" : "low");
      image.onload = () => {
        decoded[index] = true;
        landed += 1;
        notify();
        resolve();
      };
      // One missing frame must not stall the run: leave it undecoded and let
      // the nearest-frame lookup step over it.
      image.onerror = () => resolve();
      images[index] = image;
      image.src = frameUrlIn(film, index);
    });

  const runQueue = async (queue: number[], concurrency: number) => {
    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const index = queue[cursor];
        cursor += 1;
        await load(index);
      }
    };
    await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, queue.length)) }, worker));
  };

  void (async () => {
    await runQueue([0], 1);

    const steps = Math.max(LADDER_MIN_STEPS, Math.ceil(count / LADDER_SPACING));
    const step = Math.max(1, Math.ceil(count / steps));
    const ladder: number[] = [];
    for (let i = step; i < count; i += step) ladder.push(i);
    await runQueue(ladder, LADDER_CONCURRENCY);

    const rest: number[] = [];
    for (let i = 1; i < count; i += 1) if (!ladder.includes(i)) rest.push(i);
    await runQueue(rest, STREAM_CONCURRENCY);

    finished = true;
    listeners.forEach((listener) => listener());
  })();

  return run;
}

/**
 * Nearest frame that is actually decoded — backwards first, because a frame
 * slightly behind the playhead reads as lag while one ahead reads as a jump.
 */
export function nearestDecoded(run: FrameRun, index: number): number {
  if (run.decoded[index]) return index;
  for (let d = 1; d < run.count; d += 1) {
    if (index - d >= 0 && run.decoded[index - d]) return index - d;
    if (index + d < run.count && run.decoded[index + d]) return index + d;
  }
  return -1;
}
