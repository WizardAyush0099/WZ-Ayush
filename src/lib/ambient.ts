import { ambienceBus, audioContext, audioLive, getSoundPref, setSoundPref, unlockAudio } from "./audioBus";

/**
 * ============================================================================
 *  AMBIENT BED — a slow, breathing drone under the interface
 * ============================================================================
 *  Four detuned sines a fifth and an octave apart, a filtered noise layer for
 *  air, and a slow tremolo so the drone breathes instead of sitting still. It
 *  runs through the shared bus in `src/lib/audioBus.ts`, so it occupies the
 *  same reverb as the interface sounds rather than sounding pasted on.
 *
 *  No audio file ships with the project. Nothing autoplays: the bed only starts
 *  from the sound toggle (a real gesture) and the choice is remembered.
 * ============================================================================
 */

export { getSoundPref, setSoundPref };

class AmbientEngine {
  private nodes: Array<OscillatorNode | AudioBufferSourceNode> = [];
  private gain: GainNode | null = null;
  private tremolo: OscillatorNode | null = null;
  private volume = 0.075;

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
    shaper.frequency.value = 480;
    shaper.Q.value = 0.6;
    shaper.connect(master);

    // Root, fifth, octave and a detuned twelfth — a chord, not a hum.
    const freqs = [55, 82.41, 110, 164.81];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      osc.detune.value = (i - 1.5) * 6;
      const voice = ctx.createGain();
      voice.gain.value = i === 0 ? 0.5 : 0.2;
      osc.connect(voice).connect(shaper);
      osc.start();
      this.nodes.push(osc);
    });

    // Air, so the pad has movement rather than a static tone.
    const seconds = 3;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.32;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 780;
    band.Q.value = 0.55;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.045;
    noise.connect(band).connect(airGain).connect(master);
    noise.start();
    this.nodes.push(noise);

    // Slow tremolo — the whole bed swells and settles over ~14 seconds.
    const tremolo = ctx.createOscillator();
    tremolo.frequency.value = 0.07;
    const depth = ctx.createGain();
    depth.gain.value = this.volume * 0.3;
    tremolo.connect(depth).connect(master.gain);
    tremolo.start();
    this.tremolo = tremolo;

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

    const kill = [this.tremolo, ...this.nodes].filter(Boolean) as Array<
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
    this.tremolo = null;
    this.gain = null;
  }

  /** True when the bed could start right now. */
  get ready(): boolean {
    return audioLive();
  }
}

export const ambient = new AmbientEngine();
