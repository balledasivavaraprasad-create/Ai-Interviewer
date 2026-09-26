/**
 * Controls whole-body and head micro-motion: natural breathing cycle, attentive listening nods,
 * thinking head tilt, and speech cadence gestures.
 */
export class InterviewerAnimationController {
  constructor() {
    this.headOffset = { x: 0, y: 0 };
    this.headTilt = 0;
    this.nodProgress = 0;
    this.isNodding = false;
    this.nextNodTime = 4.5;
  }

  update(delta, time, state, isSpeaking, speechEnergy = 0) {
    let targetX = 0;
    let targetY = 0;
    let targetTilt = 0;
    let breathIntensity = 0.052;

    switch (state) {
      case 'SPEAKING':
        // Rhythmic conversational gestures aligned with cadence
        targetX = Math.sin(time * 1.7) * 0.012 + Math.cos(time * 0.8) * 0.007;
        targetY = Math.sin(time * 1.5) * 0.009 + (speechEnergy * 0.012);
        targetTilt = Math.sin(time * 1.2) * 0.008;
        breathIntensity = 0.065;
        break;

      case 'LISTENING':
        // Attentive posture with occasional affirmative micro-nod
        if (!this.isNodding && time >= this.nextNodTime) {
          this.isNodding = true;
          this.nodProgress = 0;
        }

        let nodY = 0;
        if (this.isNodding) {
          this.nodProgress += delta * 2.8; // ~700ms micro-nod
          if (this.nodProgress >= 1.0) {
            this.isNodding = false;
            this.nextNodTime = time + 4.5 + Math.random() * 4.0;
          } else {
            // Smooth bell curve nod down then up
            nodY = -Math.sin(this.nodProgress * Math.PI) * 0.016;
          }
        }

        targetX = Math.sin(time * 0.45) * 0.004;
        targetY = 0.005 + nodY;
        targetTilt = Math.sin(time * 0.3) * 0.003;
        breathIntensity = 0.046;
        break;

      case 'THINKING':
        // Slight upward-right contemplation drift
        targetX = 0.014 + Math.sin(time * 0.35) * 0.004;
        targetY = 0.010 + Math.cos(time * 0.4) * 0.003;
        targetTilt = 0.012;
        breathIntensity = 0.040;
        break;

      case 'IDLE':
      default:
        // Natural resting breathing drift
        targetX = Math.sin(time * 0.38) * 0.007 + Math.cos(time * 0.65) * 0.004;
        targetY = Math.sin(time * 0.28) * 0.005;
        targetTilt = Math.sin(time * 0.25) * 0.004;
        breathIntensity = 0.052;
        break;
    }

    // Smooth dampening
    const lerpSpeed = Math.min(delta * 8, 1.0);
    this.headOffset.x += (targetX - this.headOffset.x) * lerpSpeed;
    this.headOffset.y += (targetY - this.headOffset.y) * lerpSpeed;
    this.headTilt += (targetTilt - this.headTilt) * lerpSpeed;

    return {
      headOffset: this.headOffset,
      headTilt: this.headTilt,
      breathIntensity
    };
  }
}
