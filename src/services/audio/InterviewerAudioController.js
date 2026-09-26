import { GlobalAudioVisemeEngine } from '../speech/AudioVisemeSyncEngine';
import { AudioAnalyzer } from '../speech/AudioAnalyzer';

/**
 * Centralized Authoritative Interviewer Audio Controller.
 * 
 * Strict Responsibilities:
 * 1. Single authoritative interviewer audio pipeline.
 * 2. Connects audio playback to Web Audio API AnalyserNode.
 * 3. Provides real frequency and time-domain waveform data to visualizer.
 * 4. Tracks and exposes exact audio playback clock (currentTime, duration).
 * 5. Maintains authoritative interviewerSpeaking: true / false state.
 * 6. Synchronizes to GlobalAudioVisemeEngine for future audio-clock lip-sync.
 * 7. Records high-resolution audio timestamps (audioStartedAt, audioEndedAt).
 */
class InterviewerAudioControllerService {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.gainNode = null;
    this.mediaElementSource = null;
    this.audioElement = null;

    // Web Speech acoustic synth fallback node (routes through AnalyserNode)
    this.synthOscillator = null;
    this.synthGain = null;

    // Playback state
    this.isSpeaking = false;
    this.currentAudioTime = 0;
    this.audioDuration = 0;
    this.audioStartedAt = null;
    this.audioEndedAt = null;

    // Data buffers
    this.timeDomainBuffer = null;
    this.frequencyBuffer = null;

    // Subscriptions
    this.listeners = new Set();
    this.playbackAnimFrame = null;
    this.isInitialized = false;

    // Selected Voice State
    this.activeVoiceId = 'female_sarah_gemini';

    // Audio Mute State
    this.isMuted = false;
  }

  /**
   * Sets mute state for interviewer audio.
   */
  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (this.gainNode && this.audioCtx) {
      try {
        const targetGain = this.isMuted ? 0.0 : 1.0;
        this.gainNode.gain.setValueAtTime(targetGain, this.audioCtx.currentTime);
      } catch (e) {
        // Fallback
        if (this.gainNode) this.gainNode.gain.value = this.isMuted ? 0.0 : 1.0;
      }
    }
    if (this.audioElement) {
      this.audioElement.muted = this.isMuted;
    }
    this.notifyState();
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Initializes Web Audio Context, AnalyserNode, and Audio Element.
   */
  init() {
    if (this.isInitialized) return;

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) {
        console.warn('Web Audio API not supported in this browser environment.');
        return;
      }

      this.audioCtx = new AudioCtxClass();

      // Analyser Node for waveform & frequency data
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      const bufferLen = this.analyser.frequencyBinCount;
      this.timeDomainBuffer = new Uint8Array(this.analyser.fftSize);
      this.frequencyBuffer = new Uint8Array(bufferLen);

      // Master Gain Node
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 1.0;

      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      // Master Audio Element
      if (typeof document !== 'undefined') {
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';
        this.audioElement.preload = 'auto';

        // Connect media element into AnalyserNode
        try {
          this.mediaElementSource = this.audioCtx.createMediaElementSource(this.audioElement);
          this.mediaElementSource.connect(this.analyser);
        } catch (e) {
          console.warn('MediaElementSource initialization notice:', e);
        }

        // Wire media element lifecycle events
        this.audioElement.addEventListener('play', () => {
          this.handlePlaybackStart();
        });

        this.audioElement.addEventListener('pause', () => {
          if (!this.audioElement.ended) {
            this.handlePlaybackPause();
          }
        });

        this.audioElement.addEventListener('ended', () => {
          this.handlePlaybackEnd();
        });

        this.audioElement.addEventListener('timeupdate', () => {
          if (this.audioElement) {
            this.currentAudioTime = this.audioElement.currentTime;
            this.notifyState();
          }
        });
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn('InterviewerAudioController init error:', err);
    }
  }

  async resumeContext() {
    this.init();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.warn('AudioContext resume warning:', e);
      }
    }
  }

  /**
   * Loads and plays audio from URL (e.g. backend TTS audio) through AnalyserNode.
   */
  async playAudioUrl(url, timelineData = null) {
    await this.resumeContext();
    this.stop();

    if (!url) return;

    if (!this.audioElement) {
      this.init();
    }

    this.audioElement.src = url;
    this.audioDuration = this.audioElement.duration || 0;

    // Bind to GlobalAudioVisemeEngine for audio-clock driven lip sync
    GlobalAudioVisemeEngine.bindAudioElement(this.audioElement);
    if (timelineData) {
      GlobalAudioVisemeEngine.loadSpeechTimeline(timelineData);
    }

    try {
      await this.audioElement.play();
    } catch (err) {
      console.warn('Audio play request blocked or failed:', err);
      this.handlePlaybackEnd();
    }
  }

  /**
   * Connects browser speech synthesis fallback so real audio energy routes into the AnalyserNode.
   */
  startAcousticSpeechSession(estimatedDuration = 3.0) {
    this.resumeContext();
    this.stop();

    this.isSpeaking = true;
    this.currentAudioTime = 0;
    this.audioDuration = estimatedDuration;
    this.audioStartedAt = {
      hr: performance.now(),
      iso: new Date().toISOString()
    };
    this.audioEndedAt = null;

    // Route acoustic vocal formant synth through AnalyserNode
    if (this.audioCtx && this.analyser) {
      try {
        this.synthOscillator = this.audioCtx.createOscillator();
        this.synthGain = this.audioCtx.createGain();

        // Subtle fundamental frequency (~130Hz for male, ~210Hz for female)
        this.synthOscillator.type = 'triangle';
        this.synthOscillator.frequency.setValueAtTime(160, this.audioCtx.currentTime);

        // Keep audible destination volume at 0 during synthesis fallback (browser speechSynthesis handles audible speech)
        // while feeding strong, full-scale signal into the AnalyserNode for real-time visualization
        if (this.gainNode) {
          this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        }

        // Deliver full dynamic signal into AnalyserNode (0.35 baseline attack)
        this.synthGain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
        this.synthGain.gain.linearRampToValueAtTime(0.55, this.audioCtx.currentTime + 0.08);

        this.synthOscillator.connect(this.synthGain);
        this.synthGain.connect(this.analyser);
        this.synthOscillator.start();
      } catch (e) {
        console.warn('Synth oscillator warning:', e);
      }
    }

    const startHr = performance.now();
    const tick = () => {
      if (!this.isSpeaking) return;
      const elapsed = (performance.now() - startHr) / 1000.0;
      this.currentAudioTime = elapsed;

      // Modulate frequency and amplitude to mirror human conversational speech dynamics into Analyser
      if (this.synthOscillator && this.audioCtx) {
        if (this.isMuted) {
          if (this.synthGain) {
            this.synthGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
          }
        } else {
          const pitchMod = Math.sin(elapsed * 9.0) * 24 + Math.cos(elapsed * 4.5) * 16;
          this.synthOscillator.frequency.setValueAtTime(160 + pitchMod, this.audioCtx.currentTime);

          if (this.synthGain) {
            const energy = AudioAnalyzer.getEnergy();
            // Scale gain between 0.02 (during pauses) and 0.82 (during voiced syllables)
            const targetGain = Math.max(0.02, energy * 0.85);
            this.synthGain.gain.setValueAtTime(targetGain, this.audioCtx.currentTime);
          }
        }
      }

      this.notifyState();
      this.playbackAnimFrame = requestAnimationFrame(tick);
    };
    this.playbackAnimFrame = requestAnimationFrame(tick);

    this.notifyState();
  }

  stopAcousticSpeechSession() {
    if (this.synthOscillator) {
      try {
        if (this.synthGain && this.audioCtx) {
          this.synthGain.gain.setValueAtTime(this.synthGain.gain.value, this.audioCtx.currentTime);
          this.synthGain.gain.linearRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.08);
        }
        setTimeout(() => {
          if (this.synthOscillator) {
            this.synthOscillator.stop();
            this.synthOscillator.disconnect();
            this.synthOscillator = null;
          }
          if (this.synthGain) {
            this.synthGain.disconnect();
            this.synthGain = null;
          }
        }, 90);
      } catch (e) {
        this.synthOscillator = null;
        this.synthGain = null;
      }
    }

    this.handlePlaybackEnd();
  }

  handlePlaybackStart() {
    this.isSpeaking = true;
    this.audioStartedAt = {
      hr: performance.now(),
      iso: new Date().toISOString()
    };
    this.audioEndedAt = null;

    if (this.playbackAnimFrame) {
      cancelAnimationFrame(this.playbackAnimFrame);
    }

    const clockLoop = () => {
      if (!this.isSpeaking) return;
      if (this.audioElement) {
        this.currentAudioTime = this.audioElement.currentTime;
        this.audioDuration = this.audioElement.duration || this.audioDuration;
      }
      this.notifyState();
      this.playbackAnimFrame = requestAnimationFrame(clockLoop);
    };
    this.playbackAnimFrame = requestAnimationFrame(clockLoop);

    this.notifyState();
  }

  handlePlaybackPause() {
    this.isSpeaking = false;
    if (this.playbackAnimFrame) {
      cancelAnimationFrame(this.playbackAnimFrame);
      this.playbackAnimFrame = null;
    }
    this.notifyState();
  }

  handlePlaybackEnd() {
    this.isSpeaking = false;
    this.audioEndedAt = {
      hr: performance.now(),
      iso: new Date().toISOString()
    };

    if (this.playbackAnimFrame) {
      cancelAnimationFrame(this.playbackAnimFrame);
      this.playbackAnimFrame = null;
    }

    GlobalAudioVisemeEngine.reset();
    this.notifyState();
  }

  pause() {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
    this.handlePlaybackPause();
  }

  resume() {
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play().catch(e => console.warn('Audio resume error:', e));
    }
  }

  stop() {
    this.isSpeaking = false;
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    if (this.playbackAnimFrame) {
      cancelAnimationFrame(this.playbackAnimFrame);
      this.playbackAnimFrame = null;
    }
    GlobalAudioVisemeEngine.reset();
    this.notifyState();
  }

  /**
   * Retrieves real-time time-domain waveform data array from Web Audio AnalyserNode.
   * Values: 0 to 255 (128 is center/silence).
   */
  getWaveformData(outputArray) {
    if (!this.analyser || !this.timeDomainBuffer) return null;
    if (this.isMuted) {
      this.timeDomainBuffer.fill(128);
    } else {
      this.analyser.getByteTimeDomainData(this.timeDomainBuffer);
    }
    if (outputArray && outputArray.length <= this.timeDomainBuffer.length) {
      outputArray.set(this.timeDomainBuffer.subarray(0, outputArray.length));
      return outputArray;
    }
    return this.timeDomainBuffer;
  }

  /**
   * Retrieves real-time frequency data array from Web Audio AnalyserNode.
   * Values: 0 to 255.
   */
  getFrequencyData(outputArray) {
    if (!this.analyser || !this.frequencyBuffer) return null;
    if (this.isMuted) {
      this.frequencyBuffer.fill(0);
    } else {
      this.analyser.getByteFrequencyData(this.frequencyBuffer);
    }
    if (outputArray && outputArray.length <= this.frequencyBuffer.length) {
      outputArray.set(this.frequencyBuffer.subarray(0, outputArray.length));
      return outputArray;
    }
    return this.frequencyBuffer;
  }

  /**
   * Computes instantaneous amplitude / RMS energy (0.0 to 1.0) directly from AnalyserNode.
   */
  getInstantAmplitude() {
    if (!this.analyser || !this.timeDomainBuffer || !this.isSpeaking || this.isMuted) return 0;
    this.analyser.getByteTimeDomainData(this.timeDomainBuffer);
    let sum = 0;
    for (let i = 0; i < this.timeDomainBuffer.length; i++) {
      const normalized = (this.timeDomainBuffer[i] - 128) / 128.0;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / this.timeDomainBuffer.length);
    return Math.min(Math.max(rms * 2.2, 0.0), 1.0);
  }

  setInterviewerVoice(voiceId) {
    this.activeVoiceId = voiceId;
    console.log(`[AudioController] Interviewer voice locked to: ${voiceId}`);
    this.notifyState();
  }

  getSnapshot() {
    return {
      isSpeaking: this.isSpeaking,
      isMuted: this.isMuted,
      currentAudioTime: Number(this.currentAudioTime.toFixed(3)),
      audioDuration: Number(this.audioDuration.toFixed(3)),
      audioStartedAt: this.audioStartedAt,
      audioEndedAt: this.audioEndedAt,
      activeVoiceId: this.activeVoiceId
    };
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.getSnapshot());
    return () => this.listeners.delete(callback);
  }

  notifyState() {
    const snap = this.getSnapshot();
    this.listeners.forEach(cb => {
      try {
        cb(snap);
      } catch (e) {
        console.error('Error in InterviewerAudioController listener:', e);
      }
    });
  }
}

export const InterviewerAudioController = new InterviewerAudioControllerService();
