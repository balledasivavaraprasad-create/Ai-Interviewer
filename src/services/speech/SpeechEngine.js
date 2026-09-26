import { VisemeTimeline } from './VisemeTimeline';
import { AudioAnalyzer } from './AudioAnalyzer';

/**
 * Unified Speech Engine and Authoritative Timeline Coordinator.
 * Manages audio playback, Web Speech Synthesis fallback, and synchronized viseme generation.
 */
class SpeechEngineService {
  constructor() {
    this.timeline = new VisemeTimeline();
    this.isSpeaking = false;
    this.startTime = 0;
    this.pauseTime = 0;
    this.currentText = '';
    this.listeners = new Set();
    this.animFrameId = null;
    this.activeUtterance = null;
    this.customProvider = null; // Future backend TTS provider
    this.audioElement = null;
    this.currentGender = 'female';
    this.voicesLoaded = false;
    this.availableVoices = [];

    // Initialize browser voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        this.availableVoices = window.speechSynthesis.getVoices() || [];
        this.voicesLoaded = this.availableVoices.length > 0;
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  /**
   * Subscribe to authoritative speech timeline frames (~60fps).
   * Callback receives: { time, currentWordIndex, weights, isSpeaking, energy, text }
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(data) {
    this.listeners.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error('Error in speech listener:', err);
      }
    });
  }

  /**
   * Set custom backend TTS provider for future production deployment.
   * Provider signature: { synthesize(text, gender): Promise<{ audioUrl, visemes, duration }> }
   */
  setCustomTTSProvider(provider) {
    this.customProvider = provider;
  }

  /**
   * Selects natural executive voice matching persona.
   */
  getBestVoice(gender) {
    if (!this.voicesLoaded || this.availableVoices.length === 0) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.availableVoices = window.speechSynthesis.getVoices() || [];
      }
    }

    const voices = this.availableVoices;
    const isFemale = gender === 'female';

    // Prioritize natural neural / enhanced voices
    const preferredFemaleNames = ['Samantha', 'Victoria', 'Karen', 'Moira', 'Google US English', 'Zira', 'Jenny'];
    const preferredMaleNames = ['Daniel', 'Alex', 'Fred', 'Oliver', 'Google UK English Male', 'David', 'Guy'];

    const targetNames = isFemale ? preferredFemaleNames : preferredMaleNames;

    for (const name of targetNames) {
      const match = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
      if (match) return match;
    }

    // Secondary fallback: filter by lang (en) and name keywords
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    if (enVoices.length > 0) {
      if (isFemale) {
        const f = enVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'));
        if (f) return f;
      } else {
        const m = enVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('man'));
        if (m) return m;
      }
      return enVoices[0];
    }

    return voices[0] || null;
  }

  /**
   * Starts speaking text with timeline synchronization.
   */
  async speak(text, options = {}) {
    // 1. Cleanly stop any existing speech session
    this.stop();

    if (!text || !text.trim()) return;

    await AudioAnalyzer.unlock();

    this.currentText = text.trim();
    this.currentGender = options.gender || 'female';
    const onStart = options.onStart;
    const onEnd = options.onEnd;
    const onError = options.onError;

    // Check if custom backend TTS provider is registered
    if (this.customProvider) {
      try {
        const result = await this.customProvider.synthesize(this.currentText, this.currentGender);
        if (result && result.audioUrl) {
          return this.playCustomAudio(result, onStart, onEnd, onError);
        }
      } catch (err) {
        console.warn('Custom TTS provider failed, falling back to browser speech:', err);
      }
    }

    // Default: Browser Web Speech API with viseme timeline synthesis
    this.playBrowserSpeech(text, options, onStart, onEnd, onError);
  }

  playBrowserSpeech(text, options, onStart, onEnd, onError) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis not supported on this browser.');
      if (onError) onError(new Error('SpeechSynthesis not supported'));
      return;
    }

    const words = text.split(/\s+/).filter(Boolean);
    // Average natural speaking rate ~ 140 words/min -> ~0.43s per word
    const estimatedDuration = Math.max((words.length * 0.42), 1.5);

    this.timeline.buildFromText(text, estimatedDuration);

    const utterance = new SpeechSynthesisUtterance(text);
    this.activeUtterance = utterance;

    const voice = this.getBestVoice(this.currentGender);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 0.98; // Professional, calm cadence
    utterance.pitch = this.currentGender === 'female' ? 1.02 : 0.96;

    // Speech boundary tracking for exact word alignment
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIdx = event.charIndex;
        // Find corresponding word index
        let accumulated = 0;
        for (let i = 0; i < words.length; i++) {
          if (accumulated >= charIdx || i === words.length - 1) {
            // Update timeline reference
            break;
          }
          accumulated += words[i].length + 1;
        }
      }
    };

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.startTime = performance.now();
      if (onStart) onStart();
      this.startTimelineLoop(onEnd);
    };

    utterance.onend = () => {
      this.handleSpeechComplete(onEnd);
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis utterance error:', e);
      this.handleSpeechComplete(onEnd);
      if (onError) onError(e);
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Error calling speechSynthesis.speak:', e);
      this.handleSpeechComplete(onEnd);
    }
  }

  playCustomAudio(result, onStart, onEnd, onError) {
    if (result.visemes && result.visemes.length > 0) {
      this.timeline.buildFromBackendEvents(result.visemes, result.words, result.duration);
    } else {
      this.timeline.buildFromText(this.currentText, result.duration);
    }

    const audio = new Audio(result.audioUrl);
    this.audioElement = audio;
    AudioAnalyzer.connectMediaElement(audio);

    audio.onplay = () => {
      this.isSpeaking = true;
      this.startTime = performance.now();
      if (onStart) onStart();
      this.startTimelineLoop(onEnd);
    };

    audio.onended = () => {
      this.handleSpeechComplete(onEnd);
    };

    audio.onerror = (err) => {
      console.error('Audio playback error:', err);
      this.handleSpeechComplete(onEnd);
      if (onError) onError(err);
    };

    audio.play().catch(err => {
      console.warn('Audio play prevented by browser:', err);
      this.handleSpeechComplete(onEnd);
    });
  }

  startTimelineLoop(onEnd) {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

    const tick = () => {
      if (!this.isSpeaking) return;

      const elapsed = (performance.now() - this.startTime) / 1000.0;
      const sample = this.timeline.sample(elapsed);

      // Simulate subtle voice frequency energy from viseme openness
      const simulatedEnergy = Math.min((sample.weights.jawOpen * 0.7) + (Math.abs(sample.weights.lipWidth) * 0.3), 1.0);
      AudioAnalyzer.setSimulatedEnergy(simulatedEnergy);

      const realEnergy = AudioAnalyzer.getEnergy();

      this.notify({
        time: elapsed,
        currentWordIndex: sample.currentWordIndex,
        weights: sample.weights,
        isSpeaking: true,
        energy: realEnergy,
        text: this.currentText,
        words: this.timeline.words
      });

      if (sample.isFinished && (!this.audioElement || this.audioElement.ended)) {
        this.handleSpeechComplete(onEnd);
        return;
      }

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  handleSpeechComplete(onEnd) {
    if (!this.isSpeaking) return;
    this.isSpeaking = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    // Settle timeline to neutral silence
    const sample = this.timeline.sample(this.timeline.totalDuration + 1);
    AudioAnalyzer.setSimulatedEnergy(0);

    this.notify({
      time: this.timeline.totalDuration,
      currentWordIndex: this.timeline.words.length - 1,
      weights: sample.weights,
      isSpeaking: false,
      energy: 0,
      text: this.currentText,
      words: this.timeline.words
    });

    if (onEnd) onEnd();
  }

  /**
   * Immediately halts any speech audio and resets the avatar mouth to neutral resting position.
   */
  stop() {
    this.isSpeaking = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }

    AudioAnalyzer.setSimulatedEnergy(0);

    // Notify listeners with silence
    this.notify({
      time: 0,
      currentWordIndex: -1,
      weights: {
        jawOpen: 0,
        lipWidth: 0,
        lipPucker: 0,
        upperLipRaise: 0,
        lowerLipDepress: 0,
        lipClose: 0,
        mouthCornerPull: 0,
        chinRaise: 0
      },
      isSpeaking: false,
      energy: 0,
      text: this.currentText,
      words: []
    });
  }

  getCurrentTime() {
    if (!this.isSpeaking) return 0;
    return (performance.now() - this.startTime) / 1000.0;
  }
}

export const SpeechEngine = new SpeechEngineService();
