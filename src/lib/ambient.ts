import { ambienceBus, audioContext, audioLive, getSoundPref, setSoundPref, unlockAudio } from "./audioBus";

/**
 * ============================================================================
 *  AMBIENT BED — a dark room that breathes
 * ============================================================================
 *  The bed is the site's atmosphere in sound form: a low A drone with its
 *  fifth, a quiet minor third (C) for the shadow, and wind — filtered noise
 *  whose band drifts slowly so the air never sits still. A high "singing
 *  bowl" tone swells underneath on its own slow cycle, and the whole thing
 *  breathes over ~14 seconds through a tremolo on the master.
 *
 *  It runs through the shared bus in `src/lib/audioBus.ts`, so it occupies the
 *  same reverb as the interface sounds rather than sounding pasted on.
 *
 *  No audio file ships with the project. Nothing autoplays: the bed only starts
 *  from the sound toggle (a real gesture) and the choice is remembered.
 * ============================================================================
 */

export { getSoundPref, setSoundPref };

class AmbientEngine {
  private nodes: Array<OscillatorNode | AudioBufferSourceNode> = [];
  private lfos: OscillatorNode[] = [];
  private gain: GainNode | null = null;
  private volume = 0.15;

  get isPlaying(): boolean {
    return this.nodes.length > 0;
  }

  async start(): Promise<void> {
    // A gesture is required the first time; this is always called from one.
    const unlocked = await unlockAudio();
    if (!unlocked) throw new Error("audio-blocked");
    if (this.isPlaying) return;

    const ctx = audioContext();
    const destination = ambienceBus();

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.connect(destination);
    this.gain = master;

    // A gentle low-pass keeps the bed out of the effects' way.
    const shaper = ctx.createBiquadFilter();
    shaper.type = "lowpass";
    shaper.frequency.value = 430;
    shaper.Q.value = 0.6;
    shaper.connect(master);

    /* Root, fifth, octave — and a minor third an octave up, which is the
       whole difference between a neutral hum and a shadow. */
    const voices: Array<{ f: number; type: OscillatorType; g: number; detune: number }> = [
      { f: 55, type: "sine", g: 0.5, detune: -5 },
      { f: 82.41, type: "sine", g: 0.22, detune: 4 },
      { f: 110, type: "sine", g: 0.2, detune: 0 },
      { f: 130.81, type: "triangle", g: 0.11, detune: 6 },
      { f: 164.81, type: "triangle", g: 0.09, detune: -7 },
    ];
    voices.forEach((voice) => {
      const osc = ctx.createOscillator();
      osc.type = voice.type;
      osc.frequency.value = voice.f;
      osc.detune.value = voice.detune;
      const level = ctx.createGain();
      level.gain.value = voice.g;
      osc.connect(level).connect(shaper);
      osc.start();
      this.nodes.push(osc);
    });

    /* Wind: looped noise through a bandpass whose centre drifts between
       ~300Hz and ~1.1kHz on a 22-second cycle. The motion is what stops the
       drone from reading as a frozen tone. */
    const seconds = 4;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.32;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 700;
    band.Q.value = 0.5;
    const windLfo = ctx.createOscillator();
    windLfo.frequency.value = 0.045;
    const windDepth = ctx.createGain();
    windDepth.gain.value = 420;
    windLfo.connect(windDepth).connect(band.frequency);

    const airGain = ctx.createGain();
    airGain.gain.value = 0.05;
    noise.connect(band).connect(airGain).connect(master);
    noise.start();
    windLfo.start();
    this.nodes.push(noise);
    this.lfos.push(windLfo);

    /* A high bowl tone, very quiet, swelling on its own slow cycle — the
       layer that makes the bed feel lit from somewhere. */
    const shimmer = ctx.createOscillator();
    shimmer.type = "triangle";
    shimmer.frequency.value = 329.63;
    shimmer.detune.value = -9;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.014;
    const shimmerLfo = ctx.createOscillator();
    shimmerLfo.frequency.value = 0.033;
    const shimmerDepth = ctx.createGain();
    shimmerDepth.gain.value = 0.014;
    shimmerLfo.connect(shimmerDepth).connect(shimmerGain.gain);
    shimmer.connect(shimmerGain).connect(master);
    shimmer.start();
    shimmerLfo.start();
    this.nodes.push(shimmer);
    this.lfos.push(shimmerLfo);

    // Slow tremolo — the whole bed swells and settles over ~14 seconds.
    const tremolo = ctx.createOscillator();
    tremolo.frequency.value = 0.07;
    const depth = ctx.createGain();
    depth.gain.value = this.volume * 0.3;
    tremolo.connect(depth).connect(master.gain);
    tremolo.start();
    this.lfos.push(tremolo);

    master.gain.exponentialRampToValueAtTime(this.volume, ctx.currentTime + 3.2);
  }

  stop(): void {
    // Nothing was started, so there is no context worth creating just to fade
    // out silence.
    if (!this.gain) return;
    const ctx = audioContext();
    const now = ctx.currentTime;

    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(Math.max(this.gain.gain.value, 0.0001), now);
    this.gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    const kill = [...this.lfos, ...this.nodes].filter(Boolean) as Array<
      OscillatorNode | AudioBufferSourceNode
    >;
    window.setTimeout(() => {
      kill.forEach((node) => {
        try {
          node.stop();
        } catch {
          /* already stopped */
        }
      });
    }, 1250);

    this.nodes = [];
    this.lfos = [];
    this.gain = null;
  }

  /** True when the bed could start right now. */
  get ready(): boolean {
    return audioLive();
  }
}

export const ambient = new AmbientEngine();
