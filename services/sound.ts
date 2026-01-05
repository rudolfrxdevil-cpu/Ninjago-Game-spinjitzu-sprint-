export class SoundController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private spinOsc: OscillatorNode | null = null;
  private spinGain: GainNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    this.isMuted = localStorage.getItem('ninjaMute') === 'true';
  }

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.updateMuteState();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('ninjaMute', String(this.isMuted));
    this.updateMuteState();
    return this.isMuted;
  }

  getMuted() {
    return this.isMuted;
  }

  private updateMuteState() {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.3, this.ctx.currentTime);
    }
  }

  playClick() {
    this.init();
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playJump() {
    this.init();
    if (this.isMuted || !this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playCollect() {
    this.init();
    if (this.isMuted || !this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playCrash() {
    this.init();
    if (this.isMuted || !this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 sec
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = this.ctx.createGain();
    noise.connect(gain);
    gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    
    noise.start();
  }

  startSpin() {
    this.init();
    if (this.isMuted || !this.ctx || !this.masterGain || this.spinOsc) return;

    this.spinOsc = this.ctx.createOscillator();
    this.spinGain = this.ctx.createGain();
    
    this.spinOsc.type = 'sawtooth';
    this.spinOsc.frequency.setValueAtTime(100, this.ctx.currentTime);
    
    // Low pass filter to dampen the harsh sawtooth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    this.spinOsc.connect(filter);
    filter.connect(this.spinGain);
    this.spinGain.connect(this.masterGain);
    
    this.spinGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.spinGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.1);
    
    this.spinOsc.start();
  }

  stopSpin() {
    if (this.spinOsc && this.spinGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.spinGain.gain.cancelScheduledValues(now);
      this.spinGain.gain.setValueAtTime(this.spinGain.gain.value, now);
      this.spinGain.gain.linearRampToValueAtTime(0, now + 0.1);
      
      this.spinOsc.stop(now + 0.1);
      this.spinOsc = null;
      this.spinGain = null;
    }
  }
}

export const soundManager = new SoundController();
