export class AudioEffectGenerator {
  private audioCtx: AudioContext | null = null;
  private nodes: any[] = [];
  private gainNode: GainNode | null = null;

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playUISound(type: 'pop' | 'success' | 'complete' | 'level-up') {
    this.init();
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (!this.audioCtx) return;

    const t = this.audioCtx.currentTime;
    
    if (type === 'pop') {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    } 
    else if (type === 'success' || type === 'complete') {
      // Pleasant double chime
      const freqs = [523.25, 659.25]; // C5, E5
      freqs.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + (idx * 0.1));
        gain.gain.setValueAtTime(0, t + (idx * 0.1));
        gain.gain.linearRampToValueAtTime(0.2, t + (idx * 0.1) + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, t + (idx * 0.1) + 0.4);
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(t + (idx * 0.1));
        osc.stop(t + (idx * 0.1) + 0.4);
      });
    }
    else if (type === 'level-up') {
      // Small fanfare
      const freqs = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      freqs.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.type = 'triangle';
        const startT = t + (idx * 0.15);
        osc.frequency.setValueAtTime(freq, startT);
        gain.gain.setValueAtTime(0, startT);
        gain.gain.linearRampToValueAtTime(idx === freqs.length - 1 ? 0.3 : 0.2, startT + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startT + (idx === freqs.length - 1 ? 0.8 : 0.2));
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.start(startT);
        osc.stop(startT + (idx === freqs.length - 1 ? 0.8 : 0.2));
      });
    }
  }

  stop() {
    this.nodes.forEach(n => {
      try { n.stop(); } catch(e){}
      try { n.disconnect(); } catch(e){}
    });
    this.nodes = [];
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }

  setVolume(volume: number) {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(volume / 100, this.audioCtx.currentTime);
    }
  }

  playMode(mode: string, volume: number) {
    this.stop();
    if (mode === 'None') return;

    this.init();
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (!this.audioCtx) return;

    const vol = volume / 100;

    if (mode === 'White Noise') {
      const bufferSize = 2 * this.audioCtx.sampleRate;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      
      const whiteNoise = this.audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = vol;
      
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3000;
      
      whiteNoise.connect(filter);
      filter.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
      
      whiteNoise.start(0);
      this.nodes.push(whiteNoise, filter);

    } else if (mode === 'Rain') {
      const bufferSize = 2 * this.audioCtx.sampleRate;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * 0.5;
      
      const rainNoise = this.audioCtx.createBufferSource();
      rainNoise.buffer = noiseBuffer;
      rainNoise.loop = true;
      
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800; // Muffled, rainy sound
      
      const filterHigh = this.audioCtx.createBiquadFilter();
      filterHigh.type = 'highpass';
      filterHigh.frequency.value = 50;
      
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = vol * 2;
      
      rainNoise.connect(filter);
      filter.connect(filterHigh);
      filterHigh.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
      
      rainNoise.start(0);
      this.nodes.push(rainNoise, filter, filterHigh);

    } else if (mode === 'Cafe') {
      // Simulate cafe babel with heavily filtered low frequency noise
      const bufferSize = 3 * this.audioCtx.sampleRate;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      
      const noiseSource = this.audioCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter1 = this.audioCtx.createBiquadFilter();
      filter1.type = 'bandpass';
      filter1.frequency.value = 350; 
      filter1.Q.value = 0.5;
      
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = vol;

      noiseSource.connect(filter1);
      filter1.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      noiseSource.start(0);
      this.nodes.push(noiseSource, filter1);

    } else if (mode === 'Lofi') {
      const bufferSize = this.audioCtx.sampleRate;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * 0.1;
      
      const crackle = this.audioCtx.createBufferSource();
      crackle.buffer = noiseBuffer;
      crackle.loop = true;
      const crackleFilter = this.audioCtx.createBiquadFilter();
      crackleFilter.type = 'highpass';
      crackleFilter.frequency.value = 4000;
      
      const osc = this.audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 100;
      
      const lfo = this.audioCtx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 1.0; 
      
      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.value = 0.5;
      lfo.connect(lfoGain.gain);
      
      const oscGain = this.audioCtx.createGain();
      oscGain.gain.value = 0.5;
      
      osc.connect(oscGain);
      oscGain.connect(lfoGain);

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = vol;

      lfoGain.connect(this.gainNode);
      crackle.connect(crackleFilter);
      crackleFilter.connect(this.gainNode);
      
      this.gainNode.connect(this.audioCtx.destination);
      
      osc.start(0);
      lfo.start(0);
      crackle.start(0);
      this.nodes.push(osc, lfo, crackle, crackleFilter, lfoGain, oscGain);
    }
  }
}

export const ambientAudio = new AudioEffectGenerator();
