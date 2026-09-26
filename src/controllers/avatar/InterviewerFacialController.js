/**
 * Controls secondary facial animation: organic blinks, eyebrow expressions, and subtle eye saccades.
 */
export class InterviewerFacialController {
  constructor() {
    this.blinkValue = 0.0;
    this.isBlinking = false;
    this.blinkProgress = 0.0;
    this.nextBlinkTime = 2.0;

    this.eyebrowRaise = 0.0;
    this.targetEyebrow = 0.0;

    this.cheekRaise = 0.0;
    this.gazeOffset = { x: 0, y: 0 };
    this.nextGazeShiftTime = 4.0;
  }

  update(delta, time, state, isSpeaking, speechEnergy = 0) {
    // -------------------------------------------------------------------------
    // 1. Natural Organic Blinking Loop
    // -------------------------------------------------------------------------
    if (!this.isBlinking && time >= this.nextBlinkTime) {
      this.isBlinking = true;
      this.blinkProgress = 0.0;
    }

    if (this.isBlinking) {
      // Natural blink duration ~130ms (7.7 progress/sec)
      this.blinkProgress += delta * 7.7;
      if (this.blinkProgress >= 1.0) {
        this.isBlinking = false;
        this.blinkValue = 0.0;
        // Random interval between 3.2s and 5.8s
        this.nextBlinkTime = time + 3.2 + Math.random() * 2.6;
      } else {
        // Bell curve for upper eyelid closure
        this.blinkValue = Math.sin(this.blinkProgress * Math.PI);
      }
    }

    // -------------------------------------------------------------------------
    // 2. Eyebrow Micro-Expressions
    // -------------------------------------------------------------------------
    if (isSpeaking) {
      // Subtle conversational inflection with voice energy
      this.targetEyebrow = Math.sin(time * 2.1) * 0.12 * speechEnergy + 0.04;
    } else if (state === 'THINKING') {
      // Slight concentration furrow
      this.targetEyebrow = -0.06 + Math.sin(time * 0.5) * 0.03;
    } else if (state === 'LISTENING') {
      // Attentive slight openness
      this.targetEyebrow = 0.04 + Math.sin(time * 0.6) * 0.02;
    } else {
      this.targetEyebrow = 0.0;
    }

    this.eyebrowRaise += (this.targetEyebrow - this.eyebrowRaise) * Math.min(delta * 6, 1.0);

    // -------------------------------------------------------------------------
    // 3. Eye Micro-Saccades (Human Gaze Drifting)
    // -------------------------------------------------------------------------
    if (time >= this.nextGazeShiftTime) {
      this.nextGazeShiftTime = time + 2.5 + Math.random() * 3.0;
      this.gazeOffset.x = (Math.random() - 0.5) * 0.008;
      this.gazeOffset.y = (Math.random() - 0.5) * 0.005;
    }

    // -------------------------------------------------------------------------
    // 4. Subtle Cheek Movement
    // -------------------------------------------------------------------------
    this.cheekRaise = isSpeaking ? speechEnergy * 0.15 : 0.0;

    return {
      blink: this.blinkValue,
      eyebrowRaise: this.eyebrowRaise,
      cheekRaise: this.cheekRaise,
      gazeOffset: this.gazeOffset
    };
  }
}
