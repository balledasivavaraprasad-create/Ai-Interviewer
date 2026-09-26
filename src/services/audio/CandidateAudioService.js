import { CandidateTracker } from '../vision/CandidateTracker';

/**
 * Manages candidate microphone audio acquisition and real-time acoustic energy analysis.
 * Feeds energy measurements to CandidateTracker for multimodal speaking state detection.
 */
class CandidateAudioService {
  constructor() {
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.animFrameId = null;
    this.isMuted = false;
    this.dataArray = null;
  }

  async start() {
    if (this.stream) return this.stream;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.stream = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.75;

      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      this.startMonitoringLoop();
      return stream;
    } catch (err) {
      console.warn('Microphone permission denied or audio device unavailable:', err);
      throw err;
    }
  }

  startMonitoringLoop() {
    const tick = () => {
      if (this.analyser && !this.isMuted) {
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        // Focus on vocal speech frequencies (approx 100 Hz to 3500 Hz)
        const relevantBins = Math.min(this.dataArray.length, 64);
        for (let i = 0; i < relevantBins; i++) {
          sum += this.dataArray[i];
        }
        const avg = sum / (relevantBins * 255.0);
        CandidateTracker.updateAudioEnergy(avg);
      } else {
        CandidateTracker.updateAudioEnergy(0);
      }

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.stream) {
      this.stream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
    if (muted) {
      CandidateTracker.updateAudioEnergy(0);
    }
  }

  stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) {
        // ignore
      }
      this.source = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {
        // ignore
      }
      this.audioContext = null;
    }

    this.analyser = null;
    CandidateTracker.updateAudioEnergy(0);
  }
}

export const CandidateAudio = new CandidateAudioService();
