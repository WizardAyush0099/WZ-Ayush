import { useEffect } from "react";
import { audioContext, audioLive, getSoundPref, sfxBus, unlockAudio } from "./audioBus";

/**
 * ============================================================================
 *  INTERFACE SOUND — designed, not beeped
 * ============================================================================
 *  The sound toggle used to fade in a drone and nothing else, so switching it
 *  on felt broken: there was no sound attached to anything you actually did.
 *  Every sound below is synthesised from scratch and shaped like a real
 *  instrument or a real object rather than a square-wave blip:
 *
 *    hover    a soft wooden tick — a marimba bar struck very lightly
 *    click    a low, dry knock with a tiny noise transient
 *    open     a short airy swell — filter noise rising into the hall
 *    close    the same sweep falling away
 *    select   two rising marimba notes (E5 → B5), the "that's mine" sound
 *    success  a major arpeggio, for a form that went through
 *    error    two muted low thuds, never a harsh buzzer
 *    page     a soft low swell for a route change
 *
 *  There is no audio file anywhere in the project and nothing to license: each
 *  sound is a couple of oscillators and a filtered noise buffer, played through
 *  the shared reverb in `src/lib/audioBus.ts` so everything sits in one space.
 *
 *  Rules that keep it from becoming a nuisance:
 *    • nothing ever plays unless the visitor switched sound on
 *    • nothing forces the AudioContext to resume, so a blocked context is
 *      silent rather than deferring a burst of noise onto the next click
 *    • hover is throttled and pitched down, and never repeats on the same
 *      element
 *    • every effect is short (≤ 0.9s) and mixed well under the bed
 * ============================================================================
 */

export type SfxName = "hover" | "click" | "open" | "close" | "select" | "success" | "error" | "page";

/** Per-sound trim, so the mix is deliberate rather than "all at 0.2". */
const LEVEL: Record<SfxName, number> = {
  hover: 0.15,
  click: 0.36,
  open: 0.34,
  close: 0.3,
  select: 0.38,
  success: 0.4,
  error: 0.34,
  page: 0.3,
};

/**
 * A struck bar: a sine fundamental with a fast, wooden attack, a quiet
 * inharmonic partial, and an exponential decay. This is the voice used by
 * hover, select and success.
 */
function bar(
  context: AudioContext,
  destination: AudioNode,
  frequency: number,
  when: number,
  duration: number,
  gain: number,
) {
  const voice = context.createGain();
  voice.gain.setValueAtTime(0.0001, when);
  voice.gain.exponentialRampToValueAtTime(gain, when + 0.006);
  voice.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  voice.connect(destination);

  const fundamental = context.createOscillator();
  fundamental.type = "sine";
  fundamental.frequency.setValueAtTime(frequency, when);
  // A whisper of downward glide is what makes it read as a struck bar.
  fundamental.frequency.exponentialRampToValueAtTime(frequency * 0.994, when + duration);
  fundamental.connect(voice);

  // The mallet's "wood": a quiet partial three-and-a-bit octaves up.
  const partial = context.createGain();
  partial.gain.setValueAtTime(gain * 0.16, when);
  partial.gain.exponentialRampToValueAtTime(0.0001, when + duration * 0.45);
  partial.connect(voice);
  const overtone = context.createOscillator();
  overtone.type = "sine";
  overtone.frequency.setValueAtTime(frequency * 6.27, when);
  overtone.connect(partial);

  fundamental.start(when);
  overtone.start(when);
  fundamental.stop(when + duration + 0.05);
  overtone.stop(when + duration + 0.05);
}

/** A dry knock with a short noise transient — the click for buttons. */
function knock(context: AudioContext, destination: AudioNode, when: number, gain: number) {
  bar(context, destination, 168, when, 0.22, gain);

  const length = Math.floor(context.sampleRate * 0.02);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.4);
  }
  const noise = context.createBufferSource();
  noise.buffer = buffer;
  const shape = context.createBiquadFilter();
  shape.type = "bandpass";
  shape.frequency.value = 2400;
  shape.Q.value = 0.8;
  const envelope = context.createGain();
  envelope.gain.value = gain * 0.5;
  noise.connect(shape).connect(envelope).connect(destination);
  noise.start(when);
}

/** A short filtered-noise swell — the air movement behind a transition. */
function sweep(
  context: AudioContext,
  destination: AudioNode,
  when: number,
  gain: number,
  rising: boolean,
) {
  const duration = 0.55;
  const length = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / length;
    // Fade in and out, so the noise has no hard edges.
    const window = Math.sin(Math.PI * t);
    data[i] = (Math.random() * 2 - 1) * window;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;

  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 0.9;
  filter.frequency.setValueAtTime(rising ? 320 : 1900, when);
  filter.frequency.exponentialRampToValueAtTime(rising ? 1900 : 320, when + duration);

  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, when);
  envelope.gain.exponentialRampToValueAtTime(gain, when + duration * 0.4);
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);

  source.connect(filter).connect(envelope).connect(destination);
  source.start(when);

  // A low sine underneath gives the sweep weight instead of just hiss.
  const under = context.createOscillator();
  under.type = "sine";
  under.frequency.setValueAtTime(rising ? 110 : 165, when);
  under.frequency.exponentialRampToValueAtTime(rising ? 165 : 110, when + duration);
  const underGain = context.createGain();
  underGain.gain.setValueAtTime(0.0001, when);
  underGain.gain.exponentialRampToValueAtTime(gain * 0.5, when + duration * 0.35);
  underGain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  under.connect(underGain).connect(destination);
  under.start(when);
  under.stop(when + duration + 0.05);
}

/**
 * Play one interface sound. Silent (and free) when sound is off or the audio
 * context has not been unlocked by a gesture yet.
 */
export function playSfx(name: SfxName, volume = 1): void {
  if (!audioLive()) return;
  const context = audioContext();
  const destination = sfxBus();
  const gain = LEVEL[name] * volume;
  const now = context.currentTime + 0.001;

  switch (name) {
    case "hover":
      bar(context, destination, 1760, now, 0.07, gain);
      break;
    case "click":
      knock(context, destination, now, gain);
      break;
    case "open":
      sweep(context, destination, now, gain, true);
      break;
    case "close":
      sweep(context, destination, now, gain, false);
      break;
    case "select":
      bar(context, destination, 659.25, now, 0.28, gain);
      bar(context, destination, 987.77, now + 0.085, 0.34, gain * 0.85);
      break;
    case "success":
      bar(context, destination, 523.25, now, 0.3, gain);
      bar(context, destination, 659.25, now + 0.1, 0.32, gain * 0.9);
      bar(context, destination, 783.99, now + 0.2, 0.46, gain * 0.8);
      break;
    case "error":
      bar(context, destination, 116, now, 0.3, gain);
      bar(context, destination, 98, now + 0.14, 0.36, gain * 0.8);
      break;
    case "page":
      sweep(context, destination, now, gain * 0.7, true);
      bar(context, destination, 392, now, 0.4, gain * 0.5);
      break;
  }
}

/* -------------------------------------------------------------------------- */
/*  Global wiring                                                             */
/* -------------------------------------------------------------------------- */

/** Anything that behaves like a control worth a tick. */
const CONTROL = 'a[href], button, [role="button"], input[type="submit"], summary, label';

/**
 * A control can name the sound it deserves with `data-sfx="…"` — choosing a
 * template answers with the rising two-note "select" rather than the generic
 * knock, so the sound says what happened instead of just "you clicked".
 */
function isSfxName(value: string | null | undefined): value is SfxName {
  return (
    value === "hover" ||
    value === "click" ||
    value === "open" ||
    value === "close" ||
    value === "select" ||
    value === "success" ||
    value === "error" ||
    value === "page"
  );
}

/**
 * Attach the interface sounds to the whole app with one delegated listener
 * pair — no component has to know sound exists. Mount once, in `App`.
 *
 * Hover uses `pointerover` (which fires on entry to a node, not on every mouse
 * move) and remembers the last element, so sliding along a row of links ticks
 * once per link rather than continuously.
 */
export function useUiSounds(): void {
  useEffect(() => {
    let lastHover: EventTarget | null = null;
    let hoverAt = 0;

    const onPointerOver = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const control = target?.closest?.(CONTROL);
      if (!control || control === lastHover) return;
      lastHover = control;
      const now = performance.now();
      if (now - hoverAt < 70) return;
      hoverAt = now;
      playSfx("hover", 0.7);
    };

    const onPointerDown = (event: PointerEvent) => {
      /*
       * A returning visitor has sound on but the context starts suspended on
       * every fresh page load. Their first tap is the gesture that unlocks it,
       * so honour it here instead of waiting for a second one.
       */
      if (getSoundPref() && !audioLive()) void unlockAudio();

      const target = event.target as Element | null;
      const control = target?.closest?.(CONTROL) as HTMLElement | null;
      if (!control) {
        lastHover = null;
        return;
      }
      const named = control.getAttribute("data-sfx");
      playSfx(isSfxName(named) ? named : "click");
    };

    const onRoute = () => playSfx("page");

    window.addEventListener("pointerover", onPointerOver, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("hashchange", onRoute);

    return () => {
      window.removeEventListener("pointerover", onPointerOver);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("hashchange", onRoute);
    };
  }, []);
}
