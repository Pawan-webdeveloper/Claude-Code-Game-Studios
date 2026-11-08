/**
 * Tiny synthesised soundscape (no audio files): wind that follows speed, a calm generative
 * pentatonic melody, discovery chimes and a ride-switch whoosh. Starts only after a user gesture.
 */
export class Audio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private windGain!: GainNode;
  private echo!: DelayNode;
  private nextNote = 0;
  private step = 0;
  private muted = false;
  private readonly scale = [0, 2, 4, 7, 9, 12, 14, 16];

  /** Creates the audio graph. Must be called from a user gesture (click/tap). */
  start(): void {
    if (this.ctx) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(ctx.destination);

    this.echo = ctx.createDelay(1);
    this.echo.delayTime.value = 0.36;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    this.echo.connect(fb).connect(this.echo);
    this.echo.connect(this.master);

    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 500;
    bp.Q.value = 0.6;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    noise.connect(bp).connect(this.windGain).connect(this.master);
    noise.start();
    this.nextNote = ctx.currentTime + 0.5;
  }

  /** Toggles mute; returns the new muted state. */
  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
    return this.muted;
  }

  private pluck(freq: number, when: number, vol: number, dur = 1.2, type: OscillatorType = "triangle"): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(this.master);
    g.connect(this.echo);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  /** Per-frame: wind follows speed (0..1); schedules the next melody notes. */
  update(speed01: number, regionIndex: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    this.windGain.gain.setTargetAtTime(0.02 + speed01 * 0.12, ctx.currentTime, 0.3);
    const root = [57, 62, 55, 52, 60, 59][regionIndex % 6];
    while (this.nextNote < ctx.currentTime + 0.3) {
      if (this.step % 8 === 0) this.pluck(this.midi(root - 12), this.nextNote, 0.05, 2.4, "sine");
      if (Math.random() < 0.55) {
        const deg = this.scale[Math.floor(Math.random() * this.scale.length)];
        this.pluck(this.midi(root + deg), this.nextNote, 0.035);
      }
      this.nextNote += 0.42;
      this.step++;
    }
  }

  /** Bright arpeggio for a discovery (bigger for projects). */
  chime(big: boolean): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const notes = big ? [72, 76, 79, 84, 88] : [76, 79, 84];
    notes.forEach((n, i) => this.pluck(this.midi(n), ctx.currentTime + i * 0.09, 0.08, 1.4, "square"));
  }

  /** Filtered noise sweep for a ride switch. */
  whoosh(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    this.pluck(this.midi(64), ctx.currentTime, 0.05, 0.4, "sawtooth");
    this.pluck(this.midi(71), ctx.currentTime + 0.06, 0.04, 0.4, "sawtooth");
  }

  private midi(n: number): number {
    return 440 * Math.pow(2, (n - 69) / 12);
  }
}
