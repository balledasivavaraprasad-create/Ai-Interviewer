/**
 * Web Audio Analyser abstraction for real-time audio visualization and amplitude metrics.
 */
class AudioAnalyzerService {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.dataArray = null;
    this.isInitialized = false;
    this.isUnlocked = false;
    this.simulatedEnergy = 0;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
        this.isInitialized = true;
      }
    } catch (err) {
      console.warn('AudioContext not supported or blocked:', err);
    }
  }

  async unlock() {
    this.init();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
        this.isUnlocked = true;
      } catch (e) {
        console.warn('Failed to resume AudioContext:', e);
      }
    } else if (this.audioCtx) {
      this.isUnlocked = true;
    }
  }

  connectMediaElement(audioElement) {
    this.init();
    if (!this.audioCtx || !this.analyser || !audioElement) return;
    try {
      const source = this.audioCtx.createMediaElementSource(audioElement);
      source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    } catch (e) {
      // Source might already be connected
    }
  }

  setSimulatedEnergy(val) {
    this.simulatedEnergy = val;
  }

  /**
   * Returns normalized audio energy in range [0.0, 1.0]
   */
  getEnergy() {
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const realEnergy = (sum / this.dataArray.length) / 255.0;
      if (realEnergy > 0.01) return realEnergy;
    }
    return this.simulatedEnergy;
  }
}

export const AudioAnalyzer = new AudioAnalyzerService();
