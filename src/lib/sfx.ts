import { useEffect } from "react";
import { audioContext, audioLive, getSoundPref, sfxBus, unlockAudio } from "./audioBus";

/**
 * ============================================================================
 *  INTERFACE SOUND — the palette of the site
 * ============================================================================
 *  The old kit was a marimba: bright wooden bars that belong on a banking app,
 *  not on a page of black ink and crimson light. Every sound below has been
 *  rescored for this site's aura — taiko, koto, temple bell and steel — so
 *  what a visitor hears matches what they see:
 *
 *    hover    the rim of a drum: a soft, low tick, felt more than heard
 *    click    a dry taiko strike — one confident beat, no beep
 *    open     a dark riser, air and sub climbing into the hall
 *    close    the same riser falling away
 *    select   two koto notes a fifth apart, with a whisper of steel on top
 *    success  a taiko pulse, a temple bell and a rising pentatonic run
 *    error    two low, dull taiko thuds — never a buzzer
 *    page     a cinematic sub-boom under a short sweep for a route change
 *
 *  There is no audio file anywhere in the project and nothing to license: each
 *  voice is oscillators and a filtered noise buffer, played through the shared
 *  reverb in `src/lib/audioBus.ts` so everything sits in one space.
 *
 *  Rules that keep it from becoming a nuisance:
 *    • nothing ever plays unless the visitor switched sound on
 *    • nothing forces the AudioContext to resume, so a blocked context is
 *      silent rather than deferring a burst of noise onto the next click
 *    • hover is throttled, low and never repeats on the same element
 *    • every effect is short (≤ 1.2s) and mixed well under the bed
 * ============================================================================
 */

export type SfxName = "hover" | "click" | "open" | "close" | "select" | "success" | "error" | "page";

/** Per-sound trim, so the mix is deliberate rather than "all at 0.2". */
const LEVEL: Record<SfxName, number> = {
  hover: 0.16,
  click: 0.42,
  open: 0.32,
  close: 0.28,
  select: 0.4,
  success: 0.46,
  error: 0.34,
  page: 0.3,
};

/**
 * A taiko strike: a membrane that drops in pitch as it settles, a skin
 * transient on top and a round lowpass so the hit stays dark. This is the
 * site's "hand on the drum" — click, success and the page boom all use it.
 */
function taiko(
  context: AudioContext,
  destination: AudioNode,
  when: number,
  gain: number,
  frequency = 150,
  duration = 0.42,
) {
  const voice = context.createGain();
  voice.gain.setValueAtTime(0.0001, when);
  voice.gain.exponentialRampToValueAtTime(gain, when + 0.005);
  voice.gain.exponentialRampToValueAtTime(0.0001, when + duration);

  const shape = context.createBiquadFilter();
  shape.type = "lowpass";
  shape.frequency.value = 950;
  shape.Q.value = 0.5;
  voice.connect(shape).connect(destination);

  const membrane = context.createOscillator();
  membrane.type = "sine";
  membrane.frequency.setValueAtTime(frequency, when);
  // The head slows down as it loses energy — that drop is the drum's voice.
  membrane.frequency.exponentialRampToValueAtTime(frequency * 0.58, when + duration * 0.7);
  membrane.connect(voice);
  membrane.start(when);
  membrane.stop(when + duration + 0.05);

  // Stick on skin: a 30ms noise burst, decaying inside the buffer itself.
  const length = Math.floor(context.sampleRate * 0.03);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
  }
  const skin = context.createBufferSource();
  skin.buffer = buffer;
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1450;
  band.Q.value = 0.7;
  const skinGain = context.createGain();
  skinGain.gain.value = gain * 0.5;
  skin.connect(band).connect(skinGain).connect(destination);
  skin.start(when);
}

/**
 * A koto pluck: a sawtooth string through a filter that closes as the note
 * decays, with a quiet sub underneath for body. Warm, Japanese, unmistakably
 * an instrument rather than a synthesizer blip.
 */
function pluck(
  context: AudioContext,
  destination: AudioNode,
  when: number,
  frequency: number,
  gain: number,
  duration = 0.6,
) {
  const voice = context.createGain();
  voice.gain.setValueAtTime(0.0001, when);
  voice.gain.exponentialRampToValueAtTime(gain, when + 0.008);
  voice.gain.exponentialRampToValueAtTime(0.0001, when + duration);

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 1.3;
  filter.frequency.setValueAtTime(Math.min(frequency * 7, 6200), when);
  filter.frequency.exponentialRampToValueAtTime(Math.max(frequency * 1.4, 260), when + duration * 0.55);
  voice.connect(filter).connect(destination);

  const string = context.createOscillator();
  string.type = "sawtooth";
  string.frequency.value = frequency;
  string.connect(voice);

  const body = context.createOscillator();
  body.type = "sine";
  body.frequency.value = frequency / 2;
  const bodyGain = context.createGain();
  bodyGain.gain.value = 0.4;
  body.connect(bodyGain).connect(voice);

  string.start(when);
  body.start(when);
  string.stop(when + duration + 0.05);
  body.stop(when + duration + 0.05);
}

/**
 * A temple bell (rin): five inharmonic partials, each a little shorter than
 * the last, so the strike blooms and then thins instead of just fading.
 */
function bell(
  context: AudioContext,
  destination: AudioNode,
  when: number,
  base: number,
  gain: number,
  duration = 1.15,
) {
  const ratios = [1, 2.03, 2.99, 4.21, 5.44];
  const weights = [1, 0.58, 0.4, 0.24, 0.15];
  ratios.forEach((ratio, index) => {
    const weight = weights[index];
    const voice = context.createGain();
    voice.gain.setValueAtTime(0.0001, when);
    voice.gain.exponentialRampToValueAtTime(gain * weight, when + 0.006);
    voice.gain.exponentialRampToValueAtTime(0.0001, when + duration * (1 - index * 0.13));
    voice.connect(destination);

    const partial = context.createOscillator();
    partial.type = "sine";
    partial.frequency.value = base * ratio;
    partial.connect(voice);
    partial.start(when);
    partial.stop(when + duration + 0.05);
  });
}

/**
 * The whisper of steel: a short band-passed noise sweep between two high
 * inharmonic rings. Used only as an accent under `select` and `success` —
 * quiet enough to be texture, sharp enough to read as a blade.
 */
function steel(context: AudioContext, destination: AudioNode, when: number, gain: number) {
  const duration = 0.26;
  const length = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / length;
    data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * t);
  }
  const noise = context.createBufferSource();
  noise.buffer = buffer;
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 2.4;
  band.frequency.setValueAtTime(3200, when);
  band.frequency.exponentialRampToValueAtTime(7400, when + duration);
  const noiseGain = context.createGain();
  noiseGain.gain.value = gain;
  noise.connect(band).connect(noiseGain).connect(destination);
  noise.start(when);

  [2637, 3520].forEach((frequency) => {
    const ring = context.createGain();
    ring.gain.setValueAtTime(0.0001, when);
    ring.gain.exponentialRampToValueAtTime(gain * 0.7, when + 0.005);
    ring.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    ring.connect(destination);
    const osc = context.createOscillator();
    osc.type = "sine";
    osc.frequency.value = frequency;
    osc.connect(ring);
    osc.start(when);
    osc.stop(when + duration + 0.05);
  });
}

/**
 * A filtered-noise swell with a sine underneath — the air movement behind a
 * transition. `rising` climbs from 320Hz to 1.9kHz with the sub following;
 * falling does the opposite, which is what makes `close` and `page` settle
 * rather than stop.
 */
function air(
  context: AudioContext,
  destination: AudioNode,
  when: number,
  gain: number,
  rising: boolean,
  duration = 0.6,
) {
  const length = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    // Sine window: the noise has no hard edges.
    data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * (i / length));
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
  envelope.gain.exponentialRampToValueAtTime(gain, when + duration * 0.42);
  envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);

  source.connect(filter).connect(envelope).connect(destination);
  source.start(when);

  // Weight under the hiss, so the swell reads as pressure, not static.
  const under = context.createOscillator();
  under.type = "sine";
  under.frequency.setValueAtTime(rising ? 62 : 150, when);
  under.frequency.exponentialRampToValueAtTime(rising ? 150 : 62, when + duration);
  const underGain = context.createGain();
  underGain.gain.setValueAtTime(0.0001, when);
  underGain.gain.exponentialRampToValueAtTime(gain * 0.75, when + duration * 0.38);
  underGain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  under.connect(underGain).connect(destination);
  under.start(when);
  under.stop(when + duration + 0.05);
}

/** The hover tick: the rim of a drum, not a bell. Low, short, understated. */
function rim(
  context: AudioContext,
  destination: AudioNode,
  when: number,
  gain: number,
) {
  const length = Math.floor(context.sampleRate * 0.02);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.2);
  }
  const noise = context.createBufferSource();
  noise.buffer = buffer;
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2100;
  band.Q.value = 1.1;
  const noiseGain = context.createGain();
  noiseGain.gain.value = gain * 0.8;
  noise.connect(band).connect(noiseGain).connect(destination);
  noise.start(when);

  const voice = context.createGain();
  voice.gain.setValueAtTime(0.0001, when);
  voice.gain.exponentialRampToValueAtTime(gain * 0.6, when + 0.004);
  voice.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
  voice.connect(destination);
  const tone = context.createOscillator();
  tone.type = "sine";
  tone.frequency.setValueAtTime(700, when);
  tone.frequency.exponentialRampToValueAtTime(520, when + 0.06);
  tone.connect(voice);
  tone.start(when);
  tone.stop(when + 0.1);
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
      rim(context, destination, now, gain);
      break;
    case "click":
      taiko(context, destination, now, gain, 152, 0.34);
      break;
    case "open":
      air(context, destination, now, gain, true, 0.62);
      break;
    case "close":
      air(context, destination, now, gain, false, 0.55);
      break;
    case "select":
      pluck(context, destination, now, 392, gain * 0.9, 0.5);
      pluck(context, destination, now + 0.11, 587.33, gain * 0.8, 0.75);
      steel(context, destination, now + 0.11, gain * 0.14);
      break;
    case "success":
      taiko(context, destination, now, gain * 0.5, 124, 0.55);
      bell(context, destination, now + 0.03, 659.25, gain * 0.42, 1.15);
      pluck(context, destination, now + 0.17, 392, gain * 0.6, 0.5);
      pluck(context, destination, now + 0.29, 587.33, gain * 0.6, 0.55);
      pluck(context, destination, now + 0.41, 880, gain * 0.55, 0.8);
      steel(context, destination, now + 0.41, gain * 0.12);
      break;
    case "error":
      taiko(context, destination, now, gain * 0.8, 98, 0.5);
      taiko(context, destination, now + 0.16, gain * 0.6, 82, 0.6);
      break;
    case "page":
      air(context, destination, now, gain * 0.55, true, 0.5);
      taiko(context, destination, now + 0.05, gain * 0.7, 96, 0.8);
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
 * taiko, so the sound says what happened instead of just "you clicked".
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
