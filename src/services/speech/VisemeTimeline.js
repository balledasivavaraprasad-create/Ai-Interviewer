import { VISEMES } from './VisemeDefinitions';

/**
 * Viseme and Subtitle Timeline Manager.
 * 
 * Complies with strict non-fake animation mandate:
 * - Does NOT synthesize fake viseme mouth movements from text letters.
 * - Stores structured audio viseme timelines ({ audioId, duration, segments: [{ start, end, viseme }] }).
 * - Tracks subtitle words and speech boundaries with high-resolution timestamps.
 */
export class VisemeTimeline {
  constructor() {
    this.events = [];
    this.words = [];
    this.totalDuration = 0;
    this.audioId = null;
  }

  /**
   * Tracks words for live subtitle transcript without faking mouth visemes.
   */
  buildWordTranscript(text, estimatedDuration) {
    this.events = [];
    this.words = [];

    const rawWords = text.split(/\s+/).filter(Boolean);
    if (rawWords.length === 0) return;

    const totalChars = rawWords.reduce((acc, w) => acc + w.length, 0);
    const duration = Math.max(estimatedDuration || (totalChars * 0.065), 1.2);
    this.totalDuration = duration;

    let currentTime = 0.05;

    rawWords.forEach((word, wordIndex) => {
      const wordWeight = word.length / totalChars;
      const wordDuration = Math.max(duration * wordWeight, 0.16);
      const wordStart = currentTime;
      const wordEnd = wordStart + wordDuration;

      this.words.push({
        text: word,
        index: wordIndex,
        startTime: wordStart,
        endTime: wordEnd
      });

      currentTime = wordEnd + 0.03;
    });

    this.totalDuration = currentTime;
  }

  /**
   * Constructs timeline strictly from explicit audio phoneme/viseme timing segments.
   * Expected contract:
   * {
   *   audioId: "...",
   *   duration: 4.82,
   *   segments: [
   *     { start: 0.00, end: 0.08, viseme: "..." },
   *     { start: 0.08, end: 0.16, viseme: "..." }
   *   ],
   *   words: [ { text, startTime, endTime } ]
   * }
   */
  buildFromAudioSegments(timelineData) {
    if (!timelineData) return;

    this.audioId = timelineData.audioId || null;
    this.totalDuration = timelineData.duration || 0;

    if (Array.isArray(timelineData.segments)) {
      this.events = timelineData.segments.map(seg => ({
        viseme: seg.viseme,
        shape: VISEMES[seg.viseme] || VISEMES.SILENCE,
        startTime: seg.start,
        endTime: seg.end
      }));
    } else {
      this.events = [];
    }

    if (Array.isArray(timelineData.words)) {
      this.words = timelineData.words.map((w, idx) => ({
        text: w.text,
        index: idx,
        startTime: w.startTime ?? w.start,
        endTime: w.endTime ?? w.end
      }));
    }
  }

  /**
   * Samples blended facial morph weights at time t.
   * If no explicit audio segments exist, strictly returns neutral silence.
   */
  sample(t) {
    // If no real segments exist, neutral silence
    if (this.events.length === 0 || t < 0) {
      // Find current word for subtitles if words exist
      let currentWordIndex = -1;
      for (let i = 0; i < this.words.length; i++) {
        if (t >= this.words[i].startTime && t <= this.words[i].endTime) {
          currentWordIndex = i;
          break;
        }
        if (t > this.words[i].endTime) {
          currentWordIndex = i;
        }
      }

      return {
        weights: { ...VISEMES.SILENCE },
        currentWordIndex,
        isFinished: t >= this.totalDuration
      };
    }

    if (t >= this.totalDuration) {
      return {
        weights: { ...VISEMES.SILENCE },
        currentWordIndex: this.words.length - 1,
        isFinished: true
      };
    }

    // Determine current word for transcript tracking
    let currentWordIndex = -1;
    for (let i = 0; i < this.words.length; i++) {
      if (t >= this.words[i].startTime && t <= this.words[i].endTime) {
        currentWordIndex = i;
        break;
      }
      if (t > this.words[i].endTime) {
        currentWordIndex = i;
      }
    }

    // Find active viseme event from actual speech segments
    let activeIdx = 0;
    for (let i = 0; i < this.events.length; i++) {
      if (t >= this.events[i].startTime && t <= this.events[i].endTime) {
        activeIdx = i;
        break;
      }
      if (t < this.events[i].startTime) {
        activeIdx = Math.max(0, i - 1);
        break;
      }
    }

    const currentEvent = this.events[activeIdx];
    const nextEvent = this.events[activeIdx + 1] || currentEvent;

    const eventDuration = Math.max(currentEvent.endTime - currentEvent.startTime, 0.04);
    const progress = Math.min(Math.max((t - currentEvent.startTime) / eventDuration, 0), 1);
    const blend = 0.5 - (0.5 * Math.cos(progress * Math.PI));

    const keys = ['jawOpen', 'lipWidth', 'lipPucker', 'upperLipRaise', 'lowerLipDepress', 'lipClose', 'mouthCornerPull', 'chinRaise'];
    const blended = {};

    keys.forEach(k => {
      const valA = currentEvent.shape[k] ?? 0;
      const valB = nextEvent.shape[k] ?? 0;
      blended[k] = valA + (valB - valA) * blend;
    });

    return {
      weights: blended,
      currentWordIndex,
      isFinished: false
    };
  }
}
