import { VISEMES } from './VisemeDefinitions';

/**
 * Audio-Clock Driven Viseme Synchronization Engine.
 * 
 * Follows strict architectural specification:
 * 1. Synchronized to actual HTMLAudioElement.currentTime (or Web Audio clock).
 * 2. Does NOT use setTimeout or setInterval or character-count guessing.
 * 3. Does NOT generate fake visemes from arbitrary text strings.
 * 4. Accepts structured speech segment timeline:
 *    {
 *      audioId: string,
 *      duration: number,
 *      segments: [
 *        { start: number, end: number, viseme: string }
 *      ]
 *    }
 * 5. If audio pauses -> mouth pauses.
 *    If audio seeks -> mouth seeks to exact speech timestamp.
 *    If audio ends or silent -> mouth smoothly returns to neutral resting face.
 * 6. Smooth cosine/hermite interpolation between adjacent viseme targets to prevent jitter.
 */
export class AudioVisemeSyncEngine {
  constructor() {
    this.currentTrack = null;
    this.audioElement = null;
    this.audioContext = null;
    this.segments = [];
    this.duration = 0;
    this.isPlaying = false;

    // Smoothed output weights
    this.currentWeights = {
      jawOpen: 0,
      lipWidth: 0,
      lipPucker: 0,
      upperLipRaise: 0,
      lowerLipDepress: 0,
      lipClose: 0,
      mouthCornerPull: 0,
      chinRaise: 0
    };

    this.targetWeights = { ...this.currentWeights };
    this.neutralWeights = { ...this.currentWeights };
  }

  /**
   * Load real speech audio timeline with explicit phoneme/viseme boundaries.
   * Structure: { audioId: string, duration: number, segments: [{ start, end, viseme }] }
   */
  loadSpeechTimeline(speechTimeline) {
    if (!speechTimeline || !Array.isArray(speechTimeline.segments)) {
      this.clearSpeechTimeline();
      return;
    }

    this.currentTrack = speechTimeline.audioId || null;
    this.duration = speechTimeline.duration || 0;
    this.segments = [...speechTimeline.segments].sort((a, b) => a.start - b.start);
  }

  /**
   * Bind to an actual HTMLAudioElement source of truth.
   */
  bindAudioElement(audioEl) {
    this.audioElement = audioEl;
  }

  clearSpeechTimeline() {
    this.currentTrack = null;
    this.segments = [];
    this.duration = 0;
    this.targetWeights = { ...this.neutralWeights };
  }

  /**
   * Sample viseme weights strictly from audio playback clock.
   * @param {number} delta - Frame delta time in seconds
   * @param {number|null} explicitPlaybackTime - Optional explicit audio playback time
   * @returns {Object} Interpolated facial weights
   */
  update(delta, explicitPlaybackTime = null) {
    let playheadTime = -1;

    if (explicitPlaybackTime !== null && explicitPlaybackTime !== undefined) {
      playheadTime = explicitPlaybackTime;
    } else if (this.audioElement && !this.audioElement.paused && !this.audioElement.ended) {
      playheadTime = this.audioElement.currentTime;
    }

    // If no audio is currently playing or no segments loaded, target is strictly neutral
    if (playheadTime < 0 || this.segments.length === 0 || playheadTime > this.duration) {
      this.targetWeights = { ...this.neutralWeights };
    } else {
      // Find current viseme segment in timeline
      const activeSegment = this.findActiveSegment(playheadTime);
      if (activeSegment) {
        const visemeShape = VISEMES[activeSegment.viseme] || VISEMES.SILENCE;
        const nextSegment = this.findNextSegment(playheadTime);
        const nextShape = nextSegment ? (VISEMES[nextSegment.viseme] || VISEMES.SILENCE) : visemeShape;

        // Cosine ease interpolation between current and next viseme
        const segDuration = Math.max(activeSegment.end - activeSegment.start, 0.04);
        const progress = Math.min(Math.max((playheadTime - activeSegment.start) / segDuration, 0), 1);
        const blendFactor = 0.5 - (0.5 * Math.cos(progress * Math.PI));

        for (const key of Object.keys(this.currentWeights)) {
          const valA = visemeShape[key] ?? 0;
          const valB = nextShape[key] ?? 0;
          this.targetWeights[key] = valA + (valB - valA) * blendFactor;
        }
      } else {
        this.targetWeights = { ...this.neutralWeights };
      }
    }

    // Exponential smoothing to eliminate jitter while staying responsive (~22/s damping)
    const smoothRate = Math.min(delta * 22, 1.0);
    for (const key of Object.keys(this.currentWeights)) {
      const cur = this.currentWeights[key];
      const tgt = this.targetWeights[key];
      this.currentWeights[key] = cur + (tgt - cur) * smoothRate;
    }

    return this.currentWeights;
  }

  findActiveSegment(time) {
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      if (time >= seg.start && time <= seg.end) {
        return seg;
      }
    }
    return null;
  }

  findNextSegment(time) {
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      if (time < seg.start) {
        return seg;
      }
    }
    return null;
  }

  reset() {
    this.clearSpeechTimeline();
    this.currentWeights = { ...this.neutralWeights };
    this.targetWeights = { ...this.neutralWeights };
  }
}

export const GlobalAudioVisemeEngine = new AudioVisemeSyncEngine();
