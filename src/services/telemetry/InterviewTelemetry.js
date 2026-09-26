/**
 * High-Resolution Telemetry & Timestamp Coordinator.
 * 
 * Provides consistent clock timestamps (performance.now() and ISO 8601)
 * across all interview lifecycle events:
 * - interviewStartedAt
 * - questionStartedAt
 * - questionAudioStartedAt
 * - questionAudioEndedAt
 * - candidateSpeechStartedAt
 * - candidateSpeechEndedAt
 * - transcriptReceivedAt
 * - interviewerResponseStartedAt
 */
class InterviewTelemetryService {
  constructor() {
    this.sessionOriginTime = performance.now();
    this.events = [];
    this.timestamps = {
      interviewStartedAt: null,
      cameraInitializedAt: null,
      questionStartedAt: null,
      questionAudioStartedAt: null,
      questionAudioEndedAt: null,
      candidateSpeechStartedAt: null,
      candidateSpeechEndedAt: null,
      transcriptReceivedAt: null,
      interviewerResponseStartedAt: null
    };
    this.listeners = new Set();
  }

  reset() {
    this.sessionOriginTime = performance.now();
    this.events = [];
    this.timestamps = {
      interviewStartedAt: null,
      cameraInitializedAt: null,
      questionStartedAt: null,
      questionAudioStartedAt: null,
      questionAudioEndedAt: null,
      candidateSpeechStartedAt: null,
      candidateSpeechEndedAt: null,
      transcriptReceivedAt: null,
      interviewerResponseStartedAt: null
    };
    this.notify();
  }

  createTimestampRecord() {
    const hr = performance.now();
    const sessionSec = (hr - this.sessionOriginTime) / 1000.0;
    return {
      hr: Number(hr.toFixed(3)),
      sessionSeconds: Number(sessionSec.toFixed(3)),
      iso: new Date().toISOString()
    };
  }

  recordEvent(eventName, metadata = {}) {
    const record = this.createTimestampRecord();
    const eventObj = {
      event: eventName,
      timestamp: record,
      metadata
    };

    this.events.push(eventObj);

    if (eventName in this.timestamps) {
      this.timestamps[eventName] = record;
    }

    this.notify();
    return record;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.getSnapshot());
    return () => this.listeners.delete(callback);
  }

  notify() {
    const snapshot = this.getSnapshot();
    this.listeners.forEach(cb => {
      try {
        cb(snapshot);
      } catch (e) {
        console.error('Error in telemetry listener:', e);
      }
    });
  }

  getSnapshot() {
    return {
      sessionOriginTime: this.sessionOriginTime,
      currentSessionSeconds: (performance.now() - this.sessionOriginTime) / 1000.0,
      timestamps: { ...this.timestamps },
      recentEvents: this.events.slice(-10)
    };
  }
}

export const InterviewTelemetry = new InterviewTelemetryService();
