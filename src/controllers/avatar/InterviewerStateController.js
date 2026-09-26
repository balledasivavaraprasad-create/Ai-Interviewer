import { SpeechEngine } from '../../services/speech/SpeechEngine';

export const STATES = {
  IDLE: 'IDLE',
  THINKING: 'THINKING',
  SPEAKING: 'SPEAKING',
  LISTENING: 'LISTENING'
};

/**
 * Authoritative state machine for interviewer conversational and animation lifecycle.
 */
export class InterviewerStateController {
  constructor(onStateChange) {
    this.currentState = STATES.IDLE;
    this.onStateChange = onStateChange;
    this.prepTimeout = null;
  }

  getState() {
    return this.currentState;
  }

  setState(newState) {
    if (this.currentState === newState) return;
    this.currentState = newState;
    if (this.onStateChange) {
      this.onStateChange(newState);
    }
  }

  /**
   * Prepares and starts speaking with natural human cadence transition.
   */
  startSpeakingSequence(text, gender, onComplete) {
    if (this.prepTimeout) {
      clearTimeout(this.prepTimeout);
    }

    // Step 1: Subtle natural preparation/thinking posture shift (240ms)
    this.setState(STATES.THINKING);

    this.prepTimeout = setTimeout(() => {
      // Step 2: Begin actual speech and viseme timeline
      this.setState(STATES.SPEAKING);

      SpeechEngine.speak(text, {
        gender: gender,
        onStart: () => {
          this.setState(STATES.SPEAKING);
        },
        onEnd: () => {
          // Step 3: Natural settle into LISTENING state
          this.setState(STATES.LISTENING);
          if (onComplete) onComplete();
        },
        onError: () => {
          this.setState(STATES.LISTENING);
          if (onComplete) onComplete();
        }
      });
    }, 280);
  }

  /**
   * Immediately stops any speech and returns safely to LISTENING or IDLE.
   */
  stop(targetState = STATES.LISTENING) {
    if (this.prepTimeout) {
      clearTimeout(this.prepTimeout);
      this.prepTimeout = null;
    }
    SpeechEngine.stop();
    this.setState(targetState);
  }

  dispose() {
    if (this.prepTimeout) {
      clearTimeout(this.prepTimeout);
      this.prepTimeout = null;
    }
    SpeechEngine.stop();
  }
}
