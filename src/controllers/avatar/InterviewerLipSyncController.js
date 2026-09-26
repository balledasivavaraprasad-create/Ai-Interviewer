import { GlobalAudioVisemeEngine } from '../../services/speech/AudioVisemeSyncEngine';

/**
 * Controller for organic mouth and jaw viseme animation.
 * Strictly derives state from the Audio-Clock Driven Viseme Engine.
 * Does NOT generate fake mouth movement from text or timers.
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
  }

  init() {
    // Engine is initialized; target weights start at resting neutral
    GlobalAudioVisemeEngine.reset();
  }

  /**
   * Called on every render frame with delta time.
   * Samples strictly from the active audio clock.
   */
  update(delta) {
    this.currentWeights = GlobalAudioVisemeEngine.update(delta);
    return this.currentWeights;
  }

  dispose() {
    GlobalAudioVisemeEngine.reset();
  }
}
