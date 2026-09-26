import { SpeechEngine } from '../../services/speech/SpeechEngine';

/**
 * Controller for organic mouth and jaw viseme animation.
 * Smooths phonetic transitions and prevents mechanical snapping.
 */
export class InterviewerLipSyncController {
  constructor() {
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
    this.unsubscribe = null;
    this.isSpeaking = false;
  }

  init() {
    this.unsubscribe = SpeechEngine.subscribe((data) => {
      this.isSpeaking = data.isSpeaking;
      if (data.isSpeaking && data.weights) {
        this.targetWeights = { ...data.weights };
      } else {
        // Return to resting neutral
        this.targetWeights = {
          jawOpen: 0,
          lipWidth: 0,
          lipPucker: 0,
          upperLipRaise: 0,
          lowerLipDepress: 0,
          lipClose: 0,
          mouthCornerPull: 0,
          chinRaise: 0
        };
      }
    });
  }

  update(delta) {
    // Responsive smoothing factor (~18/s for snappy yet organic muscular damping)
    const factor = Math.min(delta * 22, 1.0);

    const keys = Object.keys(this.currentWeights);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const cur = this.currentWeights[k];
      const tgt = this.targetWeights[k];
      this.currentWeights[k] = cur + (tgt - cur) * factor;
    }

    return this.currentWeights;
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
