import { VISEMES, wordToVisemeList } from './VisemeDefinitions';

/**
 * Builds a timeline of timestamped visemes and word markers.
 * Implements smooth co-articulation interpolation between phonetic mouth shapes.
 */
export class VisemeTimeline {
  constructor() {
    this.events = [];
    this.words = [];
    this.totalDuration = 0;
  }

  /**
   * Constructs timeline from text and word duration estimates or boundary marks.
   */
  buildFromText(text, estimatedDuration) {
    this.events = [];
    this.words = [];

    const rawWords = text.split(/\s+/).filter(Boolean);
    if (rawWords.length === 0) return;

    // Distribute duration proportionally by word length
    const totalChars = rawWords.reduce((acc, w) => acc + w.length, 0);
    const duration = Math.max(estimatedDuration || (totalChars * 0.065), 1.2);
    this.totalDuration = duration;

    let currentTime = 0.08; // Short initial natural inhalation pause

    rawWords.forEach((word, wordIndex) => {
      const wordWeight = word.length / totalChars;
      const wordDuration = Math.max(duration * wordWeight, 0.18);
      const wordStart = currentTime;
      const wordEnd = wordStart + wordDuration;

      this.words.push({
        text: word,
        index: wordIndex,
        startTime: wordStart,
        endTime: wordEnd
      });

      const visemeKeys = wordToVisemeList(word);
      const visemeSliceDuration = (wordDuration * 0.88) / visemeKeys.length;

      visemeKeys.forEach((key, vIdx) => {
        const shape = VISEMES[key] || VISEMES.E;
        const vStart = wordStart + (vIdx * visemeSliceDuration);
        const vEnd = vStart + visemeSliceDuration;

        this.events.push({
          viseme: key,
          shape: shape,
          startTime: vStart,
          endTime: vEnd,
          wordIndex: wordIndex
        });
      });

      // Subtle inter-word micro-pause
      currentTime = wordEnd + 0.04;
    });

    // Ensure final return to silence
    this.events.push({
      viseme: 'SILENCE',
      shape: VISEMES.SILENCE,
      startTime: currentTime,
      endTime: currentTime + 0.4,
      wordIndex: rawWords.length - 1
    });

    this.totalDuration = currentTime + 0.4;
  }

  /**
   * Constructs timeline from explicit backend phoneme timestamps.
   */
  buildFromBackendEvents(events, words, duration) {
    this.events = events.map(e => ({
      viseme: e.viseme,
      shape: VISEMES[e.viseme] || VISEMES.E,
      startTime: e.startTime,
      endTime: e.endTime,
      wordIndex: e.wordIndex || 0
    }));
    this.words = words || [];
    this.totalDuration = duration || (events[events.length - 1]?.endTime ?? 0);
  }

  /**
   * Samples blended facial morph weights at time t with co-articulation smoothing.
   */
  sample(t) {
    if (this.events.length === 0 || t < 0) {
      return { weights: { ...VISEMES.SILENCE }, currentWordIndex: -1, isFinished: false };
    }

    if (t >= this.totalDuration) {
      return { weights: { ...VISEMES.SILENCE }, currentWordIndex: this.words.length - 1, isFinished: true };
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

    // Find active event
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

    // Smooth blend between current and next viseme (cosine blend for organic muscle transition)
    const eventDuration = Math.max(currentEvent.endTime - currentEvent.startTime, 0.05);
    const progress = Math.min(Math.max((t - currentEvent.startTime) / eventDuration, 0), 1);
    const blend = 0.5 - (0.5 * Math.cos(progress * Math.PI)); // Cosine ease in/out

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
