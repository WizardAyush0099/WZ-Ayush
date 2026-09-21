/**
 * Procedural ambient drone via the Web Audio API.
 * No audio file is shipped, nothing ever autoplays — the engine only starts
 * from an explicit user gesture (the sound toggle) and the preference is
 * remembered in localStorage.
 */

const PREF_KEY = "itachi:sound";

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
    /* storage unavailable — ignore */
  }
}

class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private lfo: OscillatorNode | null = null;
  private noise: AudioBufferSourceNode | null = null;
  private volume = 0.06;

  get isPlaying(): boolean {
    return this.oscillators.length > 0;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
    }
    return this.ctx;
  }

  async start(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
    if (this.isPlaying) return;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.connect(ctx.destination);
    this.master = master;

    // Deep, slowly-beating drone.
    const freqs = [55, 82.41, 110, 164.81];
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.7;
    filter.connect(master);

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      osc.detune.value = (i - 1.5) * 7;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.5 : 0.22;
      osc.connect(g).connect(filter);
      osc.start();
      this.oscillators.push(osc);
    });

    // Airy filtered noise for movement.
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 900;
    noiseFilter.Q.value = 0.6;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.05;
    noise.connect(noiseFilter).connect(noiseGain).connect(master);
    noise.start();
    this.noise = noise;

    // Slow tremolo so the drone breathes.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = this.volume * 0.35;
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();
    this.lfo = lfo;

    master.gain.exponentialRampToValueAtTime(this.volume, ctx.currentTime + 2.4);
  }

  stop(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    const kill = [this.lfo, this.noise, ...this.oscillators].filter(Boolean) as Array<
      OscillatorNode | AudioBufferSourceNode
    >;
    window.setTimeout(() => {
      kill.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* already stopped */
        }
      });
    }, 1000);

    this.oscillators = [];
    this.lfo = null;
    this.noise = null;
    this.master = null;
  }
}

export const ambient = new AmbientEngine();
