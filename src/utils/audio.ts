/**
 * Web Audio API synthesizer for retro-arcade sound effects.
 * No external file downloads are needed.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user click
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (!muted) {
      this.init();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private createGain(duration: number, startVolume: number = 0.3): { node: GainNode; time: number } | null {
    if (this.isMuted) return null;
    this.init();
    if (!this.ctx) return null;

    const node = this.ctx.createGain();
    const time = this.ctx.currentTime;
    node.gain.setValueAtTime(startVolume, time);
    node.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    node.connect(this.ctx.destination);
    return { node, time };
  }

  // Swoosh swing sound (lowpass filtered white noise)
  public playSwoosh() {
    const actx = this.ctx;
    const gainObj = this.createGain(0.18, 0.25);
    if (!gainObj || !actx) return;

    const { node, time } = gainObj;
    const bufferSize = actx.sampleRate * 0.18;
    const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = actx.createBufferSource();
    noise.buffer = buffer;

    const filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(120, time + 0.18);

    noise.connect(filter);
    filter.connect(node);
    noise.start(time);
  }

  // Quick bubble splash sound (ascending pitch sinusoidal wave)
  public playCatch() {
    const gainObj = this.createGain(0.15, 0.2);
    if (!gainObj || !this.ctx) return;

    const { node, time } = gainObj;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, time);
    osc.frequency.exponentialRampToValueAtTime(900, time + 0.12);

    osc.connect(node);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  // Rare/Gold fish caught sound (beautiful high-pitch metallic chime)
  public playRareCatch() {
    const actx = this.ctx;
    const gainObj = this.createGain(0.4, 0.2);
    if (!gainObj || !actx) return;

    const { node, time } = gainObj;
    
    // Play dual oscillator for rich chime
    const osc1 = actx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, time);
    osc1.frequency.exponentialRampToValueAtTime(1400, time + 0.1);
    osc1.frequency.linearRampToValueAtTime(1100, time + 0.3);

    const osc2 = actx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1200, time);
    osc2.frequency.exponentialRampToValueAtTime(1800, time + 0.08);

    // Very short vibrato/delay
    const delay = actx.createDelay();
    delay.delayTime.value = 0.04;

    osc1.connect(node);
    osc2.connect(node);
    
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.4);
    osc2.stop(time + 0.4);
  }

  // Shock sound (buzzing frequency modulation for Jellyfish shock)
  public playShock() {
    const actx = this.ctx;
    const gainObj = this.createGain(0.4, 0.35);
    if (!gainObj || !actx) return;

    const { node, time } = gainObj;

    const carrier = actx.createOscillator();
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(150, time);

    const modulator = actx.createOscillator();
    modulator.type = 'square';
    modulator.frequency.setValueAtTime(45, time);

    const modGain = actx.createGain();
    modGain.gain.setValueAtTime(120, time);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    carrier.connect(node);
    
    modulator.start(time);
    carrier.start(time);
    
    modulator.stop(time + 0.4);
    carrier.stop(time + 0.4);
  }

  // Explosion sound (Pufferfish explode, low frequency puff noise)
  public playExplosion() {
    const actx = this.ctx;
    const gainObj = this.createGain(0.5, 0.4);
    if (!gainObj || !actx) return;

    const { node, time } = gainObj;

    // Buffer for white-brown noise
    const bufferSize = actx.sampleRate * 0.5;
    const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
       const white = Math.random() * 2 - 1;
       // Semi-brown noise filter
       data[i] = (lastOut + (0.05 * white)) / 1.05;
       lastOut = data[i];
       data[i] *= 3.5; // Amplify
    }

    const noise = actx.createBufferSource();
    noise.buffer = buffer;

    const lpFilter = actx.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.setValueAtTime(300, time);
    lpFilter.frequency.exponentialRampToValueAtTime(40, time + 0.4);

    noise.connect(lpFilter);
    lpFilter.connect(node);

    const subOsc = actx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(100, time);
    subOsc.frequency.linearRampToValueAtTime(30, time + 0.4);
    subOsc.connect(node);

    noise.start(time);
    subOsc.start(time);

    noise.stop(time + 0.5);
    subOsc.stop(time + 0.5);
  }

  // Second tick sound for countdown
  public playTick() {
    const gainObj = this.createGain(0.06, 0.15);
    if (!gainObj || !this.ctx) return;

    const { node, time } = gainObj;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, time);

    osc.connect(node);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  // Short buzzer for combo reset or miss
  public playBuzz() {
    const gainObj = this.createGain(0.2, 0.15);
    if (!gainObj || !this.ctx) return;

    const { node, time } = gainObj;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.linearRampToValueAtTime(150, time + 0.18);

    osc.connect(node);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  // Game over standard chime (major downward or upward arpeggio)
  public playGameOver(won: boolean) {
    const actx = this.ctx;
    if (this.isMuted) return;
    this.init();
    if (!actx) return;

    const time = actx.currentTime;

    const notes = won ? [261.63, 329.63, 392.00, 523.25] : [392.00, 349.23, 311.13, 233.08]; // C major vs G minor fall
    const duration = 0.2;

    notes.forEach((freq, idx) => {
      const gNode = actx.createGain();
      gNode.gain.setValueAtTime(0.15, time + idx * 0.15);
      gNode.gain.exponentialRampToValueAtTime(0.0001, time + idx * 0.15 + duration);
      gNode.connect(actx.destination);

      const osc = actx.createOscillator();
      osc.type = won ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, time + idx * 0.15);
      
      osc.connect(gNode);
      osc.start(time + idx * 0.15);
      osc.stop(time + idx * 0.15 + duration);
    });
  }
}

export const sound = new SoundManager();
