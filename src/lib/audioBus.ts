/**
 * ============================================================================
 *  AUDIO BUS — one Web Audio graph for the whole site
 * ============================================================================
 *  Both the ambient bed (`src/lib/ambient.ts`) and the interface sounds
 *  (`src/lib/sfx.ts`) run through this graph, so the site never spins up two
 *  AudioContexts and both share one reverb tail — which is most of what makes
 *  synthesised sound read as "designed" rather than "beeped".
 *
 *     source → input ─┬─────────────────────────→ master → limiter → out
 *                     └→ reverb (convolver) ────↗
 *
 *  The reverb is generated, not shipped: a two-second noise tail with an
 *  exponential decay makes a convincing small-room/hall impulse, so no audio
 *  file needs to be bundled and nothing has to be licensed.
 *
 *  Nothing is ever created until a real user gesture asks for sound — browsers
 *  refuse to start audio otherwise, and an AudioContext that is never resumed
 *  is just wasted memory.
 * ============================================================================
 */

const PREF_KEY = "portfolio:sound";

let ctx: AudioContext | null = null;
let sfxGain: GainNode | null = null;
let ambGain: GainNode | null = null;

/** Has the visitor switched sound on? Remembered across visits. */
export function getSoundPref(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === "on";
  } catch {
    return false;
  }
}

export function setSoundPref(on: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {
    /* storage unavailable — the toggle still works for this visit */
  }
}

function createContext(): AudioContext {
  const Ctor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const context = new Ctor();

  // A short, soft limiter so a burst of effects can never clip.
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -8;
  limiter.knee.value = 12;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.004;
  limiter.release.value = 0.22;
  limiter.connect(context.destination);

  const master = context.createGain();
  master.gain.value = 1;
  master.connect(limiter);

  const bus = context.createGain();
  bus.gain.value = 1;

  // Generated impulse response → a small room with a long-ish tail.
  const reverb = context.createConvolver();
  reverb.buffer = impulse(context, 2.1, 2.6);

  const wet = context.createGain();
  wet.gain.value = 0.26;
  const dry = context.createGain();
  dry.gain.value = 0.94;

  bus.connect(dry).connect(master);
  bus.connect(reverb).connect(wet).connect(master);

  // Two independent sub-buses, so the bed and the effects have their own level.
  const effects = context.createGain();
  effects.gain.value = 1;
  effects.connect(bus);

  const ambience = context.createGain();
  // Present but never in the way: the bed sits well under the effects, and
  // both are loud enough to be obviously on — a toggle that produces nothing
  // audible reads as broken.
  ambience.gain.value = 0.55;
  ambience.connect(bus);

  sfxGain = effects;
  ambGain = ambience;
  ctx = context;
  return context;
}

/** A decaying-noise impulse response — the reverb is synthesised, not shipped. */
function impulse(context: AudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = context.sampleRate;
  const length = Math.max(1, Math.floor(rate * seconds));
  const buffer = context.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return buffer;
}

/** The shared context, created on first use. */
export function audioContext(): AudioContext {
  return ctx ?? createContext();
}

/** Where effect sources should connect. */
export function sfxBus(): GainNode {
  audioContext();
  return sfxGain as GainNode;
}

/** Where the ambient bed should connect. */
export function ambienceBus(): GainNode {
  audioContext();
  return ambGain as GainNode;
}

/**
 * Try to bring the context up. Must be called from a user gesture the first
 * time. Resolves true when audio is actually running.
 */
export async function unlockAudio(): Promise<boolean> {
  const context = audioContext();
  // Read through the wider DOM type: TypeScript otherwise narrows `state` to
  // "not running" after the first comparison and rejects the check below.
  if ((context.state as AudioContextState) === "running") return true;
  try {
    await context.resume();
  } catch {
    return false;
  }
  return (context.state as AudioContextState) === "running";
}

/**
 * True when a sound may be started right now: the visitor has sound on and the
 * context is already running (i.e. a gesture has unlocked it). Sounds never
 * force a resume, so a blocked context simply stays silent instead of queueing
 * a burst of noise for the next click.
 */
export function audioLive(): boolean {
  return getSoundPref() && ctx !== null && ctx.state === "running";
}

/** Diagnostics for the dashboard: what the audio graph is doing. */
export function audioDiagnostics(): { state: string; contextRate: number } {
  return {
    state: ctx ? ctx.state : "not-created",
    contextRate: ctx ? ctx.sampleRate : 0,
  };
}

