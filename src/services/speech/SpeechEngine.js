import { VisemeTimeline } from './VisemeTimeline';
import { AudioAnalyzer } from './AudioAnalyzer';
import { VOICE_PROFILES } from '../../config/interviewers';
import { GlobalAudioVisemeEngine } from './AudioVisemeSyncEngine';

/**
 * Unified Speech Engine and Authoritative Timeline Coordinator.
 * Permanently locks voice profile to selected interviewer persona for the entire session.
 */
class SpeechEngineService {
  constructor() {
    this.timeline = new VisemeTimeline();
    this.isSpeaking = false;
    this.startTime = 0;
    this.currentText = '';
    this.listeners = new Set();
    this.animFrameId = null;
    this.activeUtterance = null;
    this.customProvider = null;
    this.audioElement = null;

    // Locked Session Persona
    this.currentGender = 'female';
    this.lockedVoice = null;
    this.voicesLoaded = false;
    this.availableVoices = [];

    // Initialize browser speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices() || [];
        if (voices.length > 0) {
          this.availableVoices = voices;
          this.voicesLoaded = true;
          // Refresh locked voice if gender is set
          if (this.currentGender) {
            this.lockSessionVoice(this.currentGender);
          }
        }
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  /**
   * Permanently locks the interviewer voice for the session.
   */
  lockSessionVoice(gender) {
    this.currentGender = gender === 'male' ? 'male' : 'female';
    const profile = VOICE_PROFILES[this.currentGender] || VOICE_PROFILES.female;

    const voices = this.availableVoices.length > 0 
      ? this.availableVoices 
      : (typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : []);

    if (voices.length === 0) {
      this.lockedVoice = null;
      return;
    }

    const preferredList = profile.preferredWebSpeechVoices;

    // 1. Search for explicit preferred names
    for (const name of preferredList) {
      const match = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
      if (match) {
        this.lockedVoice = match;
        return;
      }
    }

    // 2. Strict gender-filtered fallback
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    const isFemale = this.currentGender === 'female';

    if (isFemale) {
      // Find voice that is NOT an obvious male name
      const maleNames = ['alex', 'daniel', 'fred', 'oliver', 'tom', 'david', 'guy', 'george'];
      const candidate = enVoices.find(v => {
        const lower = v.name.toLowerCase();
        return !maleNames.some(m => lower.includes(m)) && (lower.includes('female') || lower.includes('woman') || lower.includes('natural') || !lower.includes('male'));
      });
      this.lockedVoice = candidate || enVoices[0] || voices[0];
    } else {
      // Find voice with male keywords or in male list
      const femaleNames = ['samantha', 'victoria', 'karen', 'tessa', 'moira', 'zira', 'jenny', 'fiona'];
      const candidate = enVoices.find(v => {
        const lower = v.name.toLowerCase();
        return !femaleNames.some(f => lower.includes(f)) && (lower.includes('male') || lower.includes('man') || !lower.includes('female'));
      });
      this.lockedVoice = candidate || enVoices[0] || voices[0];
    }
  }

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

  setCustomTTSProvider(provider) {
    this.customProvider = provider;
  }

  /**
   * Starts speaking text with timeline synchronization.
   */
  async speak(text, options = {}) {
    // 1. Immediately cancel any prior speech
    this.stop();

    if (!text || !text.trim()) return;

    await AudioAnalyzer.unlock();

    this.currentText = text.trim();
    if (options.gender) {
      this.lockSessionVoice(options.gender);
    } else if (!this.lockedVoice) {
      this.lockSessionVoice(this.currentGender);
    }

    const onStart = options.onStart;
    const onEnd = options.onEnd;
    const onError = options.onError;

    // Check custom backend TTS provider if configured
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

    // Default: Browser Web Speech API with locked voice profile
    this.playBrowserSpeech(this.currentText, onStart, onEnd, onError);
  }

  playBrowserSpeech(text, onStart, onEnd, onError) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis not supported on this browser.');
      if (onError) onError(new Error('SpeechSynthesis not supported'));
      return;
    }

    const words = text.split(/\s+/).filter(Boolean);
    const profile = VOICE_PROFILES[this.currentGender] || VOICE_PROFILES.female;

    // Natural executive cadence word timing for subtitles
    const estimatedDuration = Math.max(words.length * 0.42, 1.5);
    this.timeline.buildWordTranscript(text, estimatedDuration);

    const utterance = new SpeechSynthesisUtterance(text);
    this.activeUtterance = utterance;

    // Ensure session voice is locked
    if (!this.lockedVoice) {
      this.lockSessionVoice(this.currentGender);
    }

    if (this.lockedVoice) {
      utterance.voice = this.lockedVoice;
    }

    utterance.rate = profile.rate;
    utterance.pitch = profile.pitch;

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
      console.warn('SpeechSynthesis error:', e);
      this.handleSpeechComplete(onEnd);
      if (onError) onError(e);
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Error in speechSynthesis.speak:', e);
      this.handleSpeechComplete(onEnd);
    }
  }

  playCustomAudio(result, onStart, onEnd, onError) {
    if (result && result.segments && result.segments.length > 0) {
      this.timeline.buildFromAudioSegments(result);
    } else {
      this.timeline.buildWordTranscript(this.currentText, result.duration);
    }

    const audio = new Audio(result.audioUrl);
    this.audioElement = audio;
    AudioAnalyzer.connectMediaElement(audio);

    // Audio-clock viseme synchronization binding
    GlobalAudioVisemeEngine.bindAudioElement(audio);
    GlobalAudioVisemeEngine.loadSpeechTimeline(result);

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
      console.warn('Audio play blocked:', err);
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

    GlobalAudioVisemeEngine.reset();

    AudioAnalyzer.setSimulatedEnergy(0);

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
