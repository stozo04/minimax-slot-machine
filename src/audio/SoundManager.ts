class SoundManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientNodes: AudioScheduledSourceNode[] = [];
  private spinSource: AudioBufferSourceNode | null = null;
  private spinGain: GainNode | null = null;
  private muted = false;
  private volume = 0.65;

  private ensureContext(): AudioContext {
    if (this.context) return this.context;

    const AudioContextConstructor =
      window.AudioContext ??
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioContextConstructor) {
      throw new Error('Web Audio is unavailable in this browser.');
    }

    this.context = new AudioContextConstructor();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume * 0.72;
    this.master.connect(this.context.destination);
    return this.context;
  }

  async unlock(): Promise<void> {
    try {
      const context = this.ensureContext();
      if (context.state === 'suspended') await context.resume();
      this.startAmbient();
    } catch {
      // Audio is optional; gameplay remains fully functional.
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.updateMasterGain();
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    this.updateMasterGain();
  }

  private updateMasterGain(): void {
    if (!this.context || !this.master) return;
    this.master.gain.setTargetAtTime(
      this.muted ? 0 : this.volume * 0.72,
      this.context.currentTime,
      0.025,
    );
  }

  private startAmbient(): void {
    if (!this.context || !this.master || this.ambientGain) return;

    const context = this.context;
    this.ambientGain = context.createGain();
    this.ambientGain.gain.value = 0;
    this.ambientGain.connect(this.master);

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 240;
    filter.Q.value = 0.6;
    filter.connect(this.ambientGain);

    [47, 71.5].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      const gain = context.createGain();
      gain.gain.value = index === 0 ? 0.026 : 0.012;
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start();
      this.ambientNodes.push(oscillator);
    });

    this.ambientGain.gain.setTargetAtTime(0.22, context.currentTime, 1.2);
  }

  click(): void {
    try {
      const context = this.ensureContext();
      void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(920, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        540,
        context.currentTime + 0.035,
      );
      gain.gain.setValueAtTime(0.08, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + 0.055,
      );
      oscillator.connect(gain);
      gain.connect(this.master!);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.06);
    } catch {
      // Ignore unsupported audio output.
    }
  }

  spinStart(): void {
    try {
      const context = this.ensureContext();
      void context.resume();
      this.stopSpin();

      const buffer = context.createBuffer(
        1,
        context.sampleRate * 2,
        context.sampleRate,
      );
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) {
        data[index] = (Math.random() * 2 - 1) * 0.34;
      }

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 780;
      filter.Q.value = 0.7;

      const gain = context.createGain();
      gain.gain.setValueAtTime(0.001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.09,
        context.currentTime + 0.18,
      );

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master!);
      source.start();

      this.spinSource = source;
      this.spinGain = gain;
    } catch {
      // Ignore unsupported audio output.
    }
  }

  stopSpin(): void {
    if (!this.context || !this.spinSource || !this.spinGain) return;

    const source = this.spinSource;
    const gain = this.spinGain;
    gain.gain.setTargetAtTime(0.0001, this.context.currentTime, 0.05);
    window.setTimeout(() => {
      try {
        source.stop();
      } catch {
        // The source may already have stopped.
      }
    }, 180);

    this.spinSource = null;
    this.spinGain = null;
  }

  reelStop(reelIndex: number): void {
    try {
      const context = this.ensureContext();
      void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(
        170 + reelIndex * 23,
        context.currentTime,
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        72,
        context.currentTime + 0.08,
      );
      gain.gain.setValueAtTime(0.19, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + 0.12,
      );
      oscillator.connect(gain);
      gain.connect(this.master!);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.13);
    } catch {
      // Ignore unsupported audio output.
    }
  }

  payout(large = false): void {
    try {
      const context = this.ensureContext();
      void context.resume();
      const notes = large ? [261.6, 329.6, 392, 523.3] : [392, 523.3];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        const start = context.currentTime + index * 0.075;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.11, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
        oscillator.connect(gain);
        gain.connect(this.master!);
        oscillator.start(start);
        oscillator.stop(start + 0.32);
      });
    } catch {
      // Ignore unsupported audio output.
    }
  }

  cashOut(): void {
    try {
      const context = this.ensureContext();
      void context.resume();
      [196, 293.7, 392, 587.3].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + index * 0.1;
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.1, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
        oscillator.connect(gain);
        gain.connect(this.master!);
        oscillator.start(start);
        oscillator.stop(start + 0.58);
      });
    } catch {
      // Ignore unsupported audio output.
    }
  }

  error(): void {
    try {
      const context = this.ensureContext();
      void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(160, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        75,
        context.currentTime + 0.22,
      );
      gain.gain.setValueAtTime(0.07, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime + 0.25,
      );
      oscillator.connect(gain);
      gain.connect(this.master!);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.26);
    } catch {
      // Ignore unsupported audio output.
    }
  }
}

export const soundManager = new SoundManager();
